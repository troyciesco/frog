// @TODO: this utility is the same one as in server - if i ever add
// packages to this setup this should be moved there and reused in both

import { SignJWT } from "jose"

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
