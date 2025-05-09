export const filterFriendlyString = (string: string) =>
	string.replace(/'/g, "\\'")

export const resources = [
	"posts",
	"pages",
	"tags",
	"tiers",
	"newsletters"
] as const

export const CONCURRENCY = 25
