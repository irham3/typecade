import { expect, test } from "@playwright/test"

test.describe("Ocean Typing RPG shell", () => {
	for (const viewport of [
		{ name: "desktop", width: 1366, height: 768 },
		{ name: "mobile", width: 390, height: 844 },
	]) {
		test(`renders a nonblank Phaser scene without HUD overlap on ${viewport.name}`, async ({ page }) => {
			const consoleErrors: string[] = []
			page.on("console", (message) => {
				if (message.type() === "error") {
					consoleErrors.push(message.text())
				}
			})
			page.on("pageerror", (error) => consoleErrors.push(error.message))

			await page.setViewportSize({ width: viewport.width, height: viewport.height })
			await page.goto("/")
			await expect(page.getByTestId("phaser-gameplay").locator("canvas")).toHaveCount(1)
			await expect(page.getByTestId("main-menu")).toBeVisible()
			await page.getByRole("button", { name: "Start Expedition" }).click()
			await expect(page.getByTestId("prep-screen")).toBeVisible()
			await page.getByRole("button", { name: "Set Sail" }).click()
			await expect(page.getByTestId("typing-console")).toBeVisible()
			const target = (await page.getByTestId("typing-target").textContent())?.replace(/\u00a0/g, " ") ?? ""
			const prefixEnd = target.split(" ").slice(0, 3).join(" ").length + 1
			await page.keyboard.type(target.slice(0, prefixEnd), { delay: 2 })
			const activeSkill = page.locator("[data-testid='skill-dock'] .skill-button.active:enabled").first()
			await expect(activeSkill).toBeEnabled()
			await activeSkill.click()
			await expect(page.getByTestId("skill-feedback")).toBeVisible()

			await expectCanvasNonBlank(page)
			await expectHudDoesNotOverlap(page)

			// Cast Net can legitimately finish a small fish once the typing gate is
			// met; other skills still require the rest of the passage.
			await page.waitForTimeout(100)
			if (await page.getByTestId("result-toast").count() === 0) {
				await page.keyboard.type(target.slice(prefixEnd), { delay: 2 })
			}
			await expect(page.getByTestId("result-toast")).toBeVisible()
			await page.waitForTimeout(250)
			await expectCanvasNonBlank(page)
			expect(consoleErrors).toEqual([])
		})
	}
})

async function expectCanvasNonBlank(page: import("@playwright/test").Page): Promise<void> {
	await expect.poll(async () => {
		const stats = await sampleCanvas(page)
		return stats.colored > 1000 && stats.variance > 20
	}, { timeout: 10000 }).toBe(true)
}

async function sampleCanvas(page: import("@playwright/test").Page): Promise<{ colored: number; variance: number }> {
	return page.locator("[data-testid='phaser-gameplay'] canvas").evaluate((canvas: HTMLCanvasElement) => {
		const probe = document.createElement("canvas")
		probe.width = 64
		probe.height = 64
		const context = probe.getContext("2d")
		if (!context) {
			return { colored: 0, variance: 0 }
		}
		context.drawImage(canvas, 0, 0, probe.width, probe.height)
		const data = context.getImageData(0, 0, probe.width, probe.height).data
		let colored = 0
		let min = 255
		let max = 0
		for (let index = 0; index < data.length; index += 4) {
			const luminance = (data[index] ?? 0) + (data[index + 1] ?? 0) + (data[index + 2] ?? 0)
			if (luminance > 15) {
				colored += 1
			}
			min = Math.min(min, luminance)
			max = Math.max(max, luminance)
		}
		return { colored, variance: max - min }
	})
}

async function expectHudDoesNotOverlap(page: import("@playwright/test").Page): Promise<void> {
	const overlaps = await page.evaluate(() => {
		const selectors = [
			"[data-testid='topbar']",
			"[data-testid='route-strip']",
			"[data-testid='fish-card']",
			"[data-testid='typing-console']",
			"[data-testid='skill-dock']",
		]
		const rects = selectors
			.map((selector) => {
				const element = document.querySelector(selector)
				if (!element) {
					return null
				}
				const style = window.getComputedStyle(element)
				if (style.display === "none" || style.visibility === "hidden") {
					return null
				}
				const rect = element.getBoundingClientRect()
				if (rect.width === 0 || rect.height === 0) {
					return null
				}
				return { selector, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
			})
			.filter(Boolean) as Array<{ selector: string; left: number; top: number; right: number; bottom: number }>

		const badPairs: string[] = []
		for (let leftIndex = 0; leftIndex < rects.length; leftIndex += 1) {
			for (let rightIndex = leftIndex + 1; rightIndex < rects.length; rightIndex += 1) {
				const left = rects[leftIndex]!
				const right = rects[rightIndex]!
				const xOverlap = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
				const yOverlap = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top))
				if (xOverlap * yOverlap > 16) {
					badPairs.push(`${left.selector} overlaps ${right.selector}`)
				}
			}
		}
		return badPairs
	})

	expect(overlaps).toEqual([])
}
