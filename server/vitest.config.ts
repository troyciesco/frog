import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		environment: "node",
		setupFiles: "./__tests__/setup.ts",
		include: ["**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"]
		},
		env: {
			PORT: "0",
			ENCRYPTION_KEY: "test-encryption-key",
			ALLOWED_ORIGINS: "http://localhost:1111"
		}
	}
})
