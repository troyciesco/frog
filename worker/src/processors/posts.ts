import type { Job } from "bullmq"
import { filterFriendlyString } from "../utils/index.js"
import { slugify } from "@tryghost/string"
import { ghostFetch } from "../services/ghost-api.js"
import pMap from "p-map"
import { updateProgress } from "../utils/update-progress.js"

type GhostPost = {
	id: string
	title: string
	lexical: string
	slug: string
	custom_excerpt: string | null
	updated_at: string
	feature_image_alt: string | null
	feature_image_caption: string | null
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
export const processPostsOrPages = async ({
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
			async (p: GhostPost) => {
				try {
					// @TODO: This is SUPER ugly and hard to follow
					// With more time this'd definitely be something I'd clean up,
					// test, and make more concise and easier to read.
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
