import { Redis } from "ioredis"
import { Queue, Worker, QueueEvents, Job } from "bullmq"

const sleep = (t: number) =>
	new Promise((resolve) => setTimeout(resolve, t * 1000))

const connection = new Redis(
	process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
	{
		maxRetriesPerRequest: null,
		family: 0,
		enableReadyCheck: true
	}
)

async function setupBullMQProcessor(queueName: string) {
	new Worker(
		queueName,
		async (job) => {
			for (let i = 0; i <= 100; i++) {
				await sleep(Math.random())
				await job.updateProgress(i)
				await job.log(`Processing job at interval ${i}`)

				if (Math.random() * 200 < 1) throw new Error(`Random error ${i}`)
			}

			return { jobId: `This is the return value of job (${job.id})` }
		},
		{ connection, concurrency: 10 }
	)
	console.log(
		`🐸  Worker up – connected to ${connection.options.host}:${connection.options.port}`
	)
}
const queue = new Queue("test-queue", { connection })
export const queueEvents = new QueueEvents("test-queue", { connection })

queueEvents.on("completed", ({ jobId }) =>
	console.log(`✅  Job ${jobId} completed`)
)
queueEvents.on("failed", ({ jobId, failedReason }) =>
	console.error(`❌  Job ${jobId} failed: ${failedReason}`)
)
await setupBullMQProcessor(queue.name)
