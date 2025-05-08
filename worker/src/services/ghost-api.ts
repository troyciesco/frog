// @TODO: this is identical to the one in the server dir

import { slugify } from "@tryghost/string"
import { filterFriendlyString, resources } from "../utils/index.js"

// with more time i'd make more shared code for all three apps
type GhostFetchOpts = {
	realm: string
	resource: string
	query: string
	ghostSession: string
	origin: string
}
export const ghostFetch = async ({
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

type GetOneParams = {
	realm: string
	oldBrand: string
	ghostSession: string
	origin: string
}

export const getOne = async (
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
