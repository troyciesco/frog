import { useStore } from "@tanstack/react-form"
import { useFieldContext } from "../hooks/form-context"
import { Label } from "./ui/label"

export default function FormCheckbox({ label }: { label: string }) {
	const field = useFieldContext<boolean>()

	const errors = useStore(field.store, (state) => state.meta.errors)

	return (
		<div className="flex items-center space-x-2">
			<input
				id={field.name}
				type="checkbox"
				checked={field.state.value}
				onChange={(e) => field.handleChange(e.target.checked)}
			/>
			<Label htmlFor={field.name}>
				<span>{label}</span>
			</Label>
			{errors.map((error: string) => (
				<div key={error} style={{ color: "red" }}>
					{error}
				</div>
			))}
		</div>
	)
}
