import type { Job } from "bullmq"
import { filterFriendlyString } from "../utils/index.js"
import { slugify } from "@tryghost/string"
import { ghostFetch } from "../services/ghost-api.js"
import pMap from "p-map"
import { updateProgress } from "../utils/update-progress.js"

// @TODO: i realized tier and tag have the same editable stuff.
// normally wouldn't leave so many references to *just* tags here,
// but I'm adding tiers to this file for the sake of speed.

// NOTE: I deliberately left benefits out just to keep things simple bc of time

type GhostTagOrTier = {
	slug: string
	id: string
	name: string
	description: string | null
	updated_at: string
}

type TagUpdateParams = {
	realm: string
	resource: "tags" | "tiers"
	origin: string
	id: string
	name: string
	slug: string
	description: string | null
	updatedAt: string
	ghostSession?: string
	adminKey?: string
}

const updateTag = async ({
	realm,
	resource,
	origin,
	id,
	name,
	slug,
	description,
	updatedAt,
	ghostSession,
	adminKey
}: TagUpdateParams) => {
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
					slug,
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

type ProcessTagsParams = {
	job: Job
	resource: "tags" | "tiers"
	realm: string
	origin: string
	total: number
	oldBrand: string
	newBrand: string
	ghostSession?: string
	adminKey?: string
}

export const processTagsOrTiers = async ({
	job,
	resource,
	realm,
	origin,
	total,
	oldBrand,
	newBrand,
	ghostSession,
	adminKey
}: ProcessTagsParams) => {
	let succeeded = 0
	let failed = 0

	while (true) {
		const filterFriendlyOldBrand = filterFriendlyString(oldBrand)
		const query = new URLSearchParams({
			limit: "100",
			page: "1",
			fields: "id,name,slug,description,updated_at",
			include: "none",
			filter: `name:~'${filterFriendlyOldBrand}',description:~'${filterFriendlyOldBrand}',slug:~'${slugify(
				oldBrand
			)}'`
		}).toString()

		const res = await ghostFetch({
			resource,
			realm,
			query,
			origin,
			ghostSession,
			adminKey
		})
		const data = await res.json()

		if (data[resource].length === 0 || succeeded + failed >= total) break

		const results = await pMap(
			data[resource],
			async (t: GhostTagOrTier) => {
				try {
					const newName = t.name.replaceAll(oldBrand, newBrand)
					const newDescription = t.description
						? t.description.replaceAll(oldBrand, newBrand)
						: null

					const newSlug = t.slug.includes(slugify(oldBrand))
						? t.slug.replaceAll(slugify(oldBrand), slugify(newBrand))
						: t.slug

					await updateTag({
						ghostSession,
						realm,
						resource,
						origin,
						id: t.id,
						name: newName,
						description: newDescription,
						slug: newSlug,
						updatedAt: t.updated_at
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
