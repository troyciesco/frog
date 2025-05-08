import { createBullBoard } from "@bull-board/api"
import { HonoAdapter } from "@bull-board/hono"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js"
import { serveStatic } from "@hono/node-server/serve-static"
import { Queue } from "bullmq"
import { Hono } from "hono"
import { connection } from "../lib/redis-connection.js"
import { rebrandQueue } from "../lib/rebrand-queue.js"

const queue = new Queue("test-queue", { connection })

const serverAdapter = new HonoAdapter(serveStatic)

createBullBoard({
	queues: [new BullMQAdapter(queue), new BullMQAdapter(rebrandQueue)],
	serverAdapter
})
serverAdapter.setBasePath("/admin/job-ui")

const app = new Hono()
	.basePath("/admin")
	.route("/job-ui", serverAdapter.registerPlugin())
	.post("/add", async (c) => {
		await queue.add(crypto.randomUUID(), { title: c.req.query("title") })

		return c.json({ ok: true })
	})

export { app as adminRoute }
