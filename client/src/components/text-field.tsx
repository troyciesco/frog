import { useStore } from "@tanstack/react-form"
import { useFieldContext } from "../hooks/form-context"
import { Label } from "./ui/label"
import { Input } from "./ui/input"

export default function TextField({
	label,
	placeholder = ""
}: {
	label: string
	placeholder?: string
}) {
	const field = useFieldContext<string>()

	const errors = useStore(field.store, (state) => state.meta.errors)

	return (
		<div>
			<div className="flex flex-col space-y-1.5">
				<Label htmlFor={`${field.name}-input`}>{label}</Label>
				<Input
					id={`${field.name}-input`}
					name={field.name}
					placeholder={placeholder}
					type="text"
					required
					value={field.state.value}
					onChange={(e) => field.handleChange(e.target.value)}
				/>
			</div>
			{errors.map((error: string) => (
				<div key={error} style={{ color: "red" }}>
					{error}
				</div>
			))}
		</div>
	)
}
