import { Hono } from "hono"
import { getAuth } from "../lib/get-auth.js"
import { slugify } from "@tryghost/string"
import { Queue } from "bullmq"
import { connection } from "../lib/redis-connection.js"

type GhostFetchOpts = {
	realm: string
	resource: string
	query: string
	ghostSession: string
	origin: string
}
const ghostFetch = async ({
	realm,
	resource,
	query,
	ghostSession,
	origin
}: GhostFetchOpts) => {
	const url = `${realm}/ghost/api/admin/${resource}?${query}`
	return fetch(url, {
		credentials: "include",
		headers: {
			Cookie: ghostSession,
			Origin: origin
		}
	})
}

type BaseCountParams = {
	realm: string
	oldBrand: string
	ghostSession: string
	origin: string
}

const filterFriendlyString = (string: string) => string.replace(/'/g, "\\'")

type GetCountParams = {
	resource: "posts" | "pages" | "tags" | "tiers" | "newsletters"
	extraFields: string[]
}

// yay currying!
const getCount =
	({ resource, extraFields = [] }: GetCountParams) =>
	async ({ realm, oldBrand, ghostSession, origin }: BaseCountParams) => {
		const fields = ["id", ...extraFields].join(",")

		const filterFriendlyOldBrand = filterFriendlyString(oldBrand)
		const filters = {
			posts: `plaintext:~'${filterFriendlyOldBrand}',title:~'${filterFriendlyOldBrand}'`,
			pages: `plaintext:~'${filterFriendlyOldBrand}',title:~'${filterFriendlyOldBrand}'`,
			tags: `name:~'${filterFriendlyOldBrand}',slug:~'${filterFriendlyString(
				slugify(oldBrand)
			)}'`,
			tiers: `name:~'${filterFriendlyOldBrand}'`,
			newsletters: `name:~'${filterFriendlyOldBrand}'`
		}

		const query = new URLSearchParams({
			limit: "1",
			fields,
			include: "none",
			filter: filters[resource]
		}).toString()

		return ghostFetch({ realm, resource, query, ghostSession, origin })
	}

const getPostCount = getCount({
	resource: "posts",
	extraFields: ["updated_at", "title"]
})
const getPageCount = getCount({
	resource: "pages",
	extraFields: ["updated_at", "title"]
})
const getTagCount = getCount({
	resource: "tags",
	extraFields: ["name", "slug"]
})

const getTierCount = getCount({
	resource: "tiers",
	extraFields: []
})
const getNewsletterCount = getCount({
	resource: "newsletters",
	extraFields: []
})

const validatePayload = ({
	oldBrand,
	newBrand
}: {
	oldBrand: string
	newBrand: string
}) => {
	const messages = [
		!oldBrand && "oldBrand is required.",
		!newBrand && "newBrand is required."
	].filter(Boolean)

	// if the fields are missing entirely, don't bother with the rest of the checks
	if (messages.length > 0) {
		return messages.join(" ")
	}

	if (oldBrand.trim().length > 100 || newBrand.trim().length > 100) {
		messages.push("oldBrand and newBrand must be 100 characters or less.")
	}

	if (oldBrand.trim() === newBrand.trim()) {
		messages.push("oldBrand and newBrand are the same value.")
	}

	if (messages.length > 0) {
		return messages.join(" ")
	}

	return ""
}

const queue = new Queue("rebrand", { connection })

const app = new Hono()
	.basePath("/rebrand")
	.post("/check", async (c) => {
		const { realm, ghostSession } = getAuth(c)

		try {
			const { oldBrand, newBrand } = await c.req.json<{
				oldBrand: string
				newBrand: string
			}>()

			const origin = new URL(c.req.url).origin
			const commonArgs = { realm, oldBrand, ghostSession, origin }

			const payloadValidationMessage = validatePayload({ oldBrand, newBrand })

			if (payloadValidationMessage) {
				return c.json(
					{ success: false, message: payloadValidationMessage },
					400
				)
			}

			// note: offers feel historical, so i didn't include those. but pattern to add would be the same.
			const [postRes, pageRes, tagRes, tierRes, newsletterRes] =
				await Promise.all([
					getPostCount(commonArgs),
					getPageCount(commonArgs),
					getTagCount(commonArgs),
					getTierCount(commonArgs),
					getNewsletterCount(commonArgs)
				])

			const errors = [
				!postRes.ok && "Failed to fetch posts.",
				!pageRes.ok && "Failed to fetch pages.",
				!tagRes.ok && "Failed to fetch tags.",
				!tierRes.ok && "Failed to fetch tiers.",
				!tierRes.ok && "Failed to fetch newsletters."
			].filter(Boolean)

			if (errors.length > 0) {
				return c.json({ success: false, message: errors.join(" ") }, 500)
			}

			const [postData, pageData, tagData, tierData, newsletterData] =
				await Promise.all([
					postRes.json(),
					pageRes.json(),
					tagRes.json(),
					tierRes.json(),
					newsletterRes.json()
				])

			const siteRes = await ghostFetch({
				...commonArgs,
				resource: "site",
				query: ""
			})

			const siteData = await siteRes.json()

			const site = siteData.site
				? {
						title: siteData.site.title,
						description: siteData.site.description
				  }
				: null

			const counts = {
				posts: postData.meta.pagination.total,
				pages: pageData.meta.pagination.total,
				tags: tagData.meta.pagination.total,
				tiers: tierData.meta.pagination.total,
				newsletters: newsletterData.meta.pagination.total
			}

			// Nice to have, shouldn't fail the entire process
			// checks how frequently the new brand is used against some Google-related tracking of usage of words
			let frequency = null
			try {
				const wordRes = await fetch(
					`https://api.datamuse.com/words?sp=${newBrand}&qe=sp&md=f&max=1`
				)
				const wordData = await wordRes.json()

				const frequencyTag = wordData[0]?.tags?.find((t: string) =>
					t.startsWith("f:")
				)

				frequency = frequencyTag ? parseFloat(frequencyTag.substring(2)) : null
			} catch (error) {
				console.error("Word frequency lookup failed:", error)
			}

			return c.json({ success: true, data: { counts, site, frequency } }, 200)
		} catch (error) {
			console.error("Rebrand check error:", error)
			return c.json({ success: false, message: "Server error" }, 500)
		}
	})
	.post("/commit", async (c) => {
		const { realm } = getAuth(c)

		try {
			const { oldBrand, newBrand } = await c.req.json<{
				oldBrand: string
				newBrand: string
			}>()

			const payloadValidationMessage = validatePayload({ oldBrand, newBrand })

			if (payloadValidationMessage) {
				return c.json(
					{ success: false, message: payloadValidationMessage },
					400
				)
			}

			const jobId = crypto.randomUUID()

			await queue.add(jobId, {
				title: `${realm}: Rebrand from ${oldBrand} to ${newBrand}`,
				realm
			})

			const counts = await queue.getJobCounts("wait", "completed", "failed")
			console.log(counts)
			const redisClient = await queue.client
			await redisClient.sadd(`rebrands:by-realm:${realm}`, jobId)

			return c.json({ success: true, data: { jobId } }, 200)
		} catch (error) {
			console.error("Rebrand commit error:", error)
			return c.json({ success: false, message: "Server error" }, 500)
		}
	})

export { app as rebrandRoute }
