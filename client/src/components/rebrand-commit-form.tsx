import { useAppForm } from "../hooks/use-app-form"

export function RebrandCommitForm({
	oldBrand,
	newBrand,
	onSuccess
}: {
	oldBrand: string
	newBrand: string
	onSuccess: (jobId: string) => void
}) {
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
			// const res = await commitChanges({ ...value })
			console.log(value, oldBrand, newBrand)
			const res = { success: true }
			if (res.success) {
				onSuccess("jobid")
			}
		}
	})
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				form.handleSubmit()
			}}>
			<h2>Confirm Changes</h2>
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
					<field.Checkbox label="I confirm I checked my content and the updates make sense." />
				)}
			/>
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
								label={isSubmitting ? "Submitting..." : "Submit"}
								disabled={!allChecked}
							/>
						)
					}}
				</form.Subscribe>
			</form.AppForm>
		</form>
	)
}
