import { Worker, QueueEvents } from "bullmq"
import { connection } from "./config/redis.js"
import { rebrandProcessor } from "./processors/index.js"
import { rebrandQueue } from "./queues/rebrand-queue.js"

async function setupRebrandWorker(queueName: string) {
	new Worker(queueName, rebrandProcessor, {
		connection,
		removeOnComplete: {
			age: 24 * 3600, // keep up to 24 hours
			count: 20
		},
		removeOnFail: {
			age: 24 * 3600, // keep up to 24 hours
			count: 20
		},
		concurrency: 10
	})
	console.log(
		`🐸 Worker up - connected to ${connection.options.host}:${connection.options.port}`
	)
}

export const rebrandQueueEvents = new QueueEvents("rebrand-queue", {
	connection
})

rebrandQueueEvents.on("completed", ({ jobId }) =>
	console.log(`✅  Job ${jobId} completed`)
)
rebrandQueueEvents.on("failed", ({ jobId, failedReason }) =>
	console.error(`❌  Job ${jobId} failed: ${failedReason}`)
)

await setupRebrandWorker(rebrandQueue.name)
