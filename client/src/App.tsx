import { useEffect, useState } from "react"
import { API_URL } from "./constants"

export function App() {
	const [data, setData] = useState<{ message: string } | null>(null)

	useEffect(() => {
		const getMessage = async () => {
			const res = await fetch(API_URL)
			const data = await res.json()
			setData(data)
		}
		getMessage()
	}, [])

	return (
		<>
			<h1>Welcome to frog!</h1>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</>
	)
}
