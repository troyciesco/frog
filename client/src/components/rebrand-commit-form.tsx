import { cn } from "@/lib/utils"
import { rebrandCommit } from "../api"
import { useAppForm } from "../hooks/use-app-form"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from "./ui/card"
import { useState } from "react"

type Counts = {
	posts: number
	pages: number
	tags: number
	tiers: number
	newsletters: number
}

export function RebrandCommitForm({
	oldBrand,
	newBrand,
	onSuccess,
	step,
	counts
}: {
	oldBrand: string
	newBrand: string
	onSuccess: (jobId: string) => void
	step: 1 | 2 | 3
	counts: Counts
}) {
	const [formError, setFormError] = useState<string | null>(null)
	const form = useAppForm({
		defaultValues: {
			hasBackedUp: false,
			hasCheckedSpelling: false,
			hasSpotChecked: false
		},
		validators: {
			onSubmit: ({ value }) => {
				const errors = {
					fields: {}
				} as {
					fields: Record<string, string>
				}
				if (!value.hasBackedUp) {
					errors.fields.hasBackedUp =
						"You must confirm you backed up your database before continuing."
				}
				if (!value.hasCheckedSpelling) {
					errors.fields.hasCheckedSpelling =
						"You must confirm you checked the spelling of your old brand and your new one."
				}
				if (!value.hasSpotChecked) {
					errors.fields.hasSpotChecked =
						"You must confirm you checked your content to make sure our selections make sense."
				}

				return errors
			}
		},
		onSubmit: async ({ value }) => {
			const { res, error } = await rebrandCommit({
				...value,
				oldBrand,
				newBrand
			})

			console.log(res)
			if (res?.success) {
				onSuccess(res.data.jobId)
			}

			// ends up clearing it if there isn't one
			setFormError(error)
		}
	})

	return (
		<Card
			className={cn(
				step === 2
					? "bg-emerald-50 drop-shadow-xl drop-shadow-emerald-200"
					: "bg-gray-200 cursor-not-allowed"
			)}>
			<CardHeader>
				<CardTitle>Step 2: Confirm Your Changes</CardTitle>
				<CardDescription>
					<div>
						Below is how many items will be updated if you proceed with this
						rebrand:
						{counts && (
							<ul className="mt-2 space-y-1 list-disc pl-5">
								{Object.entries(counts).map(([key, count]) => (
									<li key={key}>
										<span className="font-medium">{key}:</span> {count}
									</li>
								))}
							</ul>
						)}
					</div>
				</CardDescription>
			</CardHeader>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}>
				<CardContent>
					<fieldset className="grid w-full items-center gap-4">
						<form.AppField
							name="hasBackedUp"
							children={(field) => (
								<field.Checkbox label="I confirm I have backed up my database." />
							)}
						/>
						<form.AppField
							name="hasCheckedSpelling"
							children={(field) => (
								<field.Checkbox label="I confirm I have checked the spelling of my old brand and my new brand." />
							)}
						/>
						<form.AppField
							name="hasSpotChecked"
							children={(field) => (
								<field.Checkbox label="I confirm I checked some of my content and the updates make sense." />
							)}
						/>
					</fieldset>
				</CardContent>
				<CardFooter className="flex flex-col justify-end mt-10">
					<form.AppForm>
						<form.Subscribe
							selector={(state) => ({
								isSubmitting: state.isSubmitting,
								hasBackedUp: state.values.hasBackedUp,
								hasCheckedSpelling: state.values.hasCheckedSpelling,
								hasSpotChecked: state.values.hasSpotChecked
							})}>
							{({
								isSubmitting,
								hasBackedUp,
								hasCheckedSpelling,
								hasSpotChecked
							}) => {
								const allChecked =
									hasBackedUp && hasCheckedSpelling && hasSpotChecked
								return (
									<form.SubscribeButton
										disabled={
											step !== 2 || form.state.isSubmitting || !allChecked
										}
										label={isSubmitting ? "Submitting..." : "Submit"}
									/>
								)
							}}
						</form.Subscribe>
					</form.AppForm>
					<div className="text-red-600 font-bold text-center">{formError}</div>
				</CardFooter>
			</form>
		</Card>
	)
}
