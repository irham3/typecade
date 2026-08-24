import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
const serverPort = new URL(baseURL).port || "3000"

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
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
	webServer: {
		command: `npm run dev -- --port ${serverPort} --strictPort true`,
		url: baseURL,
		env: {
			NEXT_PUBLIC_OVERDRIVE: "true",
		},
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
})
