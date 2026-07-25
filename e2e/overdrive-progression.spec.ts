import { expect, test, type Page } from "@playwright/test"
import wordsEN from "../data/words-en.json"
import { createRun } from "../lib/engine/overdrive"

async function clearCurrentStage(page: Page) {
	const host = page.getByTestId("pixi-gameplay")
	const stageClear = page.getByText("QUOTA SECURED")
	for (let attempt = 0; attempt < 120; attempt += 1) {
		if (await stageClear.count()) return
		const word = await host
			.getAttribute("data-current-word", { timeout: 1_000 })
			.catch(() => null)
		if (!word) {
			if (await stageClear.count()) return
			throw new Error("Missing active word before stage clear")
		}
		await page.keyboard.type(`${word} `)
	}
	throw new Error("Stage did not clear within the guard")
}

test("clear, payout, shop, purchase, and pause flow stay connected", async ({ page }) => {
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "PLAY", exact: true }).click()
	await clearCurrentStage(page)

	await expect(page.getByText("QUOTA SECURED")).toBeVisible()
	await expect(page.getByText("TOKEN PAYOUT")).toBeVisible()
	await page.getByRole("button", { name: "ENTER SHOP" }).click()

	await expect(page.getByRole("heading", { name: "SHOP" })).toBeVisible()
	const affordableOffers = page.locator('button[aria-label^="Buy "]:not(:disabled)')
	const affordableCount = await affordableOffers.count()
	expect(affordableCount).toBeGreaterThan(0)
	const buy = affordableOffers.first()
	await expect(buy).toBeEnabled()
	await buy.click()
	await expect(page.getByRole("button", { name: /^Sell /i })).toHaveCount(1)

	await page.getByRole("button", { name: /^ENTER RUSH$/ }).click()
	await page.keyboard.press("Escape")
	await expect(page.getByRole("heading", { name: "PAUSED" })).toBeVisible()
	await page.getByRole("button", { name: "END RUN" }).click()
	await expect(page.getByRole("button", { name: "PLAY", exact: true })).toBeVisible()
})

test("run over exports the 1200x630 score card", async ({ page }) => {
	const run = createRun({ seed: "share-card-test", words: wordsEN })
	run.start()
	run.advance(59_500)
	await page.addInitScript((save) => {
		window.localStorage.setItem("typecade_overdrive_save", save)
	}, run.exportState())
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "RESUME RUN" }).click()

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
