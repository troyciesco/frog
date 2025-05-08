import { useRouter, useRouterState } from "@tanstack/react-router"
import { useAuth } from "../hooks/use-auth"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

export function SignInForm({
	fallback,
	search = {}
}: {
	search?: { redirect?: string }
	fallback: string
}) {
	const auth = useAuth()
	const router = useRouter()
	const isLoading = useRouterState({ select: (s) => s.isLoading })
	const navigate = useNavigate()
	const [isSubmitting, setIsSubmitting] = useState(false)

	const onFormSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true)
		try {
			evt.preventDefault()
			const data = new FormData(evt.currentTarget)
			const realm = data.get("realm")?.toString()
			const email = data.get("email")?.toString()
			const password = data.get("password")?.toString()

			if (!realm || !email || !password) return
			await auth.signIn({ realm, email, password })

			await router.invalidate()

			// there's an open issue related to this i think: https://github.com/TanStack/router/issues/3679
			await navigate({ to: search.redirect || fallback })
		} catch (error) {
			console.error("Error logging in: ", error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const isSigningIn = isLoading || isSubmitting

	return (
		<Card className="w-[350px]">
			<CardHeader>
				<CardTitle>Create project</CardTitle>
				<CardDescription>Deploy your new project in one-click.</CardDescription>
			</CardHeader>
			<form onSubmit={onFormSubmit}>
				<CardContent>
					<fieldset className="grid w-full items-center gap-4">
						<div className="flex flex-col space-y-1.5">
							<Label htmlFor="realm-input">Realm</Label>
							<Input
								id="realm-input"
								name="realm"
								placeholder="Enter your realm (http://localhost:2368)"
								type="text"
								required
							/>
						</div>
						<div className="flex flex-col space-y-1.5">
							<Label htmlFor="email-input">Email</Label>
							<Input
								id="email-input"
								name="email"
								placeholder="Enter your email"
								type="email"
								required
							/>
						</div>
						<div className="flex flex-col space-y-1.5">
							<Label htmlFor="password-input">Password</Label>
							<Input
								id="password-input"
								name="password"
								placeholder="Enter your password"
								type="password"
								required
							/>
						</div>
					</fieldset>
				</CardContent>
				<CardFooter className="flex justify-center mt-10">
					<Button className="w-full" type="submit">
						{isSigningIn ? "Loading..." : "Sign In"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	)
}
