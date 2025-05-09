import { testClient } from "hono/testing"
import {
	describe,
	expect,
	it,
	vi,
	beforeAll,
	afterAll,
	afterEach
} from "vitest"
import { app } from "../src/index.js"

type AuthResponse = {
	success: boolean
	message: string
	user?: { email?: string; realm: string }
}

vi.mock("../src/encryption.js", () => ({
	encrypt: vi.fn(),
	verifySession: vi.fn().mockResolvedValue({
		realm: "https://test.ghost.io",
		ghostSession: "mock-session-cookie"
	}),
	createGhostToken: vi.fn().mockResolvedValue("faketoken")
}))

const originalFetch = global.fetch
const client = testClient(app)

const validArgs = {
	realm: "https://test.ghost.io",
	email: "test@example.com",
	password: "password123"
}

describe("Auth Endpoints", () => {
	afterAll(() => vi.restoreAllMocks())

	describe("sign-in", () => {
		beforeAll(() => {
			// @ts-expect-error because it's mocked
			global.fetch = vi.fn((url, options) => {
				const body = options?.body ? JSON.parse(options.body as string) : {}

				if (body.username === "throw@error.com") {
					throw new Error("Network error")
				}

				if (url.toString().includes("/ghost/api/admin/session")) {
					if (body.username === "pretendthereisno@ghost.session") {
						return Promise.resolve({
							ok: true,
							status: 201,
							headers: {
								getSetCookie: () => ["no-cookie=so-sad; Path=/; HttpOnly"]
							},
							text: () => Promise.resolve("Created")
						})
					}

					if (
						body.username === validArgs.email &&
						body.password === validArgs.password &&
						url.toString().includes(validArgs.realm)
					) {
						return Promise.resolve({
							ok: true,
							status: 201,
							headers: {
								getSetCookie: () => [
									"ghost-admin-api-session=mockSessionValue123; Path=/; HttpOnly"
								]
							},
							text: () => Promise.resolve("Created")
						})
					} else if (body.username && !body.password) {
						return Promise.resolve({
							ok: false,
							status: 401,
							json: () =>
								Promise.resolve({
									errors: [
										{
											message: "Your password is incorrect.",
											context: "Your password is incorrect.",
											type: "ValidationError",
											code: "PASSWORD_INCORRECT"
										}
									]
								})
						})
					} else if (!url.toString().includes(validArgs.realm)) {
						// not a Ghost site, presumably
						return Promise.resolve({
							ok: false,
							status: 404,
							text: () => Promise.resolve("Not Found")
						})
					} else {
						return Promise.resolve({
							ok: false,
							status: 404,
							json: () =>
								Promise.resolve({
									errors: [
										{
											message: "There is no user with that email address.",
											context: null,
											type: "NotFoundError"
										}
									]
								})
						})
					}
				}

				if (url.toString().includes("/ghost/api/admin/site")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: () => Promise.resolve({ title: "site" })
					})
				}

				return originalFetch(url, options)
			})
		})

		afterAll(() => {
			global.fetch = originalFetch
		})

		it("authenticates a user with valid email, password, and realm", async () => {
			const res = await client.auth["sign-in"].$post(
				{
					json: validArgs
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			const json: AuthResponse = await res.json()

			expect(res.status).toBe(200)
			expect(json).toMatchObject({
				success: true,
				message: "Authentication successful"
			})

			expect(json.user).toMatchObject({
				email: validArgs.email,
				realm: validArgs.realm
			})
			// @ts-expect-error we want to make sure the password isn't getting sent back
			expect(json.user.password).not.toBeDefined()
		})
		it("authenticates a user with valid admin API Key and realm", async () => {
			const adminKey = "fakeValidAdminKey"

			const res = await client.auth["sign-in"].$post(
				{
					json: { realm: validArgs.realm, adminKey }
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			const json: AuthResponse = await res.json()

			expect(res.status).toBe(200)
			expect(json).toMatchObject({
				success: true,
				message: "Authentication successful"
			})

			expect(json.user).toMatchObject({
				realm: validArgs.realm
			})

			expect(json.user?.email).not.toBeDefined()
		})
		it("fails if the realm is not a ghost site", async () => {
			const res = await client.auth["sign-in"].$post(
				{
					json: {
						...validArgs,
						realm: "https://notghost.xyz"
					}
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			const json: AuthResponse = await res.json()

			expect(res.status).toBe(401)
			expect(json).toMatchObject({
				success: false,
				message:
					"Sign in failed. Check your credentials and make sure you're using a Ghost site."
			})
		})
		it("fails if the email is wrong, but doesn't reveal specifics in the error message", async () => {
			const res = await client.auth["sign-in"].$post(
				{
					json: {
						...validArgs,
						email: "wrong@email.com"
					}
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			const json: AuthResponse = await res.json()

			expect(res.status).toBe(401)
			expect(json).toMatchObject({
				success: false,
				message:
					"Sign in failed. Check your credentials and make sure you're using a Ghost site."
			})
		})
		it("fails if the password is wrong, but doesn't reveal specifics in the error message", async () => {
			const res = await client.auth["sign-in"].$post(
				{
					json: {
						...validArgs,
						password: "wrongpassword"
					}
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			const json: AuthResponse = await res.json()

			expect(res.status).toBe(401)
			expect(json).toMatchObject({
				success: false,
				message:
					"Sign in failed. Check your credentials and make sure you're using a Ghost site."
			})
		})
		it("fails if it can't get a session from Ghost", async () => {
			const res = await client.auth["sign-in"].$post(
				{
					json: {
						...validArgs,
						email: "pretendthereisno@ghost.session"
					}
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			const json: AuthResponse = await res.json()

			expect(res.status).toBe(500)
			expect(json).toMatchObject({
				success: false,
				message: "Failed to get Ghost session"
			})
		})
		it("fails if it can't get a session from Ghost", async () => {
			const res = await client.auth["sign-in"].$post(
				{
					json: {
						...validArgs,
						email: "pretendthereisno@ghost.session"
					}
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			const json: AuthResponse = await res.json()

			expect(res.status).toBe(500)
			expect(json).toMatchObject({
				success: false,
				message: "Failed to get Ghost session"
			})
		})
		it("fails if there's a network error", async () => {
			const res = await client.auth["sign-in"].$post(
				{
					json: {
						...validArgs,
						email: "throw@error.com"
					}
				},
				{
					headers: {
						"Content-Type": "application/json"
					}
				}
			)

			const json: AuthResponse = await res.json()

			expect(res.status).toBe(500)
			expect(json).toMatchObject({
				success: false,
				message: "Server error"
			})
		})
	})
	// @TODO: this 403s for some reason
	describe("sign-out", () => {
		afterEach(() => vi.restoreAllMocks())

		beforeAll(() => {
			// @ts-expect-error because it's mocked
			global.fetch = vi.fn((url, options) => {
				if (url.toString().includes("/ghost/api/admin/session")) {
					return Promise.resolve({
						ok: true,
						status: 204,
						headers: {
							getSetCookie: () => ["mock-session-cookie=; Path=/; HttpOnly"]
						}
					})
				}

				return originalFetch(url, options)
			})
		})

		afterAll(() => {
			global.fetch = originalFetch
		})

		it("signs out the user", async () => {
			const res = await client.auth["sign-out"].$post({ json: {} })

			expect(res.status).toBe(200)

			const json = await res.json()
			expect(json).toMatchObject({
				success: true,
				message: "Sign out successful"
			})
		})
	})
})
