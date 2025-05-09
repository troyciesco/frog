import type { Job } from "bullmq"
import { CONCURRENCY, filterFriendlyString } from "../utils/index.js"
import { ghostFetch } from "../services/ghost-api.js"
import pMap from "p-map"
import { updateProgress } from "../utils/update-progress.js"

type GhostNewsletter = {
	id: string
	name: string
	description: string | null
	updated_at: string
}

type NewsletterUpdateParams = {
	realm: string
	resource: "newsletters"
	origin: string
	id: string
	name: string
	description: string | null
	updatedAt: string
	ghostSession?: string
	adminKey?: string
}

const updateNewsletter = async ({
	realm,
	resource,
	origin,
	id,
	name,
	description,
	updatedAt,
	ghostSession,
	adminKey
}: NewsletterUpdateParams) => {
	const res = await ghostFetch({
		realm,
		resource,
		query: id,
		method: "PUT",
		ghostSession,
		adminKey,
		origin,
		body: JSON.stringify({
			[resource]: [
				{
					id,
					name,
					description,
					updated_at: updatedAt
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

type ProcessNewslettersParams = {
	job: Job
	resource: "newsletters"
	realm: string
	origin: string
	total: number
	oldBrand: string
	newBrand: string
	ghostSession?: string
	adminKey?: string
}

export const processNewsletters = async ({
	job,
	resource,
	realm,
	origin,
	total,
	oldBrand,
	newBrand,
	ghostSession,
	adminKey
}: ProcessNewslettersParams) => {
	let succeeded = 0
	let failed = 0

	while (true) {
		const filterFriendlyOldBrand = filterFriendlyString(oldBrand)
		const query = new URLSearchParams({
			limit: "100",
			page: "1",
			fields: "id,name,description,updated_at",
			include: "none",
			filter: `name:~'${filterFriendlyOldBrand}',description:~'${filterFriendlyOldBrand}'`
		}).toString()

		const res = await ghostFetch({
			resource,
			realm,
			query,
			ghostSession,
			adminKey,
			origin
		})
		const data = await res.json()

		if (data[resource].length === 0 || succeeded + failed >= total) break

		const results = await pMap(
			data[resource],
			async (n: GhostNewsletter) => {
				try {
					const newName = n.name.replaceAll(oldBrand, newBrand)
					const newDescription = n.description
						? n.description.replaceAll(oldBrand, newBrand)
						: null

					await updateNewsletter({
						ghostSession,
						realm,
						resource,
						origin,
						id: n.id,
						name: newName,
						description: newDescription,
						updatedAt: n.updated_at
					})
					return true
				} catch {
					return false
				}
			},
			{ concurrency: CONCURRENCY }
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
