import { useEffect, useState } from "react"
import { getJobs } from "../api"

export function Jobs() {
	const [jobs, setJobs] = useState([])

	useEffect(() => {
		const poll = async () => {
			try {
				const res = await getJobs()
				setJobs(res.data.jobs)

				// if there's an active job, re-check results every 2 seconds
				// @TODO: not efficient to fetch all the jobs all over again, so should just fetch running ones at some point
				if (
					res.data.jobs?.some(
						// @ts-expect-error need to add types
						(j) => j.state !== "completed" && j.state !== "failed"
					)
				) {
					setTimeout(poll, 2000)
				}
			} catch (err) {
				console.error(err)
			}
		}

		poll()
	}, [])

	return (
		<div>
			<div>jobs</div>
			<pre>{JSON.stringify(jobs, null, 2)}</pre>
		</div>
	)
}
