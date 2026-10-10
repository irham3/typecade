import { expect, test } from "@playwright/test"

test("recovers from WebGL context loss without resetting the active encounter", async ({ page }) => {
	await page.goto("/")
	await page.getByRole("button", { name: "Adventure", exact: true }).click()
	await page.getByRole("button", { name: "Set Sail", exact: true }).click()
	const renderer = page.getByTestId("three-gameplay")
	await expect(renderer).toHaveAttribute("data-renderer-state", "ready")
	const target = await page.getByTestId("typing-target").textContent()
	await page.getByLabel("Adventure typing input").pressSequentially(target!.slice(0, 3))
	await expect(page.getByTestId("typing-target").locator(".done")).toHaveCount(3)
	await renderer.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
		const extension = canvas.getContext("webgl2")!.getExtension("WEBGL_lose_context")!
		extension.loseContext()
	})
	await expect(renderer).toHaveAttribute("data-renderer-state", "error")
	await expect(page.locator("div[inert]").filter({ has: page.getByTestId("ocean-hud") })).toHaveCount(1)
	const timer = page.locator(".stat").filter({ hasText: "TIME LEFT" })
	const frozen = await timer.textContent()
	await page.waitForTimeout(1100)
	await expect(timer).toHaveText(frozen!)
	await page.getByRole("button", { name: "Retry", exact: true }).click()
	await expect(renderer).toHaveAttribute("data-renderer-state", "ready")
	await expect(renderer.locator("canvas")).toHaveCount(1)
	await expect(page.getByTestId("typing-target").locator(".done")).toHaveCount(3)
	await page.getByLabel("Adventure typing input").pressSequentially(target!.slice(3, 4))
	await expect(page.getByTestId("typing-target").locator(".done")).toHaveCount(4)
	await expect(page.getByTestId("route-strip")).toContainText("Encounter 1/10")
})
