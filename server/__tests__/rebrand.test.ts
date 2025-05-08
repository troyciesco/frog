import { vi, describe, it, expect, afterEach, afterAll } from "vitest"
import { testClient } from "hono/testing"
import { app } from "../src/index.js"

vi.mock("../src/encryption.js", () => ({
	verifySession: vi.fn().mockResolvedValue({
		realm: "https://test.ghost.io",
		ghostSession: "mock-session-cookie"
	})
}))

describe("Rebrand Endpoints", () => {
	const client = testClient(app)
	afterAll(() => vi.restoreAllMocks())

	describe("/check", () => {
		it("fails if oldBrand and newBrand are not included", async () => {
			// random note: i think you need the json field here (on any authed endpoint) or it fails on auth for some reason
			const res = await client.rebrand.check.$post({ json: {} })

			expect(res.status).toBe(400)

			const json = await res.json()

			expect(json).toMatchObject({
				success: false,
				message: "oldBrand is required. newBrand is required."
			})
		})
		it("fails if oldBrand and newBrand are the same", async () => {
			const res = await client.rebrand.check.$post({
				json: {
					oldBrand: "   same no matter trim",
					newBrand: "same no matter trim "
				}
			})

			expect(res.status).toBe(400)

			const json = await res.json()

			expect(json).toMatchObject({
				success: false,
				message: "oldBrand and newBrand are the same value."
			})
		})
		it("fails if oldBrand or newBrand are over 100 characters", async () => {
			const res = await client.rebrand.check.$post({
				json: {
					oldBrand: "International Business Machines Corporation",
					newBrand:
						"International Business Machines Corporation but it's really extra long this is going to be 101 chars!"
				}
			})

			expect(res.status).toBe(400)

			const json = await res.json()

			expect(json).toMatchObject({
				success: false,
				message: "oldBrand and newBrand must be 100 characters or less."
			})
		})
		it("returns a count of items that will be changed for each resource", async () => {})
		it("includes a warning alert if the oldBrand is in the site title", async () => {})
		it("includes a danger alert if the newBrand is relatively common.", async () => {})
		it("includes counts of all resources that will be updated", async () => {})
		it("includes an estimated job length", async () => {})
	})
	// NOTE: it's a little clunky that /commit validates a lot
	// of the same stuff as /check, but it needs the same data and
	// doesn't know the result of /check
	describe("/commit", () => {
		it("fails if oldBrand and newBrand are not included", async () => {
			const res = await client.rebrand.commit.$post({ json: {} })

			expect(res.status).toBe(400)

			const json = await res.json()

			expect(json).toMatchObject({
				success: false,
				message: "oldBrand is required. newBrand is required."
			})
		})
		it("fails if oldBrand and newBrand are the same", async () => {
			const res = await client.rebrand.commit.$post({
				json: {
					oldBrand: "   same no matter trim",
					newBrand: "same no matter trim "
				}
			})

			expect(res.status).toBe(400)

			const json = await res.json()

			expect(json).toMatchObject({
				success: false,
				message: "oldBrand and newBrand are the same value."
			})
		})
		it("fails if oldBrand or newBrand are over 100 characters", async () => {
			const res = await client.rebrand.commit.$post({
				json: {
					oldBrand: "International Business Machines Corporation",
					newBrand:
						"International Business Machines Corporation but it's really extra long this is going to be 101 chars!"
				}
			})

			expect(res.status).toBe(400)

			const json = await res.json()

			expect(json).toMatchObject({
				success: false,
				message: "oldBrand and newBrand must be 100 characters or less."
			})
		})
		it("fails if hasBackedUp, hasCheckedSpelling, and/or hasSpotChecked are false", async () => {})
		it("returns a jobId", async () => {})
	})
})
