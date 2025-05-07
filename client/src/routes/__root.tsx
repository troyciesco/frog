import {
	createRootRouteWithContext,
	Link,
	Outlet
} from "@tanstack/react-router"
import type { AuthContext } from "../providers/contexts/auth-context"

export const Route = createRootRouteWithContext<{
	auth: AuthContext | undefined
}>()({
	component: () => (
		<>
			<div className="p-2 flex gap-2">
				<Link to="/" className="[&.active]:font-bold">
					Home
				</Link>
				<Link to="/about" className="[&.active]:font-bold">
					About
				</Link>
				<Link to="/dashboard" className="[&.active]:font-bold">
					Dashboard
				</Link>
			</div>
			<hr />
			<Outlet />
		</>
	)
})
