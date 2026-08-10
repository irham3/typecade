import { expect, test, type Page } from "@playwright/test"
import wordsEN from "../data/words-en.json"
import { createRun } from "../lib/engine/overdrive"

function clearEngineStage(run: ReturnType<typeof createRun>) {
	for (let guard = 0; guard < 200; guard += 1) {
		const state = run.snapshot()
		if (state.screen !== "stage") break
		for (const character of state.currentWord) run.feedChar(character)
		if (state.zone > 1) run.feedChar(" ")
	}
	if (run.snapshot().screen !== "stageResult") {
		throw new Error("Engine stage did not clear")
	}
	run.continueToNextStage()
	if (run.snapshot().screen === "shop") run.leaveShop()
}

async function clearCurrentStage(page: Page) {
	const host = page.getByTestId("pixi-gameplay")
	for (let attempt = 0; attempt < 120; attempt += 1) {
		if (await page.locator(".overdrive-stage-clear").count()) return
		const word = await host
			.getAttribute("data-current-word", { timeout: 1_000 })
			.catch(() => null)
		if (!word) {
			if (await page.locator(".overdrive-stage-clear").count()) return
			throw new Error("Missing active word before stage clear")
		}
		const zone = Number(await host.getAttribute("data-zone"))
		await page.keyboard.type(`${word}${zone > 1 ? " " : ""}`)
	}
	throw new Error("Stage did not clear within the guard")
}

test("clear, payout, shop, purchase, and pause flow stay connected", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()
	await clearCurrentStage(page)

	await expect(page.locator(".overdrive-stage-clear")).toBeVisible()
	await expect(page.getByRole("heading", { name: "SHOP" }))
		.toBeVisible({ timeout: 3_000 })
	const affordableOffers = page.locator('button[aria-label^="Buy "]:not(:disabled)')
	const affordableCount = await affordableOffers.count()
	expect(affordableCount).toBeGreaterThan(0)
	const buy = affordableOffers.first()
	await expect(buy).toBeEnabled()
	await buy.click()
	await expect(page.getByRole("button", { name: /^Sell /i })).toHaveCount(1)

	await page.getByRole("button", { name: /^ENTER · NEXT:/ }).click()
	await expect(page.getByTestId("pixi-gameplay")).toBeVisible()
	await page.keyboard.press("Escape")
	await expect(page.getByRole("heading", { name: "PAUSED" })).toBeVisible()
	await page.getByRole("button", { name: "END RUN" }).click()
	await expect(page.getByRole("button", { name: "PLAY", exact: true })).toBeVisible()
})

test("run over exports the 1200x630 score card", async ({ page }) => {
	const run = createRun({ seed: "share-card-test", words: wordsEN })
	run.start()
	for (let stage = 0; stage < 6; stage += 1) clearEngineStage(run)
	expect(run.snapshot().zone).toBe(3)
	run.advance(run.snapshot().timeLeftMs - 500)
	await page.addInitScript((save) => {
		window.localStorage.setItem("typecade_overdrive_save", save)
	}, run.exportState())
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "RESUME RUN" }).click()
	const host = page.getByTestId("pixi-gameplay")
	const word = await host.getAttribute("data-current-word")
	await page.keyboard.type(word?.[0] ?? "a")

	await expect(page.getByText("RUN OVER", { exact: true })).toBeVisible({ timeout: 3_000 })
	const downloadPromise = page.waitForEvent("download")
	await page.getByRole("button", { name: "SHARE SCORE" }).click()
	const download = await downloadPromise

	expect(download.suggestedFilename()).toMatch(/^typecade-overdrive-\d+\.png$/)
	await expect(page.getByRole("button", { name: "SHARE CARD READY" })).toBeVisible()
	const stream = await download.createReadStream()
	const chunks: Buffer[] = []
	for await (const chunk of stream) chunks.push(Buffer.from(chunk))
	const png = Buffer.concat(chunks)
	expect(png.readUInt32BE(16)).toBe(1_200)
	expect(png.readUInt32BE(20)).toBe(630)
})
