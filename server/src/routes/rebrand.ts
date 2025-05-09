import { Hono } from "hono"
import { getAuth } from "../lib/get-auth.js"
import { slugify } from "@tryghost/string"
import { type JobState } from "bullmq"
import { rebrandQueue } from "../lib/rebrand-queue.js"
import { getRedisSetKey } from "../lib/constants.js"
import { getJobs } from "../lib/get-jobs.js"
import { createGhostToken } from "../encryption.js"

type GhostFetchOpts = {
	realm: string
	resource: string
	query: string
	ghostSession?: string
	adminKey?: string
	origin: string
}
const ghostFetch = async ({
	realm,
	resource,
	query,
	ghostSession,
	adminKey,
	origin
}: GhostFetchOpts) => {
	let headers: HeadersInit = { Origin: origin }
	let bearerToken

	if (adminKey) {
		bearerToken = await createGhostToken(adminKey)
		headers.Authorization = `Ghost ${bearerToken}`
	} else if (ghostSession) {
		headers.Cookie = ghostSession
	}
	const url = `${realm}/ghost/api/admin/${resource}?${query}`
	return fetch(url, {
		credentials: "include",
		headers
	})
}

type BaseCountParams = {
	realm: string
	oldBrand: string
	origin: string
	ghostSession?: string
	adminKey?: string
}

const filterFriendlyString = (string: string) => string.replace(/'/g, "\\'")

type GetCountParams = {
	resource: "posts" | "pages" | "tags" | "tiers" | "newsletters"
	extraFields: string[]
}

// yay currying!
const getCount =
	({ resource, extraFields = [] }: GetCountParams) =>
	async ({
		realm,
		oldBrand,
		ghostSession,
		origin,
		adminKey
	}: BaseCountParams) => {
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

		return ghostFetch({
			realm,
			resource,
			query,
			ghostSession,
			adminKey,
			origin
		})
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

const app = new Hono()
	.basePath("/rebrand")
	.post("/check", async (c) => {
		const { realm, ghostSession, adminKey } = getAuth(c)

		try {
			const { oldBrand, newBrand } = await c.req.json<{
				oldBrand: string
				newBrand: string
			}>()

			const origin = new URL(c.req.url).origin
			const commonArgs = { realm, oldBrand, ghostSession, adminKey, origin }

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
		const { realm, ghostSession, adminKey } = getAuth(c)

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

			const jobs = await getJobs(realm)
			if (
				jobs.some(
					(j) => (j.state as JobState) !== "completed" && j.state !== "failed"
				)
			) {
				return c.json(
					{
						success: false,
						message: `Another rebrand for ${realm} is already running.`
					},
					400
				)
			}

			const origin = new URL(c.req.url).origin
			const job = await rebrandQueue.add("rebrand", {
				title: `Rebrand from ${oldBrand} to ${newBrand}`,
				realm,
				// don't love this, but it's secure as long as an attacker
				// doesn't have the Ghost server decrypt key
				ghostSession,
				adminKey,
				oldBrand,
				newBrand,
				origin
			})

			const redisClient = await rebrandQueue.client
			await redisClient.sadd(getRedisSetKey(realm), job.id!)

			return c.json({ success: true, data: { jobId: job.id! } }, 200)
		} catch (error) {
			console.error("Rebrand commit error:", error)
			return c.json({ success: false, message: "Server error" }, 500)
		}
	})

export { app as rebrandRoute }
