import type { JobState } from "bullmq"
import { getRedisSetKey } from "./constants.js"
import { rebrandQueue } from "./rebrand-queue.js"

export const getJobs = async (realm: string) => {
	const redisClient = await rebrandQueue.client
	const ids: string[] = await redisClient.smembers(getRedisSetKey(realm))

	const jobs = await Promise.all(
		ids.map(async (id) => {
			const job = await rebrandQueue.getJob(id)
			if (!job) return null

			const state: JobState = await job?.getState()
			return { ...job.toJSON(), state }
		})
	).then((results) => results.filter(Boolean))

	return jobs
}
