import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getJobs } from "@/api"

export const Route = createFileRoute("/_auth/dashboard")({
	component: DashboardPage
})

const siteSettingsHaveOldBrand = ({
	title,
	description,
	oldBrand
}: {
	title: string
	description: string
	oldBrand: string
}) => {
	return title.includes(oldBrand) || description.includes(oldBrand)
}
function DashboardPage() {
	// const auth = useAuth()
	const [step, setStep] = useState<1 | 2 | 3>(1)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [data, setData] = useState<any>({})
	const [jobId, setJobId] = useState<string | null>(null)
	const [initialLoading, setInitialLoading] = useState(true)

	// not ideal to basically do the same fetch here and then again in Jobs,
	// but running low on time - ideally i'd see if Tanstack Router's beforeLoad
	// piece would be useful, and/or implement Tanstack Query for good caching.
	useEffect(() => {
		const findActiveJob = async () => {
			try {
				const res = await getJobs()
				const activeJob = res?.data.jobs?.find(
					(j) => j.state !== "completed" && j.state !== "failed"
				)

				if (activeJob) {
					setJobId(activeJob.id)
				}

				setInitialLoading(false)
			} catch (err) {
				console.error(err)
			}
		}

		findActiveJob()
	}, [])
	const handleCheckChanges = (d: Record<string, string>) => {
		setData(d)
		setStep(2)
	}
	const handleCommitChanges = (j: string) => {
		setStep(3)
		setJobId(j)
	}

	if (initialLoading) {
		return (
			<div className="flex justify-center items-center p-4">
				<div className="animate-spin text-2xl">🐸</div>
			</div>
		)
	}

	return (
		<section className="grid md:grid-cols-2 gap-4 p-2 relative">
			<Card className="relative">
				{jobId && (
					<div className="absolute w-full h-full bg-gray-400/30 backdrop-blur-md flex flex-col items-center z-10 px-2 top-0 rounded-xl">
						<div className="text-center text-balance mt-8">
							Job is currently running, please wait for that one to finish
							before starting a new one.
						</div>
					</div>
				)}
				<CardHeader>
					<CardTitle>
						<span className="font-black text-emerald-600">F.R.O.G.</span>{" "}
						Rebranding Tool
					</CardTitle>
					<CardDescription>
						Enter your brand info, verify the number of updates, and let the job
						run! Or maybe...hop?
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-8">
						<div>
							<RebrandCheckForm step={step} onSuccess={handleCheckChanges} />
						</div>
						<div>
							{data?.site &&
								siteSettingsHaveOldBrand({
									...data.site,
									oldBrand: data.oldBrand
								}) && (
									<Alert variant="warning" className="mb-4">
										<AlertCircle className="h-4 w-4" />
										<AlertTitle>Check your site settings</AlertTitle>
										<AlertDescription>
											<div>
												We found{" "}
												<span className="font-bold">{data.oldBrand}</span> in
												the title and/or description of your site.{" "}
												<span className="font-black text-emerald-600">
													F.R.O.G.
												</span>{" "}
												can't update those values, so be sure to do it manually.
											</div>
										</AlertDescription>
									</Alert>
								)}

							{Number(data.frequency) > 5 && (
								<Alert variant="destructive" className="mb-4">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>
										This change might have unintended consequences
									</AlertTitle>
									<AlertDescription>
										<div>
											One or both of your brand names are{" "}
											{Number(data.frequency) > 20 ? "extremely" : "very"}{" "}
											common in English. If you make widespread changes with{" "}
											<span className="font-black text-emerald-600">
												F.R.O.G.
											</span>{" "}
											you may overwrite more content than intended.{" "}
											<span className="font-bold">Use at your own risk.</span>
										</div>
									</AlertDescription>
								</Alert>
							)}
							<RebrandCommitForm
								step={step}
								oldBrand={data.oldBrand as string}
								newBrand={data.newBrand as string}
								onSuccess={handleCommitChanges}
								counts={data.counts}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Rebrand Job Details</CardTitle>
					<CardDescription>
						Below is information on past rebrands. If a rebrand is currently
						running, it will be at the top and update periodically.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{step === 3 && jobId && (
						<Alert className="mb-4" variant="success">
							<AlertTitle>
								New job created,
								<Button variant="link" onClick={() => window.location.reload()}>
									refresh to follow progress.
								</Button>
							</AlertTitle>
						</Alert>
					)}
					<Jobs
						onPollComplete={() => {
							setJobId(null)
							setStep(1)
						}}
					/>
				</CardContent>
			</Card>
		</section>
	)
}
