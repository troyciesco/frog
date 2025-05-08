import { useFormContext } from "../hooks/form-context"

export default function SubscribeButton({
	label,
	disabled = false
}: {
	label: string
	disabled?: boolean
}) {
	const form = useFormContext()
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<button disabled={disabled || isSubmitting}>{label}</button>
			)}
		</form.Subscribe>
	)
}
