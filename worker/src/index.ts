// @ts-nocheck
import { Redis } from "ioredis"
import { Queue, Worker, QueueEvents, Job } from "bullmq"
import { slugify } from "@tryghost/string"
import pMap from "p-map"

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

async function setupTestBullMQProcessor(queueName: string) {
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
		`🐸  Worker up - connected to ${connection.options.host}:${connection.options.port}`
	)
}
const queue = new Queue("test-queue", { connection })
export const queueEvents = new QueueEvents("test-queue", { connection })
await setupTestBullMQProcessor(queue.name)

queueEvents.on("completed", ({ jobId }) =>
	console.log(`✅  Job ${jobId} completed`)
)
queueEvents.on("failed", ({ jobId, failedReason }) =>
	console.error(`❌  Job ${jobId} failed: ${failedReason}`)
)

// @TODO: this is identical to the one in the server dir
// with more time i'd make more shared code for all three apps
type GhostFetchOpts = {
	realm: string
	resource: string
	query: string
	ghostSession: string
	origin: string
}
const ghostFetch = async ({
	realm,
	resource,
	query,
	ghostSession,
	origin
}: GhostFetchOpts) => {
	const url = `${realm}/ghost/api/admin/${resource}?${query}`
	return fetch(url, {
		credentials: "include",
		headers: {
			Cookie: ghostSession,
			Origin: origin
		}
	})
}

const filterFriendlyString = (string: string) => string.replace(/'/g, "\\'")

type GetOneParams = {
	realm: string
	oldBrand: string
	ghostSession: string
	origin: string
}

const resources = ["posts", "pages", "tags", "tiers", "newsletters"] as const

const getOne = async (
	resource: (typeof resources)[number],
	{ realm, oldBrand, ghostSession, origin }: GetOneParams
) => {
	const filterFriendlyOldBrand = filterFriendlyString(oldBrand)
	const filters = {
		posts: `plaintext:~'${filterFriendlyOldBrand}',title:~'${filterFriendlyOldBrand}'`,
		pages: `plaintext:~'${filterFriendlyOldBrand}',title:~'${filterFriendlyOldBrand}'`,
		tags: `name:~'${filterFriendlyOldBrand}',slug:~'${filterFriendlyString(
			slugify(oldBrand)
		)}'`,
		tiers: `name:~'${filterFriendlyOldBrand}'`,
		newsletters: `name:~'${filterFriendlyOldBrand}'`
	}

	const query = new URLSearchParams({
		limit: "1",
		fields: "id",
		include: "none",
		filter: filters[resource]
	}).toString()

	return ghostFetch({ realm, resource, query, ghostSession, origin })
}

type ProcessPostsParams = {
	job: Job
	resource: "posts" | "pages"
	realm: string
	ghostSession: string
	origin: string
	total: number
	oldBrand: string
	newBrand: string
}

type PostUpdateParams = {
	ghostSession: string
	realm: string
	resource: "posts" | "pages"
	origin: string
	id: string
	lexical: string
	custom_excerpt: string | null
	title: string
	slug: string
	updatedAt: string
	feature_image_alt: string | null
	feature_image_caption: string | null
}
const updatePost = async ({
	ghostSession,
	realm,
	resource,
	origin,
	id,
	lexical,
	title,
	slug,
	custom_excerpt,
	updatedAt,
	feature_image_alt,
	feature_image_caption
}: PostUpdateParams) => {
	const url = `${realm}/ghost/api/admin/${resource}/${id}`

	const res = await fetch(url, {
		method: "PUT",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			Cookie: ghostSession,
			Origin: origin
		},
		body: JSON.stringify({
			[resource]: [
				{
					id,
					lexical,
					title,
					slug,
					custom_excerpt,
					updated_at: updatedAt,
					feature_image_alt,
					feature_image_caption
				}
			]
		})
	})

	if (!res.ok) {
		throw new Error(
			`PUT ${resource} ${id} failed: ${res.status} ${res.statusText}`
		)
	}
}

type UpdateProgressParams = {
	job: Job
	resource: (typeof resources)[number]
	succeeded: number
	failed: number
	completedAt?: string | null
}
const updateProgress = async ({
	job,
	resource,
	succeeded,
	failed,
	completedAt = null
}: UpdateProgressParams) => {
	await job.updateProgress({
		...(job.progress as object),
		[resource]: {
			...(job.progress[resource] as object),
			succeeded,
			failed,
			updatedAt: new Date().toISOString(),
			completedAt
		}
	})
}

