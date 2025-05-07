import { SignJWT, jwtVerify } from "jose"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const encodedKey = new TextEncoder().encode(ENCRYPTION_KEY)

type SessionData = {
	email: string
	realm: string
	ghostSession: string
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
		console.log("Failed to verify session", error)
		return null
	}
}

export async function verifySession(session: string | undefined = "") {
	const data = await decrypt(session)
	if (!data) return null
	return data
}
