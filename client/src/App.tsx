import { useEffect, useState } from "react"
import { API_URL } from "./constants"

export function App() {
	const [data, setData] = useState<{ message: string } | null>(null)

	useEffect(() => {
		const getMessage = async () => {
			console.log(API_URL)
			console.log(import.meta.env.VITE_API_URL)
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
