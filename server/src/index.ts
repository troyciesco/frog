import "dotenv/config"
import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { adminRoute } from "./routes/admin.js"
import { authRoute } from "./routes/auth.js"

export const app = new Hono()
	.use(
		"*",
		cors({
			origin: process.env.ALLOWED_ORIGINS!.split(",").map((s) => s.trim()),
			credentials: true,
			allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization"]
		})
	)
	.get("/", (c) => {
		return c.json({ message: "Hello Hono!" })
	})
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
