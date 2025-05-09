import { describe, it, expect } from "vitest"

// Now import the module after setting the environment variable
import {
	encrypt,
	decrypt,
	verifySession,
	createGhostToken
} from "../src/encryption.js"

describe("Encryption Module", () => {
	const testSessionData = {
		email: "test@example.com",
		realm: "https://test.ghost.io",
		ghostSession: "ghost-admin-api-session=test-session-123"
	}

	it("should encrypt session data into a JWT", async () => {
		const token = await encrypt(testSessionData)
		expect(token).toBeDefined()
		expect(typeof token).toBe("string")
		expect(token.split(".")).toHaveLength(3)
	})

	it("should decrypt a valid session token", async () => {
		const token = await encrypt(testSessionData)
		const decrypted = await decrypt(token)

		expect(decrypted).toMatchObject({
			email: testSessionData.email,
			realm: testSessionData.realm,
			ghostSession: testSessionData.ghostSession
		})
	})

	it("should return null when decrypting an invalid token", async () => {
		const invalidToken = "invalid.token.format"
		const decrypted = await decrypt(invalidToken)
		expect(decrypted).toBeNull()
	})

	it("should return null when decrypting undefined", async () => {
		const decrypted = await decrypt(undefined)
		expect(decrypted).toBeNull()
	})

	it("should verify a valid session", async () => {
		const token = await encrypt(testSessionData)
		const verified = await verifySession(token)

		expect(verified).toMatchObject({
			email: testSessionData.email,
			realm: testSessionData.realm,
			ghostSession: testSessionData.ghostSession
		})
	})

	it("should return null when verifying an invalid session", async () => {
		const invalidToken = "invalid.token.format"
		const verified = await verifySession(invalidToken)
		expect(verified).toBeNull()
	})

	it("should return null when verifying undefined", async () => {
		const verified = await verifySession(undefined)
		expect(verified).toBeNull()
	})

	it("should create a valid Ghost admin API token", async () => {
		const mockAdminKey = "a:1010101010"
		const token = await createGhostToken(mockAdminKey)

		expect(token).toBeDefined()
		expect(token.split(".").length).toBe(3)
	})
})
