export const SESSION_COOKIE_NAME = "frog-session"

export const getRedisSetKey = (realm: string) => `rebrands:by-realm:${realm}`
