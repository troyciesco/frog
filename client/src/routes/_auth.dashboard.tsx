import { createFileRoute } from "@tanstack/react-router"
import { useAuth } from "../hooks/use-auth"
import { useState } from "react"
import { RebrandCheckForm } from "../components/rebrand-check-form"
import { RebrandCommitForm } from "../components/rebrand-commit-form"
import { Jobs } from "../components/jobs"

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardPage
})

function DashboardPage() {
	const auth = useAuth()
	const [step, setStep] = useState<1 | 2 | 3>(1)
	const [data, setData] = useState<Record<string, string | number>>({})
	const [jobId, setJobId] = useState<string | null>(null)

	const handleCalculateChanges = (d: Record<string, string>) => {
		setData(d)
		setStep(2)
	}
	const handleCommitChanges = (j: string) => {
		setStep(3)
		setJobId(j)
	}

	return (
		<section className="grid gap-2 p-2">
			<p>Hi {JSON.stringify(auth.user)}!</p>
			<p>You are currently on the dashboard route.</p>
			<Jobs />
			{step === 1 && <div>active step</div>}
			<RebrandCheckForm onSuccess={handleCalculateChanges} />
			{step === 2 && <div>active step</div>}
			<>
				{data.frequency && (data.frequency as number) > 5 && (
					<div role="alert">{data.newBrand} is a very common phrase.</div>
				)}
				<RebrandCommitForm
					oldBrand={data.oldBrand as string}
					newBrand={data.newBrand as string}
					onSuccess={handleCommitChanges}
				/>
			</>

			{step === 3 && <div>job running: {jobId}</div>}
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</section>
	)
}
