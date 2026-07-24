import { test, expect } from "@playwright/test"

test("overdrive starts combat and renders Pixi", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "Play" }).click()
	await expect(page.getByTestId("pixi-gameplay")).toBeVisible()
	await expect(page.getByText(/Zone 1/i)).toBeVisible()
	await page.keyboard.type("test")
	await expect(page.locator("canvas")).toHaveCount(1)
})

test("practice remains available", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("link", { name: "Practice" }).click()
	await expect(page).toHaveURL(/\/$/)
})
