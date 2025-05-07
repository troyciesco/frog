import { vi } from "vitest"

// for cleaner logs when running tests - might see if i can make a flag for this
vi.spyOn(console, "error").mockImplementation(() => {})
// vi.spyOn(console, "warn").mockImplementation(() => {})
// vi.spyOn(console, "log").mockImplementation(() => {})
