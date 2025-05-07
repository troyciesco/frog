import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		include: ["**/*.test.ts", "**/*.test.tsx"],
		setupFiles: "./src/__tests__/setup.ts",
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"]
		}
	}
})
