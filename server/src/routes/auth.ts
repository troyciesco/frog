import { Hono } from "hono"
import { encrypt } from "../encryption.js"
import { SESSION_COOKIE_NAME } from "../lib/constants.js"
import { getAuth } from "../lib/get-auth.js"
import { authMiddleware } from "../middleware/auth-middleware.js"

const app = new Hono()
	.basePath("/auth")
	.post("/sign-in", async (c) => {
		try {
			const { realm: realmField, email, password } = await c.req.json()

			if (
				!realmField.startsWith("http://") &&
				!realmField.startsWith("https://")
			) {
				return c.json(
					{
						success: false,
						message: "Realm must start with http:// or https://"
					},
					400
				)
			}

			const realm = realmField.endsWith("/")
				? realmField.slice(0, -1)
				: realmField

			const res = await fetch(`${realm}/ghost/api/admin/session`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Origin: new URL(c.req.url).origin
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
				?.find((cookie) => cookie.startsWith("ghost-admin-api-session="))

			if (!ghostSession) {
				return c.json(
					{ success: false, message: "Failed to get Ghost session" },
					500
				)
			}

			const session = await encrypt({ email, realm, ghostSession })

			c.header(
				"Set-Cookie",
				`${SESSION_COOKIE_NAME}=${session}; HttpOnly; Path=/; SameSite=Lax; Secure`
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
	.post("/sign-out", async (c) => {
		const { realm, ghostSession } = getAuth(c)

		try {
			const res = await fetch(`${realm}/ghost/api/admin/session`, {
				method: "DELETE",
				credentials: "include",
				headers: {
					Cookie: ghostSession,
					Origin: new URL(c.req.url).origin
				}
			})

			if (!res.ok) {
				console.warn(
					"Deleting the session in Ghost was unsuccessful. Continuing to delete the session on this server."
				)
			}

			c.header(
				"Set-Cookie",
				`${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=0`
			)

			return c.json({
				success: true,
				message: "Sign out successful"
			})
		} catch (error) {
			console.error("Sign out error:", error)
			return c.json({ success: false, message: "Server error" }, 500)
		}
	})

export { app as authRoute }
