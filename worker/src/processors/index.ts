import type { Job } from "bullmq"
import { resources } from "../utils/index.js"
import { getOne } from "../services/ghost-api.js"
import { processPostsOrPages } from "./posts-or-pages.js"
import { processTagsOrTiers } from "./tags-or-tiers.js"
import { processNewsletters } from "./newsletters.js"

export const rebrandProcessor = async (job: Job) => {
	const { realm, ghostSession, oldBrand, newBrand, origin } = job.data

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
		...progressObj
	})

	// @TODO: I might be able to do all these in parallel...
	// but not 100% sure I won't overload Ghost
	await processPostsOrPages({
		job,
		resource: "posts",
		newBrand,
		total: counts["posts"],
		...commonArgs
	})
	await processPostsOrPages({
		job,
		resource: "pages",
		newBrand,
		total: counts["pages"],
		...commonArgs
	})
	await processTagsOrTiers({
		job,
		resource: "tags",
		newBrand,
		total: counts["tags"],
		...commonArgs
	})
	await processTagsOrTiers({
		job,
		resource: "tiers",
		newBrand,
		total: counts["tiers"],
		...commonArgs
	})

	await processNewsletters({
		job,
		resource: "newsletters",
		newBrand,
		total: counts["newsletters"],
		...commonArgs
	})

	return { counts }
}
