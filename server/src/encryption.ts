import { SignJWT, jwtVerify } from "jose"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const encodedKey = new TextEncoder().encode(ENCRYPTION_KEY)

type SessionData = {
	realm: string
	email?: string
	ghostSession?: string
	adminKey?: string
}

export async function encrypt(payload: SessionData) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(encodedKey)
}

export async function decrypt(session: string | undefined = "") {
	try {
		const { payload } = await jwtVerify(session, encodedKey, {
			algorithms: ["HS256"]
		})
		return payload as SessionData
	} catch (error) {
		console.error("Failed to verify session", error)
		return null
	}
}

export async function verifySession(session: string | undefined = "") {
	const data = await decrypt(session)
	// session needs either a session cookie or api key
	if (!data?.realm && (!data?.ghostSession || !data?.adminKey)) {
		return null
	}
	return data
}

// from https://ghost.org/docs/admin-api/#token-authentication
export async function createGhostToken(adminKey: string) {
	// Split the key into ID and SECRET
	const [id, secret] = adminKey.split(":")

	// Decode the secret from hex
	const decodedSecret = Buffer.from(secret, "hex")

	return new SignJWT()
		.setProtectedHeader({ alg: "HS256", kid: id }) // Add key ID to header
		.setIssuedAt()
		.setExpirationTime("5m")
		.setAudience("/admin/")
		.sign(decodedSecret)
}
