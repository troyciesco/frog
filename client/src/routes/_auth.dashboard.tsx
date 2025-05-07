import { createFileRoute } from "@tanstack/react-router"
import { useAuth } from "../hooks/use-auth"
import { API_URL } from "../constants"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardPage
})

function DashboardPage() {
	const auth = useAuth()
	const [data, setData] = useState<{ message: string } | null>(null)

	useEffect(() => {
		const getMessage = async () => {
			const res = await fetch(`${API_URL}/calculate-changes`, {
				credentials: "include"
			})
			const data = await res.json()
			setData(data)
		}
		getMessage()
	}, [])
	return (
		<section className="grid gap-2 p-2">
			<p>Hi {JSON.stringify(auth.user)}!</p>
			<p>You are currently on the dashboard route.</p>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</section>
	)
}