const processPostsOrPages = async ({
	job,
	resource,
	realm,
	ghostSession,
	origin,
	total,
	oldBrand,
	newBrand
}: ProcessPostsParams) => {
	let succeeded = 0
	let failed = 0

	while (true) {
		const filterFriendlyOldBrand = filterFriendlyString(oldBrand)
		const query = new URLSearchParams({
			limit: "100",
			page: "1",
			fields:
				"id,title,lexical,slug,custom_excerpt,updated_at,feature_image_alt,feature_image_caption",
			include: "none",
			filter: `plaintext:~'${filterFriendlyOldBrand}',title:~'${filterFriendlyOldBrand}',custom_excerpt:~'${filterFriendlyOldBrand}',slug:~'${slugify(
				oldBrand
			)}'`
		}).toString()

		const res = await ghostFetch({
			resource,
			realm,
			query,
			ghostSession,
			origin
		})
		const data = await res.json()
		console.log(data)
		if (data[resource].length === 0 || succeeded + failed >= total) break

		const results = await pMap(
			data[resource],
			async (p) => {
				try {
					const newLexical = p.lexical.replaceAll(oldBrand, newBrand)
					const newTitle = p.title.replaceAll(oldBrand, newBrand)
					const newCustomExcerpt = p.custom_excerpt
						? p.custom_excerpt.replaceAll(oldBrand, newBrand)
						: null
					const newFeatureImageAlt = p.feature_image_alt
						? p.feature_image_alt.replaceAll(oldBrand, newBrand)
						: null
					const newFeatureImageCaption = p.feature_image_caption
						? p.feature_image_caption.replaceAll(oldBrand, newBrand)
						: null

					const newSlug = p.slug.includes(slugify(oldBrand))
						? p.slug.replaceAll(slugify(oldBrand), slugify(newBrand))
						: p.slug

					await updatePost({
						ghostSession,
						realm,
						resource,
						origin,
						id: p.id,
						lexical: newLexical,
						title: newTitle,
						custom_excerpt: newCustomExcerpt,
						slug: newSlug,
						updatedAt: p.updated_at,
						feature_image_alt: newFeatureImageAlt,
						feature_image_caption: newFeatureImageCaption
					})
					return true
				} catch {
					return false
				}
			},
			{ concurrency: 25 }
		)

		succeeded += results.filter(Boolean).length
		failed += results.filter((r) => !r).length
		await updateProgress({ job, resource, succeeded, failed })
	}

	await updateProgress({
		job,
		resource,
		succeeded,
		failed,
		completedAt: new Date().toISOString()
	})

	return { succeeded, failed }
}

const rebrandProcessor = async (job: Job) => {
	const { title, realm, ghostSession, oldBrand, newBrand, origin } = job.data

	const commonArgs = { realm, oldBrand, ghostSession, origin }

	// do an initial fetch of the resources to get totals
	const res = await Promise.all(
		resources.map((resource) => getOne(resource, commonArgs))
	)
	const data = await Promise.all(res.map((r) => r.json()))

	const counts = Object.fromEntries(
		resources.map((resource, index) => [
			resource,
			data[index].meta.pagination.total
		])
	) as Record<(typeof resources)[number], number>

	const progressObj = Object.fromEntries(
		resources.map((resource) => [
			resource,
			{
				succeeded: 0,
				failed: 0,
				total: counts[resource],
				createdAt: job.timestamp,
				updatedAt: job.timestamp,
				completedAt: null
			}
		])
	)

	await job.updateProgress({
		test: 0,
		...progressObj
	})

	// start processing ones that have totals
	await processPostsOrPages({
		job,
		resource: "posts",
		newBrand,
		total: counts["posts"],
		...commonArgs
	})

	return { jobId: `This is the return value of job (${job.id})`, counts }
}

async function setupRebrandWorker(queueName: string) {
	new Worker(queueName, rebrandProcessor, { connection, concurrency: 10 })
	console.log(
		`🐸 Worker up - connected to ${connection.options.host}:${connection.options.port}`
	)
}

const rebrandQueue = new Queue("rebrand-queue", { connection })
export const rebrandQueueEvents = new QueueEvents("rebrand-queue", {
	connection
})

queueEvents.on("completed", ({ jobId }) =>
	console.log(`✅  Job ${jobId} completed`)
)
queueEvents.on("failed", ({ jobId, failedReason }) =>
	console.error(`❌  Job ${jobId} failed: ${failedReason}`)
)
await setupRebrandWorker(rebrandQueue.name)
