import { expect, test, type Browser, type Page } from "@playwright/test"

async function startPair(browser: Browser, host: Page, configure: (page: Page) => Promise<void>) {
	await host.goto("/")
	await host.getByRole("button", { name: "Multiplayer" }).click()
	await expect(host.getByTestId("race-screen")).toBeVisible()
	await host.locator(".race-config").getByLabel("Your name").fill("Alpha")
	await configure(host)
	await host.getByRole("button", { name: "Create room" }).click()
	await expect(host.getByText("Waiting at the harbor")).toBeVisible()
	const code = new URL(host.url()).searchParams.get("race")
	expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)
	const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
	const guest = await guestContext.newPage()
	await guest.goto(`/?race=${code}`)
	await expect(guest.getByTestId("race-screen")).toBeVisible()
	await guest.locator(".race-join").getByLabel("Your name").fill("Bravo")
	await guest.getByRole("button", { name: "Join room" }).click()
	await expect(guest.getByText("Waiting at the harbor")).toBeVisible()
	await expect(host.locator(".race-waiting")).toContainText("Bravo")
	await host.getByRole("button", { name: "I'm ready" }).click()
	await guest.getByRole("button", { name: "I'm ready" }).click()
	await host.getByRole("button", { name: "Start race" }).click()
	await expect(host.getByTestId("race-play")).toBeVisible({ timeout: 10000 })
	await expect(guest.getByTestId("race-play")).toBeVisible({ timeout: 10000 })
	return { guest, guestContext }
}

async function typePassage(page: Page) {
	const text = await page.getByTestId("race-passage").textContent()
	expect(text).toBeTruthy()
	await page.getByRole("textbox", { name: "Race typing input" }).focus()
	await page.keyboard.type(text!, { delay: 12 })
}

test("two captains race the same Indonesian passage, see results, and rematch", async ({ browser, page }) => {
	test.setTimeout(90000)
	const { guest, guestContext } = await startPair(browser, page, async (host) => {
		await host.getByRole("spinbutton", { name: /^Words/ }).fill("3")
		await host.getByRole("spinbutton", { name: /^Players/ }).fill("2")
	})
	try {
		await expect(guest.getByTestId("race-passage")).toHaveText(await page.getByTestId("race-passage").textContent() ?? "")
		await typePassage(page)
		await expect(page.getByText("Finished. Waiting for the others.")).toBeVisible()
		await typePassage(guest)
		await expect(page.locator(".race-results")).toContainText("Winner: Alpha")
		await expect(guest.locator(".race-results")).toContainText("Winner: Alpha")
		await page.getByRole("button", { name: "Rematch" }).click()
		await expect(page.getByText("Waiting at the harbor")).toBeVisible()
		await expect(guest.getByText("Waiting at the harbor")).toBeVisible()
	} finally { await guestContext.close() }
})

test("Perfect Tide removes a captain after one typo", async ({ browser, page }) => {
	test.setTimeout(90000)
	const { guest, guestContext } = await startPair(browser, page, async (host) => {
		await host.getByLabel("Language").selectOption("en")
		await host.getByLabel("Text format").selectOption("quote")
		await host.getByLabel("Quote difficulty").selectOption("easy")
		await host.getByLabel("Challenge").selectOption("perfect")
		await host.getByRole("spinbutton", { name: /^Players/ }).fill("2")
	})
	try {
		await page.getByRole("textbox", { name: "Race typing input" }).focus()
		await page.keyboard.press("#")
		await expect(page.getByText("You are out. Watch the remaining captains.")).toBeVisible()
		await typePassage(guest)
		await expect(guest.locator(".race-results")).toContainText("Winner: Bravo")
	} finally { await guestContext.close() }
})

test("Three Hulls uses custom shuffled text and ends on the third typo", async ({ browser, page }) => {
	test.setTimeout(90000)
	const { guest, guestContext } = await startPair(browser, page, async (host) => {
		await host.getByLabel("Text format").selectOption("custom")
		await host.getByRole("textbox", { name: "Custom text" }).fill("ombak biru tenang")
		await host.getByLabel("Shuffle words").check()
		await host.getByLabel("Challenge").selectOption("three-hulls")
		await host.getByRole("spinbutton", { name: /^Players/ }).fill("2")
	})
	try {
		await expect(guest.getByTestId("race-passage")).toHaveText(await page.getByTestId("race-passage").textContent() ?? "")
		await page.getByRole("textbox", { name: "Race typing input" }).focus()
		await page.keyboard.type("###", { delay: 20 })
		await expect(page.getByText("You are out. Watch the remaining captains.")).toBeVisible()
		await typePassage(guest)
		await expect(page.locator(".race-results")).toContainText("Winner: Bravo")
	} finally { await guestContext.close() }
})

test("Time mode waits for the shared deadline and ranks validated progress", async ({ browser, page }) => {
	test.setTimeout(90000)
	const { guest, guestContext } = await startPair(browser, page, async (host) => {
		await host.getByLabel("Text format").selectOption("time")
		await host.getByRole("spinbutton", { name: /^Seconds/ }).fill("3")
		await host.getByRole("spinbutton", { name: /^Players/ }).fill("2")
	})
	try {
		const text = await page.getByTestId("race-passage").textContent() ?? ""
		await page.getByRole("textbox", { name: "Race typing input" }).focus()
		await page.keyboard.type(text.slice(0, 12), { delay: 20 })
		await expect(page.locator(".race-results")).toContainText("Winner: Alpha", { timeout: 10000 })
		await expect(guest.locator(".race-results")).toBeVisible()
	} finally { await guestContext.close() }
})
