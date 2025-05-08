import { rebrandCheck } from "../api"
import { useAppForm } from "../hooks/use-app-form"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"

export function RebrandCheckForm({
	onSuccess
}: {
	onSuccess: (data: Record<string, string>) => void
}) {
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
			const res = await rebrandCheck({ ...value })

			if (res.success) {
				onSuccess({
					...res.data,
					oldBrand: value.oldBrand,
					newBrand: value.newBrand
				})
			}
		}
	})
	return (
		<Card>
			<CardHeader>
				<CardTitle>Step 1: Rebrand Details</CardTitle>
			</CardHeader>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}>
				<CardContent>
					<fieldset className="grid w-full items-center gap-4">
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
				<CardFooter className="flex justify-end mt-10">
					<form.AppForm>
						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => {
								return (
									<form.SubscribeButton
										label={isSubmitting ? "Submitting..." : "Submit"}
									/>
								)
							}}
						</form.Subscribe>
					</form.AppForm>
				</CardFooter>
			</form>
		</Card>
	)
}
