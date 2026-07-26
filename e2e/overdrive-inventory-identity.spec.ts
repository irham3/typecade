import { expect, test, type Page } from "@playwright/test"
import { createRun } from "../lib/engine/overdrive"

function collectIdentityErrors(page: Page) {
	const messages: string[] = []
	page.on("console", (message) => {
		if (message.type() === "error" || message.type() === "warning") {
			messages.push(message.text())
		}
	})
	page.on("pageerror", (error) => messages.push(error.message))
	return messages
}

test("duplicate inventory items keep unique React identity", async ({ page }) => {
	const messages = collectIdentityErrors(page)
	const run = createRun({
		seed: "duplicate-inventory",
		words: ["f", "j", "d"],
		startingKeycaps: ["sprinter", "sprinter"],
		startingMacros: ["insurance", "insurance"],
	})
	run.start()

	await page.addInitScript((save) => {
		window.localStorage.setItem("typecade_overdrive_save", save)
	}, run.exportState())
	await page.goto("/overdrive")
	await page.getByRole("button", { name: "RESUME RUN" }).click()

	const host = page.getByTestId("pixi-gameplay")
	await expect(host.locator("canvas")).toHaveCount(1)
	await expect(page.getByLabel("Sprinter Keycap")).toHaveCount(2)
	await expect(page.getByRole("button", { name: /Use Insurance/ })).toHaveCount(2)

	const firstWord = await host.getAttribute("data-current-word")
	await page.keyboard.type(firstWord ?? "")
	await page.keyboard.press("1")
	const nextWord = await host.getAttribute("data-current-word")
	await page.keyboard.type(nextWord?.[0] === "x" ? "z" : "x")
	await page.keyboard.press("1")

	await expect.poll(() => messages.filter((message) => (
		/same key|Encountered two children|unique key/i.test(message)
	))).toEqual([])
})
