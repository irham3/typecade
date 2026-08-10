import { expect, test } from "@playwright/test"

for (const viewport of [
	{ name: "desktop", width: 1_440, height: 900 },
	{ name: "laptop", width: 1_366, height: 768 },
	{ name: "tablet", width: 820, height: 1_180 },
	{ name: "mobile", width: 390, height: 844 },
	{ name: "wide", width: 1_920, height: 1_080 },
]) {
	test(`gameplay fits the ${viewport.name} viewport`, async ({ page }) => {
		await page.setViewportSize({ width: viewport.width, height: viewport.height })
		await page.goto("/overdrive")
		await page.getByRole("button", { name: "PLAY", exact: true }).click()

		const root = page.locator("[data-overdrive-root]")
		const game = page.locator("[data-overdrive-gameplay]")
		const host = page.getByTestId("pixi-gameplay")
		const canvas = host.locator("canvas")
		await expect(canvas).toHaveCount(1)

		const [rootBox, gameBox, hostBox, canvasBox] = await Promise.all([
			root.boundingBox(),
			game.boundingBox(),
			host.boundingBox(),
			canvas.boundingBox(),
		])
		expect(rootBox?.width).toBeGreaterThanOrEqual(viewport.width - 1)
		expect(gameBox?.width).toBeGreaterThanOrEqual(viewport.width - 1)
		expect(hostBox?.width).toBeGreaterThanOrEqual(viewport.width - 1)
		expect(hostBox?.height).toBeGreaterThanOrEqual(viewport.height - 1)
		expect(Math.abs((canvasBox?.width ?? 0) - (hostBox?.width ?? 0))).toBeLessThanOrEqual(1)
		expect(Math.abs((canvasBox?.height ?? 0) - (hostBox?.height ?? 0))).toBeLessThanOrEqual(1)

		const overflow = await page.evaluate(() => ({
			x: document.documentElement.scrollWidth - innerWidth,
			y: document.documentElement.scrollHeight - innerHeight,
		}))
		expect(overflow.x).toBeLessThanOrEqual(1)
		expect(overflow.y).toBeLessThanOrEqual(1)
	})
}
