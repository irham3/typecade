import { expect, test, type Browser, type Page } from "@playwright/test"

test("a live 100-player room renders the fleet, searches standings, and finishes together", async ({ page }) => {
	test.setTimeout(120000)
	await page.goto("/")
	await page.getByRole("button", { name: "Multiplayer", exact: true }).click()
	await page.locator(".race-config").getByLabel("Your name").fill("Fleet Host")
	await page.getByLabel("Text format", { exact: true }).selectOption("time")
	await page.getByRole("spinbutton", { name: /^Seconds/ }).fill("1")
	await page.getByRole("spinbutton", { name: /^Players/ }).fill("100")
	await page.getByRole("button", { name: "Create room" }).click()
	await expect(page.getByText("Waiting at the harbor")).toBeVisible()
	const code = new URL(page.url()).searchParams.get("race")!
	const tickets: Array<{ code: string; playerId: string; token: string }> = []
	for (let first = 1; first < 100; first += 10) {
		const batch = await Promise.all(Array.from({ length: Math.min(10, 100 - first) }, async (_, offset) => {
			const response = await page.request.post(`/api/rooms/${code}/join`, { data: { name: `Captain ${first + offset}` } })
			expect(response.ok()).toBe(true)
			return response.json()
		}))
		tickets.push(...batch)
	}
	const overflow = await page.request.post(`/api/rooms/${code}/join`, { data: { name: "Captain 101" } })
	expect(overflow.ok()).toBe(false)
	const fleet: WebSocket[] = []
	const socketOrigin = new URL(page.url()).origin.replace(/^http/, "ws")
	try {
		// Peers use real platform sockets; the browser owns only its captain's connection.
		for (let first = 0; first < tickets.length; first += 10) await Promise.all(tickets.slice(first, first + 10).map((member) => new Promise<void>((resolve, reject) => {
			const socket = new WebSocket(`${socketOrigin}/api/rooms/${member.code}/ws?playerId=${member.playerId}`, ["race-v1", `token.${member.token}`])
			fleet.push(socket)
			socket.onopen = () => { socket.send(JSON.stringify({ type: "ready", ready: true })); resolve() }
			socket.onerror = () => reject(new Error(`Fleet connection failed: ${member.playerId}`))
		})))
		await expect(page.locator(".race-waiting-grid li")).toHaveCount(100)
		await page.getByRole("button", { name: "I'm ready" }).click()
		await expect(page.getByRole("button", { name: "Start race" })).toBeEnabled()
		await page.getByRole("button", { name: "Start race" }).click()
		await expect(page.getByTestId("race-play")).toBeVisible({ timeout: 10000 })
		const text = await page.getByTestId("race-passage").textContent()
		await page.getByLabel("Race typing input").pressSequentially(text!.slice(0, 5))
		await expect(page.locator(".race-results")).toContainText("Winner: Fleet Host", { timeout: 10000 })
		await page.getByRole("button", { name: "Full leaderboard", exact: true }).click()
		await expect(page.getByRole("dialog").locator("li")).toHaveCount(100)
		await page.getByLabel("Find captain").fill("Captain 99")
		await expect(page.getByRole("dialog").locator("li")).toHaveCount(1)
		await page.keyboard.press("Escape")
		await expect(page.getByRole("dialog")).toHaveCount(0)
	} finally {
		await Promise.all(fleet.map(socket => new Promise<void>(resolve => {
			if (socket.readyState === WebSocket.CLOSED) { resolve(); return }
			socket.addEventListener("close", () => resolve(), { once: true })
			if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "leave" }))
			else socket.close()
		})))
	}
})

