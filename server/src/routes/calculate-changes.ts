import { Hono } from "hono"
import { getAuth } from "../lib/get-auth.js"

const app = new Hono()
	.basePath("/calculate-changes")
	.get("/", async (c) => {
		const { realm, ghostSession } = getAuth(c)

		try {
			const ghostRes = await fetch(`${realm}/ghost/api/admin/posts?limit=1`, {
				credentials: "include",
				headers: {
					Cookie: ghostSession,
					Origin: new URL(c.req.url).origin
				}
			})

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
		return c.json({ success: true, message: "Not implemented" }, 200)
	})

export { app as calculateChangesRoute }
