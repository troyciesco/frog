import { createFileRoute, redirect } from "@tanstack/react-router"
import { SignInForm } from "@/components/sign-in-form"
import { z } from "zod"

const fallback = "/dashboard" as const

export const Route = createFileRoute("/")({
	validateSearch: z.object({
		redirect: z.string().optional().catch("")
	}),
	beforeLoad: ({ context, search }) => {
		if (context?.auth?.isAuthenticated) {
			throw redirect({ to: search.redirect || fallback })
		}
	},
	component: Index
})

function Index() {
	const search = Route.useSearch()

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-[350px]">
				<div className="mb-4 flex items-center justify-center">
					<img src="/frog-logo.svg" alt="Frog logo" width={149} height={69} />
				</div>

				<SignInForm search={search} fallback={fallback} />
			</div>
		</div>
	)
}
