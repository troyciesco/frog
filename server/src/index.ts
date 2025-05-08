import "dotenv/config"
import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { adminRoute } from "./routes/admin.js"
import { authRoute } from "./routes/auth.js"
import { csrf } from "hono/csrf"
import { secureHeaders } from "hono/secure-headers"
import { authMiddleware } from "./middleware/auth-middleware.js"
import { rebrandRoute } from "./routes/rebrand.js"

const origin = process.env.ALLOWED_ORIGINS!.split(",").map((s) => s.trim())

export const app = new Hono()
	.use(secureHeaders())
	.use(csrf({ origin }))
	// TODO: revisit and see if there's more i can add here that's helpful
	.use(
		cors({
			origin,
			credentials: true
		})
	)
	.get("/", (c) => {
		return c.json({ message: "Hello Hono!" })
	})
	.use("/rebrand/*", authMiddleware)
	// TODO: this is a bad spot for this, but putting it in the auth file breaks typesafety in tests
	.use("/auth/sign-out", authMiddleware)
	.route("/", rebrandRoute)
	.route("/", adminRoute)
	.route("/", authRoute)

serve(
	{
		fetch: app.fetch,
		port: parseInt(process.env.PORT!)
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`)
	}
)
