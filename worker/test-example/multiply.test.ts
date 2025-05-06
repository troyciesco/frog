import { expect, test } from "vitest"
import { multiply } from "./multiply.js"

test("multiplies 10 by 5 to get 50", () => {
	expect(multiply(10, 5)).toBe(50)
})
