import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8788"
const serverPort = new URL(baseURL).port || "8788"

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	timeout: 60000,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "html",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: [
		{
			command: `npx wrangler dev --config wrangler.ocean.jsonc --port ${serverPort} --persist-to .wrangler/e2e-state`,
			url: baseURL,
			reuseExistingServer: false,
			timeout: 120000,
		},
	],
})
