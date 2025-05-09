import { useCallback, useEffect, useState } from "react"
import { API_URL } from "../constants"
import { AuthContext, type SignInParams } from "./contexts/auth-context"

const key = "frog.auth.user"

function getStoredUser() {
	return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : ""
}

function setStoredUser(user: string | null) {
	if (user) {
		localStorage.setItem(key, user)
	} else {
		localStorage.removeItem(key)
	}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<{ email?: string; realm: string } | null>(
		getStoredUser()
	)
	const isAuthenticated = Boolean(user?.realm)

	const signOut = useCallback(async () => {
		const response = await fetch(`${API_URL}/auth/sign-out`, {
			method: "POST",
			credentials: "include"
		})
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.message || "Failed to sign out")
		}

		setStoredUser(null)
		setUser(null)
	}, [])

	const signIn = useCallback(
		async ({ realm, email, password, adminKey }: SignInParams) => {
			try {
				const response = await fetch(`${API_URL}/auth/sign-in`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ realm, email, password, adminKey }),
					credentials: "include"
				})

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}))
					throw new Error(errorData.message || "Failed to sign in")
				}

				const data = await response.json()

				setStoredUser(JSON.stringify(data.user))
				setUser(data.user)
			} catch (error) {
				console.error("Sign in error:", error)
				throw error
			}
		},
		[]
	)

	useEffect(() => {
		setUser(getStoredUser())
	}, [])

	return (
		<AuthContext.Provider value={{ isAuthenticated, user, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}
