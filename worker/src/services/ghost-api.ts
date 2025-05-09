// @TODO: this is very similar to the one in the server dir - if i ever add
// packages to this setup this should be moved there and reused in both.
// This is the more reusable one

import { slugify } from "@tryghost/string"
import { filterFriendlyString, resources } from "../utils/index.js"
import { createGhostToken } from "../utils/create-ghost-token.js"

// with more time i'd make more shared code for all three apps
type GhostFetchOpts = {
	realm: string
	resource: string
	query: string
	origin: string
	ghostSession?: string
	adminKey?: string
	method?: "GET" | "PUT"
	body?: string
}
export const ghostFetch = async ({
	realm,
	resource,
	query,
	ghostSession,
	adminKey,
	origin,
	method = "GET",
	body
}: GhostFetchOpts) => {
	let headers: HeadersInit = { Origin: origin }
	let bearerToken

	if (adminKey) {
		bearerToken = await createGhostToken(adminKey)
		headers.Authorization = `Ghost ${bearerToken}`
	} else if (ghostSession) {
		headers.Cookie = ghostSession
	}

	let options: { method: "GET" | "PUT"; body?: BodyInit | null } = { method }
	if (body) {
		options.body = body
		headers["Content-Type"] = "application/json"
	}

	// @TODO: normally i'd clean this up and have separate slug and query
	// params to pass to ghostFetch, but since I know I have an extremely limited
	// number of requests in the worker i'm going to leave as-is for now
	// once those other requests are de-duped I can clean this up more easily
	const separator = method === "GET" ? "?" : "/"
	const url = `${realm}/ghost/api/admin/${resource}${separator}${query}`

	return fetch(url, {
		...options,
		credentials: "include",
		headers
	})
}

type GetOneParams = {
	realm: string
	oldBrand: string
	origin: string
	ghostSession?: string
	adminKey?: string
}

export const getOne = async (
	resource: (typeof resources)[number],
	{ realm, oldBrand, ghostSession, adminKey, origin }: GetOneParams
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

	return ghostFetch({ realm, resource, query, ghostSession, adminKey, origin })
}
