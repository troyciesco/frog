import type { Job } from "bullmq"
import type { resources } from "./index.js"

type UpdateProgressParams = {
	job: Job
	resource: (typeof resources)[number]
	succeeded: number
	failed: number
	completedAt?: string | null
}
export const updateProgress = async ({
	job,
	resource,
	succeeded,
	failed,
	completedAt = null
}: UpdateProgressParams) => {
	await job.updateProgress({
		...(job.progress as object),
		[resource]: {
			// @ts-expect-error
			...(job.progress[resource] as object),
			succeeded,
			failed,
			updatedAt: new Date().toISOString(),
			completedAt
		}
	})
}
