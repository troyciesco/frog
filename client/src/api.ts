import { API_URL } from "./constants"
import type { Job } from "./types"

type SignInParams = {
	realm: string
	email: string
	password: string
}

export async function signIn({ realm, email, password }: SignInParams) {
	try {
		const res = await fetch(`${API_URL}/auth/sign-in`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ realm, email, password }),
			credentials: "include"
		})

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({}))
			throw new Error(errorData.message || "Failed to sign in")
		}

		const json = await res.json()
		return { res: json, error: null }
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
		const res = await fetch(`${API_URL}/rebrand/check`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ oldBrand, newBrand }),
			credentials: "include"
		})

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({}))
			return {
				res: null,
				error: errorData.message || "Failed checking changes."
			}
		}

		const json = await res.json()
		return { res: json, error: null }
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "An unknown error occurred"
		console.error("Error checking changes:", error)
		return { res: null, error: message }
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
		const res = await fetch(`${API_URL}/rebrand/commit`, {
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

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({}))
			return {
				res: null,
				error: errorData.message || "Failed to commit changes."
			}
		}

		return await res.json()
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "An unknown error occurred"
		console.error("Error committing changes:", error)
		return { res: null, error: message }
	}
}

export async function getJobs() {
	try {
		const res = await fetch(`${API_URL}/jobs`, {
			credentials: "include"
		})

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({}))
			throw new Error(errorData.message || "Failed to get jobs.")
		}

		const json: { data: { jobs: Job[] } } = await res.json()
		// Sort jobs by timestamp in descending order (newest first)
		if (json.data && json.data.jobs) {
			json.data.jobs.sort((a, b) => {
				const timestampA = new Date(a.timestamp || a.processedOn || 0).getTime()
				const timestampB = new Date(b.timestamp || b.processedOn || 0).getTime()
				return timestampB - timestampA
			})
		}

		return json

		return
	} catch (error) {
		console.error("Error getting jobs:", error)
		throw error
	}
}

export async function getJobById(jobId: string) {
	try {
		const response = await fetch(`${API_URL}/jobs/${jobId}`, {
			credentials: "include"
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.message || "Failed to get job.")
		}

		return await response.json()
	} catch (error) {
		console.error("Error getting job:", error)
		throw error
	}
}
