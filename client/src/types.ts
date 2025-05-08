type ProgressItem = {
	succeeded: number
	failed: number
	total: number
	createdAt: number
	updatedAt: number | string
	completedAt: number | string | null
}

export type Progress = {
	posts: ProgressItem
	pages: ProgressItem
	tags: ProgressItem
	tiers: ProgressItem
	newsletters: ProgressItem
}

export type Job = {
	id: string
	data: {
		title: string
	}
	progress: Progress
	timestamp: number
	processedOn: number
	state: string
}
