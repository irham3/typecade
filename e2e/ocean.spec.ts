import { expect, test } from "@playwright/test"

test.describe("Ocean Typing RPG shell", () => {
	for (const viewport of [
		{ name: "desktop", width: 1366, height: 768 },
		{ name: "mobile", width: 390, height: 844 },
		{ name: "small mobile", width: 320, height: 640 },
	]) {
		test(`opens every main-menu destination on ${viewport.name}`, async ({ page }) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height })
			await page.goto("/")
			await expect(page.locator(".mainmenu-button > img").nth(0)).toHaveAttribute("src", /\/assets\/ocean\/mainmenu\/button_gold_empty\.png$/)
			await expect(page.locator(".mainmenu-button img").nth(2)).toHaveAttribute("src", /\/assets\/ocean\/mainmenu\/button_blue_empty\.png$/)
			await page.getByRole("button", { name: "Multiplayer", exact: true }).click()
			await expect(page.getByTestId("race-screen")).toBeVisible()
			await page.getByRole("button", { name: "Main menu" }).click()
			await expect(page.getByTestId("main-menu")).toBeVisible()
			for (const label of ["Collection", "Settings"]) {
				await page.getByRole("button", { name: label, exact: true }).click()
				await expect(page.getByTestId("overlay-panel")).toBeVisible()
				await expect(page.getByTestId("overlay-panel")).toContainText(label)
				await page.getByRole("button", { name: "Close" }).click()
				await expect(page.getByTestId("overlay-panel")).toHaveCount(0)
			}
			await page.getByRole("button", { name: "Practice", exact: true }).click()
			await expect(page.getByTestId("practice-screen")).toBeVisible()
			await expect(page.getByRole("button", { name: "Start practice" })).toBeVisible()
			await page.getByRole("button", { name: "Main menu" }).click()
			await expect(page.getByTestId("main-menu")).toBeVisible()
			await page.getByRole("button", { name: "Adventure", exact: true }).click()
			await expect(page.getByTestId("prep-screen")).toBeVisible()
			await page.getByRole("button", { name: "Back" }).click()
			await expect(page.getByTestId("main-menu")).toBeVisible()
		})
	}

	for (const destination of ["Practice", "Multiplayer"]) {
		test(`Set Sail works after returning from ${destination}`, async ({ page }, testInfo) => {
			const errors: string[] = []
			page.on("pageerror", (error) => errors.push(error.message))
			page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()) })
			await page.goto("/")
			await expectCanvasNonBlank(page)
			await page.getByRole("button", { name: destination, exact: true }).click()
			await expect(page.getByTestId(destination === "Practice" ? "practice-screen" : "race-screen")).toBeVisible()
			await expect(page.getByTestId("phaser-gameplay").locator("canvas")).toHaveCount(0)
			await page.getByRole("button", { name: "Main menu", exact: true }).click()
			await page.getByRole("button", { name: "Adventure", exact: true }).click()
			await page.getByRole("button", { name: "Set Sail", exact: true }).click()
			await expect(page.getByTestId("ocean-hud")).toBeVisible()
			await expect(page.getByTestId("prep-screen")).toHaveCount(0)
			await expectCanvasNonBlank(page)
			const target = await page.getByTestId("typing-target").textContent()
			await page.getByLabel("Adventure typing input").pressSequentially(target!.slice(0, 3))
			await expect(page.getByTestId("typing-target").locator(".done")).toHaveCount(3)
			expect(errors).toEqual([])
			await page.screenshot({ path: testInfo.outputPath("adventure-after-return.png") })
		})
	}

	test("configures an English custom Perfect Tide practice and completes it", async ({ page }) => {
		await page.goto("/")
		await page.getByRole("button", { name: "Practice", exact: true }).click()
		await page.getByLabel("Practice language").selectOption("en")
		await page.getByLabel("Practice text format").selectOption("custom")
		await page.getByLabel("Custom passage").fill("tide")
		await page.getByLabel("Practice challenge").selectOption("perfect")
		await page.getByRole("button", { name: "Start practice" }).click()
		await expect(page.getByTestId("practice-racing")).toContainText("English · custom · perfect")
		await page.keyboard.type("tide")
		await expect(page.getByTestId("practice-result")).toContainText("SESSION COMPLETE")
		await expect(page.getByTestId("practice-result")).toContainText("Good run")
		await page.getByRole("button", { name: "Practice again" }).click()
		await expect(page.getByTestId("practice-racing")).toBeVisible()
		await page.getByRole("button", { name: "Main menu" }).click()
		await expect(page.getByTestId("main-menu")).toBeVisible()
	})

	test("opens HUD panels, changes settings, and pauses without losing the encounter", async ({ page }) => {
		await page.goto("/")
		await page.getByRole("button", { name: "Adventure", exact: true }).click()
		const selectedSkillIndex = await page.locator(".prep-skill").evaluateAll((buttons) => buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true"))
		const selectedSkill = page.locator(".prep-skill").nth(selectedSkillIndex)
		await selectedSkill.click()
		await expect(selectedSkill).toHaveAttribute("aria-pressed", "false")
		await selectedSkill.click()
		await expect(selectedSkill).toHaveAttribute("aria-pressed", "true")
		await page.getByRole("button", { name: "Set Sail" }).click()
		await expectHudDoesNotOverlap(page)
		const target = await page.getByTestId("typing-target").textContent()
		for (const [button, title] of [
			["Fish", "Pebble Goby"],
			["Collection", "Collection"],
			["Route", "Route"],
			["Skills", "Skills"],
		] as const) {
			await page.getByRole("button", { name: button, exact: true }).click()
			await expect(page.getByTestId("overlay-panel")).toContainText(title)
			await page.getByRole("button", { name: "Close" }).click()
		}
		await page.getByRole("button", { name: "Settings" }).click()
		await expect(page.getByTestId("overlay-panel")).toContainText("Settings")
		for (const channel of ["music", "environment", "gameplay", "typing"]) {
			await page.getByRole("slider", { name: channel, exact: true }).fill("0.2")
			await expect(page.getByRole("slider", { name: channel, exact: true })).toHaveValue("0.2")
		}
		await page.getByLabel("Reduced effects").check()
		await expect(page.getByLabel("Reduced effects")).toBeChecked()
		await page.getByRole("button", { name: "Close" }).click()
		await page.getByRole("button", { name: "Settings" }).click()
		await expect(page.getByRole("slider", { name: "music", exact: true })).toHaveValue("0.2")
		await expect(page.getByLabel("Reduced effects")).toBeChecked()
		await page.getByRole("button", { name: "Close" }).click()
		await page.getByRole("button", { name: "Pause game" }).click()
		await expect(page.getByTestId("pause-panel")).toBeVisible()
		await page.getByRole("button", { name: "Resume fishing" }).click()
		await expect(page.getByTestId("pause-panel")).toHaveCount(0)
		await page.keyboard.press("Escape")
		await expect(page.getByTestId("pause-panel")).toBeVisible()
		await page.keyboard.press("Escape")
		await expect(page.getByTestId("pause-panel")).toHaveCount(0)
		await expect(page.getByTestId("typing-target")).toHaveText(target ?? "")
	})

	test("keeps mobile HUD navigation clickable", async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 })
		await page.goto("/")
		await page.getByRole("button", { name: "Adventure", exact: true }).click()
		await page.getByRole("button", { name: "Set Sail" }).click()
		await expectHudDoesNotOverlap(page)
		for (const label of ["Fish", "Collection", "Route", "Skills", "Settings"]) {
			await page.getByRole("button", { name: label, exact: true }).click()
			await expect(page.getByTestId("overlay-panel")).toBeVisible()
			await page.getByRole("button", { name: "Close" }).click()
		}
	})

	for (const viewport of [
		{ name: "desktop", width: 1366, height: 768 },
		{ name: "compact desktop", width: 1024, height: 768 },
		{ name: "mobile", width: 390, height: 844 },
		{ name: "small mobile", width: 320, height: 640 },
	]) {
		test(`renders a nonblank Phaser scene without HUD overlap on ${viewport.name}`, async ({ page }, testInfo) => {
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
			await expect(page.locator(".menu-layer .logo-mark")).toHaveCount(0)
			await expect(page.locator(".mainmenu-dock")).toBeVisible()
			await expect(page.locator(".mainmenu-ship")).toBeVisible()
			await expect(page.getByRole("img", { name: "Typecade" })).toBeVisible()
			await expect(page.getByTestId("main-menu")).toHaveCSS("background-image", /background-mainmenu\.png/)
			for (const label of ["Practice", "Adventure", "Multiplayer", "Collection", "Settings"]) {
				await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible()
			}
			await page.keyboard.press("Tab")
			await expect(page.getByRole("button", { name: "Practice", exact: true })).toBeFocused()
			await page.getByRole("button", { name: "Adventure", exact: true }).click()
			await expect(page.getByTestId("prep-screen")).toBeVisible()
			await page.getByTestId("prep-screen").getByRole("button", { name: /Reef Shelf/ }).click()
			await page.getByRole("button", { name: "Set Sail" }).click()
			await expect(page.getByTestId("typing-console")).toBeVisible()
			await expect(page.getByTestId("route-strip")).toContainText("Reef Shelf")
			const target = (await page.getByTestId("typing-target").textContent())?.replace(/\u00a0/g, " ") ?? ""
			const prefixEnd = target.split(" ").slice(0, 3).join(" ").length + 1
			await page.getByLabel("Adventure typing input").focus()
			await page.keyboard.type(target.slice(0, prefixEnd), { delay: 2 })
			await page.getByRole("button", { name: "Route" }).click()
			await expect(page.getByRole("button", { name: /Lagoon Gate/ })).toBeDisabled()
			await page.getByRole("button", { name: "Close" }).click()
			const activeSkill = page.locator("[data-testid='skill-dock'] .skill-button.active:enabled").filter({ hasText: "Sonar" }).first()
			await expect(activeSkill).toBeEnabled()
			await activeSkill.click()
			await expect(page.getByTestId("skill-feedback")).toBeVisible()

			await expectCanvasNonBlank(page)
			await expectHudDoesNotOverlap(page)
			await page.screenshot({ path: testInfo.outputPath("active-gameplay.png") })

			// Cast Net can legitimately finish a small fish once the typing gate is
			// met; other skills still require the rest of the passage.
			await page.waitForTimeout(100)
			if (await page.getByTestId("result-toast").count() === 0) {
				await page.getByLabel("Adventure typing input").focus()
				await page.keyboard.type(target.slice(prefixEnd), { delay: 2 })
			}
			await expect(page.getByTestId("result-toast")).toBeVisible()
			await page.waitForTimeout(250)
			await expectCanvasNonBlank(page)
			expect(consoleErrors).toEqual([])
		})
	}

	test("completes the full Shallow Coast run including the Leviathan", async ({ page }) => {
		test.setTimeout(120000)
		await page.goto("/")
		await page.getByRole("button", { name: "Adventure", exact: true }).click()
		await page.getByRole("button", { name: "Set Sail" }).click()
		for (let encounter = 1; encounter <= 10; encounter += 1) {
			await expect(page.getByTestId("route-strip")).toContainText(`Encounter ${encounter}/10`)
			if (encounter === 10) {
				await expect(page.getByTestId("boss-phase-callout")).toContainText("Crown Wake")
			}
			const target = (await page.getByTestId("typing-target").textContent())?.replace(/\u00a0/g, " ") ?? ""
			await page.keyboard.type(target, { delay: encounter === 10 ? 12 : 1 })
			await expect(page.getByTestId("result-toast"), `Encounter ${encounter}: ${target}`).toContainText("Catch secured")
			if (encounter < 10) {
				await expect(page.getByTestId("route-strip")).toContainText(`Encounter ${encounter + 1}/10`, { timeout: 5000 })
			}
		}
		await expect(page.getByTestId("boss-phase-callout")).toHaveCount(0)
		await expect(page.getByTestId("complete-panel")).toContainText("Shallow Coast cleared")
		await expectHudDoesNotOverlap(page)
		await page.getByRole("button", { name: "Sail Again" }).click()
		await expect(page.getByTestId("route-strip")).toContainText("Encounter 1/10")
		await page.getByRole("button", { name: "Pause game" }).click()
		await page.getByRole("button", { name: "Main menu" }).click()
		await expect(page.getByTestId("main-menu")).toBeVisible()
	})
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
	await expect.poll(() => page.evaluate(() => {
		const selectors = [
			"[data-testid='topbar']",
			".icon-rail",
			"[data-testid='route-strip']",
			"[data-testid='fish-card']",
			"[data-testid='typing-console']",
			"[data-testid='skill-dock']",
			"[data-testid='boss-phase-callout']",
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
	}), { timeout: 3000 }).toEqual([])
	const offscreenSkills = await page.locator("[data-testid='skill-dock'] .skill-button").evaluateAll((buttons) => buttons
		.filter((button) => {
			const rect = button.getBoundingClientRect()
			return rect.left < 0 || rect.right > innerWidth || rect.top < 0 || rect.bottom > innerHeight
		})
		.map((button) => button.textContent?.trim()))
	expect(offscreenSkills).toEqual([])
}
