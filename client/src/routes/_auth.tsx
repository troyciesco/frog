import {
	createFileRoute,
	Outlet,
	redirect,
	useRouter
} from "@tanstack/react-router"

import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@radix-ui/react-separator"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export const Route = createFileRoute("/_auth")({
	beforeLoad: ({ context, location }) => {
		if (!context?.auth?.isAuthenticated) {
			throw redirect({
				to: "/sign-in",
				search: {
					redirect: location.href
				}
			})
		}
	},
	component: AuthLayout
})

function AuthLayout() {
	const router = useRouter()
	const navigate = Route.useNavigate()
	const auth = useAuth()

	const handleSignOut = () => {
		if (window.confirm("Are you sure you want to logout?")) {
			auth.signOut().then(() => {
				router.invalidate().finally(() => {
					navigate({ to: "/" })
				})
			})
		}
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex justify-between h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1" />
						<div className="text-sm flex items-center">
							<span>
								<span className="font-bold">User: </span>
								{auth.user?.email}
							</span>
							<Separator orientation="vertical" className="mr-2 h-4" />
							<span>
								<span className="font-bold">Ghost Site: </span>
								{auth.user?.realm}
							</span>
						</div>
					</div>
					<Button onClick={handleSignOut}>Sign Out</Button>
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4">
					<div className="min-h-[100vh] flex-1 md:min-h-min">
						<Outlet />
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
