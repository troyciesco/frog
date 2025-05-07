import type { Context } from "hono"

export const getAuth = (c: Context) => {
	return c.get("auth")()
}
