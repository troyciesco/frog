import { Hono } from "hono"
import { rebrandQueue } from "../lib/rebrand-queue.js"
import { getAuth } from "../lib/get-auth.js"
import { getRedisSetKey } from "../lib/constants.js"

const app = new Hono()
	.basePath("/jobs")
	.get("/", async (c) => {
		const { realm } = getAuth(c)
		const redisClient = await rebrandQueue.client
		const ids: string[] = await redisClient.smembers(getRedisSetKey(realm))

		const jobs = await Promise.all(
			ids.map(async (id) => {
				const job = await rebrandQueue.getJob(id)
				if (!job) return null
				const state = await job?.getState()
				return { ...job.toJSON(), state }
			})
		).then((results) => results.filter(Boolean))

		return c.json({ success: true, data: { jobs } }, 200)
	})
	.get("/:jobId", async (c) => {
		const job = await rebrandQueue.getJob(c.req.param("jobId"))
		if (!job) {
			return c.json({ success: false, message: "Not found" }, 404)
		}
		console.log(job)
		return c.json({ success: true, data: { job } }, 200)
	})

export { app as jobsRoute }
