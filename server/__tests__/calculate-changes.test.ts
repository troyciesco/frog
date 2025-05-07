import { vi, describe, it, expect, afterEach } from "vitest"
import { testClient } from "hono/testing"
import { app } from "../src/index.js"

vi.mock("../src/encryption.js", () => ({
	verifySession: vi.fn().mockResolvedValue({
		realm: "https://test.ghost.io",
		ghostSession: "mock-session-cookie"
	})
}))

describe("Calculate Changes Endpoints", () => {
	const client = testClient(app)
	afterEach(() => vi.restoreAllMocks())

	it("placeholder test", async () => {
		const res = await client["calculate-changes"].$post({
			json: { oldBrand: "The Old Brand", newBrand: "The New Brand" }
		})

		expect(res.status).toBe(200)

		const json = await res.json()
		expect(json).toMatchObject({
			success: true,
			message: "Not implemented"
		})
	})
})
