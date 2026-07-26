import { expect, test, type Page } from "@playwright/test"

async function finishStage(
	page: Page,
	targetScore: number,
	requiresSpace: boolean,
) {
	const host = page.getByTestId("pixi-gameplay")
	let guard = 0
	while (Number(await host.getAttribute("data-score")) < targetScore && guard < 30) {
		const word = await host.getAttribute("data-current-word")
		expect(word).toBeTruthy()
		await page.keyboard.type(`${word}${requiresSpace ? " " : ""}`)
		guard += 1
	}
	expect(guard).toBeLessThan(30)
	await expect(page.getByText("QUOTA SECURED", { exact: true })).toBeVisible()
}

async function enterNextStage(page: Page) {
	await page.getByRole("button", { name: "ENTER SHOP", exact: true }).click()
	await expect(page.getByRole("heading", { name: "SHOP", exact: true })).toBeVisible()
	await page.getByRole("button", { name: /^ENTER / }).click()
	await expect(page.getByTestId("pixi-gameplay")).toBeVisible()
}

test("the stage timer waits for the first printable key", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	const host = page.getByTestId("pixi-gameplay")
	await expect(page.getByRole("heading", { name: "TYPE TO ENGAGE" })).toBeVisible()
	const firstWord = await host.getAttribute("data-current-word")
	const initialTime = Number(await host.getAttribute("data-time-left-ms"))
	expect(firstWord).toBeTruthy()

	await page.waitForTimeout(250)
	expect(Number(await host.getAttribute("data-time-left-ms"))).toBe(initialTime)

	await page.keyboard.type(firstWord?.[0] ?? "a")
	await expect(page.getByRole("heading", { name: "TYPE TO ENGAGE" })).toHaveCount(0)
	await expect.poll(
		async () => Number(await host.getAttribute("data-time-left-ms")),
	).toBeLessThan(initialTime)
})

test("Zone 1 auto-executes a signal without requiring Space", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	const host = page.getByTestId("pixi-gameplay")
	await expect(host.locator("canvas")).toHaveCount(1)
	const firstWord = await host.getAttribute("data-current-word")
	expect(firstWord).toBeTruthy()
	expect(firstWord).toHaveLength(1)

	await page.keyboard.type(firstWord ?? "")

	await expect.poll(async () => Number(await host.getAttribute("data-score"))).toBeGreaterThan(0)
	await expect.poll(async () => host.getAttribute("data-current-word")).not.toBe(firstWord)
	await expect(host).toHaveAttribute("data-caret-index", "0")
})

test("Focus Pause freezes a protected clock and the next key resumes it", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	const host = page.getByTestId("pixi-gameplay")
	const firstWord = await host.getAttribute("data-current-word")
	await page.keyboard.type(firstWord ?? "")

	await expect(host).toHaveAttribute("data-focus-paused", "false")
	await expect.poll(
		async () => host.getAttribute("data-focus-paused"),
		{ timeout: 6_000 },
	).toBe("true")

	const pausedAt = Number(await host.getAttribute("data-time-left-ms"))
	await page.waitForTimeout(500)
	expect(Number(await host.getAttribute("data-time-left-ms"))).toBeGreaterThanOrEqual(pausedAt - 50)

	const nextWord = await host.getAttribute("data-current-word")
	await page.keyboard.type(nextWord ?? "")
	await expect(host).toHaveAttribute("data-focus-paused", "false")
})

test("the protected route escalates from one key to Space-submitted words", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	const host = page.getByTestId("pixi-gameplay")
	const expectedLengths = [1, 2, 3]
	const zoneOneQuotas = [5, 8, 12]

	for (let index = 0; index < expectedLengths.length; index += 1) {
		await expect(host).toHaveAttribute("data-zone", "1")
		const word = await host.getAttribute("data-current-word")
		expect(word).toHaveLength(expectedLengths[index])
		await finishStage(page, zoneOneQuotas[index], false)
		await enterNextStage(page)
	}

	await expect(host).toHaveAttribute("data-zone", "2")
	const shortWord = await host.getAttribute("data-current-word")
	expect(shortWord?.length).toBeGreaterThanOrEqual(3)
	expect(shortWord?.length).toBeLessThanOrEqual(5)

	await page.keyboard.type(shortWord ?? "")
	await expect(host).toHaveAttribute("data-caret-index", String(shortWord?.length ?? 0))
	expect(Number(await host.getAttribute("data-score"))).toBe(0)

	await page.keyboard.press("Space")
	await expect.poll(async () => Number(await host.getAttribute("data-score"))).toBeGreaterThan(0)
	await expect(host).toHaveAttribute("data-caret-index", "0")
})
