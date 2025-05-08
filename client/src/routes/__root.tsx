import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import type { AuthContext } from "../providers/contexts/auth-context"

export const Route = createRootRouteWithContext<{
	auth: AuthContext | undefined
}>()({
	component: () => (
		<>
			<Outlet />
		</>
	)
})
