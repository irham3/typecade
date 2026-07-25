import { expect, test } from "@playwright/test"

test("completing a clean word advances score and the Signal queue", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	const host = page.getByTestId("pixi-gameplay")
	await expect(host.locator("canvas")).toHaveCount(1)
	const firstWord = await host.getAttribute("data-current-word")
	expect(firstWord).toBeTruthy()

	await page.keyboard.type(`${firstWord} `)

	await expect.poll(async () => Number(await host.getAttribute("data-score"))).toBeGreaterThan(0)
	await expect.poll(async () => host.getAttribute("data-current-word")).not.toBe(firstWord)
	await expect(host).toHaveAttribute("data-caret-index", "0")
})
