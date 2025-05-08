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
	const [formError, setFormError] = useState<string | null>(null)

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
			const message =
				error instanceof Error ? error.message : "An unknown error occurred"
			setFormError(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	const isSigningIn = isLoading || isSubmitting

	return (
		<Card className="w-[350px]">
			<CardHeader>
				<CardTitle>
					Welcome to{" "}
					<span className="font-black text-emerald-600">F.R.O.G.</span>!
				</CardTitle>
				<CardDescription className="space-y-2">
					<p>
						This tool helps you rebrand your Ghost blog. We replace your old
						brand name with your new one across your posts, pages, and more!
					</p>
					<ul className="list-disc">
						Sign into{" "}
						<span className="font-black text-emerald-600">F.R.O.G.</span> with:
						<li className="ml-3">
							the domain of your Ghost blog (just "https://domain.com", no
							"/ghost" at the end)
						</li>
						<li className="ml-3">
							the email and password you use to sign in to your Ghost admin
							panel.
						</li>
					</ul>
				</CardDescription>
			</CardHeader>
			<form onSubmit={onFormSubmit}>
				<CardContent>
					<fieldset className="grid w-full items-center gap-4">
						<div className="flex flex-col space-y-2">
							<Label htmlFor="realm-input">Ghost Site</Label>
							<Input
								id="realm-input"
								name="realm"
								placeholder="http://localhost:2368"
								type="text"
								required
							/>
							<div className="text-xs text-muted-foreground">
								Include the protocol (http:// or https://)
							</div>
						</div>
						<div className="flex flex-col space-y-2">
							<Label htmlFor="email-input">Email</Label>
							<Input
								id="email-input"
								name="email"
								placeholder="Enter your email"
								type="email"
								required
							/>
						</div>
						<div className="flex flex-col space-y-2">
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
				<CardFooter className="flex flex-col justify-center mt-10 gap-4">
					<Button className="w-full" type="submit">
						{isSigningIn ? "Loading..." : "Sign In"}
					</Button>
					<div className="text-red-600 font-bold">{formError}</div>
				</CardFooter>
			</form>
		</Card>
	)
}
