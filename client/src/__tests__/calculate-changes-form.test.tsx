import { beforeEach, describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { CalculateChangesForm } from "../components/calculate-changes-form"
import { vi } from "vitest"

type TextFieldType = {
	TextField: React.FC<{ label: string }>
}

// @TODO: this seems overly complex and like i'm just re-creating
// tanstack form functionality and testing something that isn't real
vi.mock("../hooks/use-app-form", () => ({
	useAppForm: () => ({
		AppField: ({
			children
		}: {
			children: (field: TextFieldType) => React.ReactNode
		}) =>
			children({
				TextField: ({ label }: { label: string }) => (
					<label>
						{label}
						<input />
					</label>
				)
			}),
		AppForm: ({ children }: { children: React.ReactNode }) => children,
		Subscribe: ({
			children
		}: {
			children: (value: boolean) => React.ReactNode
		}) => children(false),
		SubscribeButton: ({ label }: { label: string }) => <button>{label}</button>,
		handleSubmit: vi.fn()
	})
}))

describe("CalculateChangesForm Component", () => {
	beforeEach(() => render(<CalculateChangesForm />))
	it("renders the form", () => {
		expect(
			screen.getByRole("heading", { name: "Rebrand Details" })
		).toBeInTheDocument()

		expect(screen.getByLabelText("Old Brand Name")).toBeInTheDocument()
		expect(screen.getByLabelText("New Brand Name")).toBeInTheDocument()
		expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument()
	})
})
