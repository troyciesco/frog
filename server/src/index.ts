import "dotenv/config"
import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { route as adminRoute } from "./routes/admin.js"

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

app.route("/", adminRoute)

serve(
	{
		fetch: app.fetch,
		port: parseInt(process.env.PORT!)
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`)
	}
)
