import { createFileRoute } from "@tanstack/react-router"
import { useAuth } from "../hooks/use-auth"
import { useState } from "react"
import { CalculateChangesForm } from "../components/calculate-changes-form"

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardPage
})

function DashboardPage() {
	const auth = useAuth()
	const [data, setData] = useState<{ id: string }[]>([])

	// useEffect(() => {
	// 	const getMessage = async () => {
	// 		const res = await fetch(`${API_URL}/calculate-changes/posts`, {
	// 			credentials: "include"
	// 		})
	// 		const data = await res.json()
	// 		setData(data)
	// 	}
	// 	getMessage()
	// }, [])

	return (
		<section className="grid gap-2 p-2">
			<p>Hi {JSON.stringify(auth.user)}!</p>
			<p>You are currently on the dashboard route.</p>
			<CalculateChangesForm onSuccess={setData} />
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</section>
	)
}
