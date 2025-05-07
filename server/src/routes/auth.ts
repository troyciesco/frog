import { Hono } from "hono"
import { encrypt } from "../encryption.js"
import { COOKIE_NAME } from "../lib/constants.js"

const app = new Hono().basePath("/auth").post("/sign-in", async (c) => {
	try {
		const { realm, email, password } = await c.req.json()

		const res = await fetch(`${realm}/ghost/api/admin/session`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:2222"
			},
			body: JSON.stringify({ username: email, password })
		})

		if (!res.ok) {
			return c.json(
				{
					success: false,
					message:
						"Sign in failed. Check your credentials and make sure you're using a Ghost site."
				},
				401
			)
		}

		const ghostSession = res.headers
			.getSetCookie()
			?.find((c) => c.startsWith("ghost-admin-api-session="))

		if (!ghostSession) {
			return c.json(
				{ success: false, message: "Failed to get Ghost session" },
				500
			)
		}

		const session = await encrypt({ email, realm, ghostSession })

		c.header(
			"Set-Cookie",
			`${COOKIE_NAME}=${session}; HttpOnly; Path=/; SameSite=Lax; Secure`
		)

		return c.json({
			success: true,
			message: "Authentication successful",
			user: { email, realm }
		})
	} catch (error) {
		console.error("Sign in error:", error)
		return c.json({ success: false, message: "Server error" }, 500)
	}
})

export { app as authRoute }
