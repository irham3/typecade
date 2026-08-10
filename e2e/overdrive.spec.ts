import { expect, test } from "@playwright/test"

test("starts a playable Pixi run without browser errors", async ({ page }) => {
	const errors: Error[] = []
	page.on("pageerror", (error) => errors.push(error))

	await page.goto("/overdrive")
	const title = page.getByRole("heading", { name: "TYPECADE" })
	await expect(title).toBeVisible()
	await expect(page.getByRole("button", { name: /^DAILY SEED \d{2}:\d{2}:\d{2}$/ })).toBeVisible()
	const titleFont = await title.evaluate((element) => getComputedStyle(element).fontFamily)
	expect(titleFont).toContain("Press Start 2P")
	const rootFont = await page.locator("[data-overdrive-root]").evaluate(
		(element) => getComputedStyle(element).fontFamily,
	)
	expect(rootFont).toContain("JetBrains Mono")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	await expect(page.getByTestId("pixi-gameplay").locator("canvas")).toHaveCount(1)
	await expect(page.getByText("Z1 · WARM-UP", { exact: true })).toBeVisible()
	await expect(page.getByText("KEYCAP BUILD")).toBeVisible()
	expect(errors).toEqual([])
})

test("keeps the existing Practice route available", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("link", { name: "PRACTICE" }).click()
	await expect(page).toHaveURL(/\/$/)
})

test("exposes the feature-gated Overdrive route in navigation", async ({ page }) => {
	await page.goto("/")
	await expect(page.getByRole("navigation").getByRole("link", { name: "Overdrive" })).toBeVisible()

	await page.setViewportSize({ width: 390, height: 844 })
	await page.goto("/")
	await page.getByRole("button", { name: "Open menu" }).click()
	await expect(page.getByRole("link", { name: "Overdrive" })).toBeVisible()
})
