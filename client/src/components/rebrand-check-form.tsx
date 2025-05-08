import { cn } from "@/lib/utils"
import { rebrandCheck } from "../api"
import { useAppForm } from "../hooks/use-app-form"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { useState } from "react"

export function RebrandCheckForm({
	onSuccess,
	step
}: {
	onSuccess: (data: Record<string, string>) => void
	step: 1 | 2 | 3
}) {
	const [formError, setFormError] = useState<string | null>(null)
	const form = useAppForm({
		defaultValues: {
			oldBrand: "",
			newBrand: ""
		},
		validators: {
			onSubmit: ({ value }) => {
				const errors = {
					fields: {}
				} as {
					fields: Record<string, string>
				}
				if (!value.oldBrand || value.oldBrand.trim() === "") {
					errors.fields.oldBrand = "Old brand is required"
				}
				if (!value.newBrand || value.newBrand.trim() === "") {
					errors.fields.newBrand = "New brand is required"
				}
				return errors
			}
		},
		onSubmit: async ({ value }) => {
			const { res, error } = await rebrandCheck({ ...value })
			console.log(res)
			if (res?.success) {
				onSuccess({
					...res.data,
					oldBrand: value.oldBrand,
					newBrand: value.newBrand
				})
			}
			// ends up clearing it if there isn't one
			setFormError(error)
		}
	})
	return (
		<Card
			className={cn(
				step === 1
					? "bg-emerald-50 drop-shadow-xl drop-shadow-emerald-200"
					: "bg-gray-200 cursor-not-allowed"
			)}>
			<CardHeader>
				<CardTitle>Step 1: Rebrand Details</CardTitle>
			</CardHeader>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}>
				<CardContent>
					<fieldset
						disabled={step !== 1 || form.state.isSubmitting}
						className="grid w-full items-center gap-4">
						<form.AppField
							name="oldBrand"
							children={(field) => <field.TextField label="Old Brand Name" />}
						/>
						<form.AppField
							name="newBrand"
							children={(field) => <field.TextField label="New Brand Name" />}
						/>
					</fieldset>
				</CardContent>
				<CardFooter className="flex flex-col justify-end mt-10">
					<form.AppForm>
						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => {
								return (
									<form.SubscribeButton
										disabled={step !== 1 || form.state.isSubmitting}
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
