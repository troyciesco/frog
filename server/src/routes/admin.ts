import { createBullBoard } from "@bull-board/api"
import { HonoAdapter } from "@bull-board/hono"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"
import { serveStatic } from "@hono/node-server/serve-static"
import { Queue } from "bullmq"
import { Hono } from "hono"
import { Redis } from "ioredis"

const connection = new Redis(
	process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
	{
		maxRetriesPerRequest: null,
		family: 0,
		enableReadyCheck: true
	}
)

const queue = new Queue("test-queue", { connection })

const serverAdapter = new HonoAdapter(serveStatic)

createBullBoard({
	queues: [new BullMQAdapter(queue)],
	serverAdapter
})
serverAdapter.setBasePath("/admin/job-ui")

const app = new Hono()
	.basePath("/admin")
	.route("/job-ui", serverAdapter.registerPlugin())
	.post("/add", async (c) => {
		await queue.add("Add", { title: c.req.query("title") })

		return c.json({ ok: true })
	})

export { app as route }
