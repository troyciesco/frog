import { useStore } from "@tanstack/react-form"
import { useFieldContext } from "../hooks/form-context.tsx"

export default function Checkbox({ label }: { label: string }) {
	const field = useFieldContext<boolean>()

	const errors = useStore(field.store, (state) => state.meta.errors)

	return (
		<div>
			<label>
				<input
					type="checkbox"
					checked={field.state.value}
					onChange={(e) => field.handleChange(e.target.checked)}
				/>
				<span>{label}</span>
			</label>
			{errors.map((error: string) => (
				<div key={error} style={{ color: "red" }}>
					{error}
				</div>
			))}
		</div>
	)
}
