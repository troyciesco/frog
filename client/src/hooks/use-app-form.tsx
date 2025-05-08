import { createFormHook } from "@tanstack/react-form"
import { lazy } from "react"
import { fieldContext, formContext } from "./form-context"

const TextField = lazy(() => import("../components/text-field.tsx"))
const Checkbox = lazy(() => import("../components/checkbox.tsx"))
const SubscribeButton = lazy(() => import("../components/subscribe-button.tsx"))

export const { useAppForm, withForm } = createFormHook({
	fieldComponents: {
		TextField,
		Checkbox
	},
	formComponents: {
		SubscribeButton
	},
	fieldContext,
	formContext
})
