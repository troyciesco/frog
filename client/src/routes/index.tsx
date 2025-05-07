import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { API_URL } from "../constants"

export const Route = createFileRoute("/")({
	component: Index
})

function Index() {
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
		<div className="p-2">
			<h3>Welcome Home!</h3>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</div>
	)
}
