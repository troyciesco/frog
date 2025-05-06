import { Hono, type Context } from "hono"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { env } from "hono/adapter"
import "dotenv/config"

const app = new Hono()
app.use(
	"*",
	cors({
		origin: process.env.ALLOWED_ORIGINS!.split(",").map((s) => s.trim()),
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"]
	})
)
app.get("/", (c) => {
	return c.json({ message: "Hello Hono!" })
})

serve(
	{
		fetch: app.fetch,
		port: parseInt(process.env.PORT!)
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`)
	}
)
