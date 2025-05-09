import { getCookie } from "hono/cookie"
import { createMiddleware } from "hono/factory"
import { verifySession } from "../encryption.js"
import { SESSION_COOKIE_NAME } from "../lib/constants.js"

export const authMiddleware = createMiddleware<{
	Variables: {
		auth: () => { realm: string; ghostSession?: string; adminKey?: string }
	}
}>(async (c, next) => {
	const sessionCookie = getCookie(c, SESSION_COOKIE_NAME)

	const session = await verifySession(sessionCookie)
	if (!session) {
		return c.json({ success: false, message: "Unauthorized" }, 401)
	}

	// destructured because email isn't needed for the api (but it's useful for frontend)
	const { realm, ghostSession, adminKey } = session
	c.set("auth", () => ({ realm, ghostSession, adminKey }))
	await next()
})
