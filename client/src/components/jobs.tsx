import { useEffect, useState } from "react"
import { getJobs } from "../api"
import { JobCard } from "./job-card"
import type { Job } from "@/types"

export function Jobs() {
	const [jobs, setJobs] = useState<Job[]>([])
	const [initialLoading, setInitialLoading] = useState(true)
	useEffect(() => {
		const poll = async () => {
			try {
				const res = await getJobs()
				setJobs(res?.data.jobs || [])
				setInitialLoading(false)
				// if there's an active job, re-check results every 2 seconds
				// @TODO: not efficient to fetch all the jobs all over again, so should just fetch running ones at some point
				if (
					res?.data.jobs?.some(
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

	if (initialLoading) {
		return (
			<div className="flex justify-center items-center p-4">
				<div className="animate-spin text-2xl">🐸</div>
			</div>
		)
	}

	if (!initialLoading && jobs.length === 0) {
		return <div>No rebrand history available.</div>
	}

	return (
		<div className="flex flex-col gap-4">
			{jobs?.map((job) => (
				<JobCard
					key={job.id}
					id={job.id}
					title={job.data.title}
					progress={job.progress}
					state={job.state}
				/>
			))}
		</div>
		// <pre>{JSON.stringify(jobs, null, 2)}</pre>
	)
}
