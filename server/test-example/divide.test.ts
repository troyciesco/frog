import { expect, test } from "vitest"
import { divide } from "./divide.js"

test("divides 10 by 5 to get 2", () => {
	expect(divide(10, 5)).toBe(2)
})
