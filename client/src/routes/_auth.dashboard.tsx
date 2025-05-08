import { createFileRoute } from "@tanstack/react-router"
// import { useAuth } from "../hooks/use-auth"
import { useState } from "react"
import { RebrandCheckForm } from "../components/rebrand-check-form"
import { RebrandCommitForm } from "../components/rebrand-commit-form"
import { Jobs } from "../components/jobs"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card"

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardPage
})

function DashboardPage() {
	// const auth = useAuth()
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
		<section className="grid md:grid-cols-2 auto-rows-min gap-4 p-2 relative">
			<Card className="relative">
				{jobId && (
					<div className="absolute w-full h-full bg-gray-400/30 backdrop-blur-md flex flex-col items-center justify-center z-10 px-2 top-0 rounded-xl">
						<div className="text-center text-balance">
							Job is currently running, please wait for that one to finish
							before starting a new one.
						</div>
					</div>
				)}
				<CardHeader>
					<CardTitle>F.R.O.G. Rebranding Tool</CardTitle>
					<CardDescription>
						Deploy your new project in one-click.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-8">
						<div>
							<RebrandCheckForm onSuccess={handleCalculateChanges} />
						</div>
						<div>
							{data.frequency && (data.frequency as number) > 5 && (
								<div role="alert">{data.newBrand} is a very common phrase.</div>
							)}
							<RebrandCommitForm
								oldBrand={data.oldBrand as string}
								newBrand={data.newBrand as string}
								onSuccess={handleCommitChanges}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Rebrand Details</CardTitle>
					<CardDescription>
						Deploy your new project in one-click.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{step === 3 && <div>job running: {jobId}</div>}
					<div className="max-w-2xl text-wrap overflow-x-hidden">
						{data.length}
					</div>
					<Jobs />
				</CardContent>
			</Card>
		</section>
	)
}
