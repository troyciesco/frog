import { useFormContext } from "../hooks/form-context"
import { Button } from "./ui/button"

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
				<Button disabled={disabled || isSubmitting}>{label}</Button>
			)}
		</form.Subscribe>
	)
}