test("leaving a lobby releases its slot and transfers the host immediately", async ({ page, browser }) => {
	await page.goto("/")
	await page.getByRole("button", { name: "Multiplayer", exact: true }).click()
	await page.locator(".race-config").getByLabel("Your name").fill("Leaving Host")
	await page.getByRole("spinbutton", { name: /^Players/ }).fill("2")
	await page.getByRole("button", { name: "Create room" }).click()
	await expect(page.getByText("Waiting at the harbor")).toBeVisible()
	const code = new URL(page.url()).searchParams.get("race")!
	const guestContext = await browser.newContext()
	const guest = await guestContext.newPage()
	try {
		await guest.goto(`/?race=${code}`)
		await guest.locator(".race-join").getByLabel("Your name").fill("Remaining Captain")
		await guest.getByRole("button", { name: "Join room" }).click()
		await expect(guest.locator(".race-waiting-grid li")).toHaveCount(2)
		await page.getByRole("button", { name: "Main menu", exact: true }).click()
		await expect(page.getByTestId("main-menu")).toBeVisible()
		await expect(guest.locator(".race-waiting-grid li")).toHaveCount(1)
		await expect(guest.getByRole("button", { name: "Start race" })).toBeVisible()
		const replacement = await page.request.post(`/api/rooms/${code}/join`, { data: { name: "New Captain" } })
		expect(replacement.ok()).toBe(true)
		await expect(guest.locator(".race-waiting-grid li")).toHaveCount(2)
	} finally { await guestContext.close() }
})

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

test("two captains race the same Indonesian passage, see results, and rematch", async ({ browser, page }, testInfo) => {
	test.setTimeout(90000)
	const { guest, guestContext } = await startPair(browser, page, async (host) => {
		await host.getByRole("spinbutton", { name: /^Words/ }).fill("3")
		await host.getByRole("spinbutton", { name: /^Players/ }).fill("2")
	})
	try {
		await expect(guest.getByTestId("race-passage")).toHaveText(await page.getByTestId("race-passage").textContent() ?? "")
		for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 640 }]) {
			await guest.setViewportSize(viewport)
			await guest.getByLabel("Race typing input").focus()
			await guest.screenshot({ path: testInfo.outputPath(`race-mobile-${viewport.width}.png`) })
			await expect(guest.locator(".race-stage")).toBeInViewport({ ratio: 1 })
			await expect(guest.getByLabel("Race typing input")).toBeInViewport({ ratio: 1 })
		}
		await typePassage(page)
		await expect(page.getByText("Finished. Waiting for the others.")).toBeVisible()
		await typePassage(guest)
		await expect(page.locator(".race-results")).toContainText("Winner: Alpha")
		await expect(guest.locator(".race-results")).toContainText("Winner: Alpha")
		await page.getByRole("button", { name: "Rematch" }).click()
		await expect(page.getByText("Waiting at the harbor")).toBeVisible()
		await expect(guest.getByText("Waiting at the harbor")).toBeVisible()
		await page.getByRole("button", { name: "I'm ready" }).click()
		await guest.getByRole("button", { name: "I'm ready" }).click()
		await expect(page.getByRole("button", { name: "Start race" })).toBeEnabled()
		await page.getByRole("button", { name: "Start race" }).click()
		await expect(page.getByTestId("race-play")).toBeVisible({ timeout: 10000 })
		await expect(guest.getByTestId("race-play")).toBeVisible({ timeout: 10000 })
		await typePassage(guest)
		await typePassage(page)
		await expect(page.locator(".race-results")).toContainText("Winner: Bravo")
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

for (const variant of ["perfect", "three-hulls"] as const) {
	test(`timed ${variant} excludes an eliminated leader from winning`, async ({ browser, page }) => {
		const { guest, guestContext } = await startPair(browser, page, async (host) => {
			await host.getByLabel("Text format").selectOption("time")
			await host.getByRole("spinbutton", { name: /^Seconds/ }).fill("4")
			await host.getByLabel("Challenge").selectOption(variant)
			await host.getByRole("spinbutton", { name: /^Players/ }).fill("2")
		})
		try {
			const text = await page.getByTestId("race-passage").textContent() ?? ""
			await page.getByLabel("Race typing input").pressSequentially(text.slice(0, 12))
			await page.getByLabel("Race typing input").pressSequentially(variant === "perfect" ? "#" : "###")
			await expect(page.getByText("You are out. Watch the remaining captains.")).toBeVisible()
			await guest.getByLabel("Race typing input").pressSequentially(text.slice(0, 3))
			await expect(page.locator(".race-results")).toContainText("Winner: Bravo", { timeout: 10000 })
			await expect(guest.locator(".race-results")).toContainText("Winner: Bravo")
		} finally { await guestContext.close() }
	})
}

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
