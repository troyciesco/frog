import { API_URL } from "./constants"

type SignInParams = {
	realm: string
	email: string
	password: string
}

export async function signIn({ realm, email, password }: SignInParams) {
	try {
		const response = await fetch(`${API_URL}/auth/sign-in`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ realm, email, password }),
			credentials: "include"
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.message || "Failed to sign in")
		}

		return await response.json()
	} catch (error) {
		console.error("Sign in error:", error)
		throw error
	}
}
