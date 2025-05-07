import { getCookie } from "hono/cookie"
import { createMiddleware } from "hono/factory"
import { verifySession } from "../encryption.js"
import { SESSION_COOKIE_NAME } from "../lib/constants.js"

export const authMiddleware = createMiddleware<{
	Variables: {
		auth: () => { realm: string; ghostSession: string }
	}
}>(async (c, next) => {
	console.log("hit auth mid")
	const sessionCookie = getCookie(c, SESSION_COOKIE_NAME)

	const session = await verifySession(sessionCookie)
	if (!session) {
		return c.json({ success: false, message: "Unauthorized" }, 401)
	}

	const { realm, ghostSession } = session
	c.set("auth", () => ({ realm, ghostSession }))
	await next()
})
