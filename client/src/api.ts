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

type RebrandCheckParams = {
	oldBrand: string
	newBrand: string
}

export async function rebrandCheck({ oldBrand, newBrand }: RebrandCheckParams) {
	try {
		const response = await fetch(`${API_URL}/rebrand/check`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ oldBrand, newBrand }),
			credentials: "include"
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.message || "Failed to calculate changes.")
		}

		return await response.json()
	} catch (error) {
		console.error("Error calculating changes:", error)
		throw error
	}
}

type RebrandCommitParams = {
	oldBrand: string
	newBrand: string
	hasBackedUp: boolean
	hasCheckedSpelling: boolean
	hasSpotChecked: boolean
}

export async function rebrandCommit({
	oldBrand,
	newBrand,
	hasBackedUp,
	hasCheckedSpelling,
	hasSpotChecked
}: RebrandCommitParams) {
	try {
		const response = await fetch(`${API_URL}/rebrand/commit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				oldBrand,
				newBrand,
				hasBackedUp,
				hasCheckedSpelling,
				hasSpotChecked
			}),
			credentials: "include"
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.message || "Failed to commit changes.")
		}

		return await response.json()
	} catch (error) {
		console.error("Error committing changes:", error)
		throw error
	}
}
