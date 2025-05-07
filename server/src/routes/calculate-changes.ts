import { Hono } from "hono"
import { getAuth } from "../lib/get-auth.js"
import { slugify } from "@tryghost/string"

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
	resource: "posts" | "pages" | "tags"
	extraFields: string[]
}
// yay currying!
const getCount =
	({ resource, extraFields = [] }: GetCountParams) =>
	async ({ realm, oldBrand, ghostSession, origin }: BaseCountParams) => {
		const fields = ["id", ...extraFields].join(",")

		const filters = {
			posts: `plaintext:~'${oldBrand}',title:~'${oldBrand}'`,
			pages: `plaintext:~'${oldBrand}',title:~'${oldBrand}'`,
			tags: `name:~'${filterFriendlyString(
				oldBrand
			)}',slug:~'${filterFriendlyString(slugify(oldBrand))}'`
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
	.basePath("/calculate-changes")
	.get("/posts", async (c) => {
		const { realm, ghostSession } = getAuth(c)

		try {
			const ghostRes = await fetch(
				`${realm}/ghost/api/admin/posts?limit=1&fields=id,title,lexical&formats=plaintext`,
				{
					credentials: "include",
					headers: {
						Cookie: ghostSession,
						Origin: new URL(c.req.url).origin
					}
				}
			)

			if (!ghostRes.ok) {
				return c.json({ success: false, message: "Failed to fetch posts" }, 500)
			}

			const posts = await ghostRes.json()

			return c.json({ success: true, posts: posts.posts })
		} catch (error) {
			console.error("Posts fetch error:", error)
			return c.json({ success: false, message: "Server error" }, 500)
		}
	})
	.post("/", async (c) => {
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

			const [postRes, pageRes, tagRes] = await Promise.all([
				getPostCount(commonArgs),
				getPageCount(commonArgs),
				getTagCount(commonArgs)
			])

			const errors = [
				!postRes.ok && "Failed to fetch posts.",
				!pageRes.ok && "Failed to fetch pages.",
				!tagRes.ok && "Failed to fetch tags."
			].filter(Boolean)

			if (errors.length > 0) {
				return c.json({ success: false, message: errors.join(" ") }, 500)
			}

			const [postData, pageData, tagData] = await Promise.all([
				postRes.json(),
				pageRes.json(),
				tagRes.json()
			])

			const counts = {
				posts: postData.meta.pagination.total,
				pages: pageData.meta.pagination.total,
				tags: tagData.meta.pagination.total
			}
			return c.json({ success: true, data: counts }, 200)
		} catch (error) {
			console.error("Calculate changes error:", error)
			return c.json({ success: false, message: "Server error" }, 500)
		}
	})

export { app as calculateChangesRoute }
