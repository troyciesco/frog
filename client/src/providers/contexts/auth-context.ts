import { createContext } from "react"

export type SignInParams = {
	realm: string
	email?: string
	password?: string
	adminKey?: string
}

export type AuthContext = {
	isAuthenticated: boolean
	signIn: (params: SignInParams) => Promise<void>
	signOut: () => Promise<void>
	user: { email?: string; realm: string } | null
}

export const AuthContext = createContext<AuthContext | null>(null)
