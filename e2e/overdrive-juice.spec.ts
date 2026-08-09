import { expect, test, type Page } from "@playwright/test"

async function finishStage(page: Page, requiresSpace: boolean) {
	const host = page.getByTestId("pixi-gameplay")
	let guard = 0
	while (
		Number(await host.getAttribute("data-score"))
		< Number(await host.getAttribute("data-quota"))
		&& guard < 40
	) {
		const word = await host.getAttribute("data-current-word")
		expect(word).toBeTruthy()
		await page.keyboard.type(`${word}${requiresSpace ? " " : ""}`)
		guard += 1
	}
	expect(guard).toBeLessThan(40)
	await expect(page.locator(".overdrive-stage-clear")).toBeVisible()
	await expect(page.getByRole("heading", { name: "SHOP", exact: true }))
		.toBeVisible({ timeout: 3_000 })
}

async function enterNextStage(page: Page) {
	await page.getByRole("button", { name: /^ENTER · NEXT:/ }).click()
	await expect(page.getByTestId("pixi-gameplay")).toBeVisible()
	await expect(page.getByTestId("pixi-gameplay").locator("canvas")).toHaveCount(1)
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

test("articulated rigs load without the pose fallback", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	const host = page.getByTestId("pixi-gameplay")
	await expect(host).toHaveAttribute("data-rig-fallback", "false")
	await expect(host).toHaveAttribute("data-warden-rig", "warden")
	await expect(host).toHaveAttribute("data-enemy-rig", "packet")
	await expect(host.locator("canvas")).toHaveCount(1)
})

test("Zone 1 auto-executes and promotes the next target", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	const host = page.getByTestId("pixi-gameplay")
	const firstWord = await host.getAttribute("data-current-word")
	const firstOrdinal = Number(await host.getAttribute("data-target-ordinal"))
	expect(firstWord).toHaveLength(1)

	await page.keyboard.type(firstWord ?? "")

	await expect.poll(async () => Number(
		await host.getAttribute("data-target-ordinal"),
	)).toBe(firstOrdinal + 1)
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
	expect(Number(await host.getAttribute("data-time-left-ms")))
		.toBeGreaterThanOrEqual(pausedAt - 50)

	const nextWord = await host.getAttribute("data-current-word")
	await page.keyboard.type(nextWord ?? "")
	await expect(host).toHaveAttribute("data-focus-paused", "false")
})

test("the protected route escalates from one key to Space-submitted words", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()

	const host = page.getByTestId("pixi-gameplay")
	for (const expectedLength of [1, 2, 3]) {
		await expect(host).toHaveAttribute("data-zone", "1")
		const word = await host.getAttribute("data-current-word")
		expect(word).toHaveLength(expectedLength)
		await finishStage(page, false)
		await enterNextStage(page)
	}

	await expect(host).toHaveAttribute("data-zone", "2")
	const shortWord = await host.getAttribute("data-current-word")
	expect(shortWord?.length).toBeGreaterThanOrEqual(3)
	expect(shortWord?.length).toBeLessThanOrEqual(5)

	await page.keyboard.type(shortWord ?? "")
	await expect(host).toHaveAttribute(
		"data-caret-index",
		String(shortWord?.length ?? 0),
	)
	expect(Number(await host.getAttribute("data-score"))).toBe(0)

	await page.keyboard.press("Space")
	await expect.poll(
		async () => Number(await host.getAttribute("data-score")),
	).toBeGreaterThan(0)
	await expect(host).toHaveAttribute("data-caret-index", "0")
})
