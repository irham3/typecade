import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { defaultRaceConfig, type RacePlayer, type RaceRoomSnapshot, type RaceTicket } from "@typecade/race-rules"
import { RaceScreen } from "./RaceScreen"

class RoomSocket {
	static latest: RoomSocket | null = null
	static OPEN = 1
	readyState = RoomSocket.OPEN
	onopen: (() => void) | null = null
	onmessage: ((event: MessageEvent<string>) => void) | null = null
	onclose: (() => void) | null = null
	onerror: (() => void) | null = null
	sent: Array<Record<string, unknown>> = []
	constructor() { RoomSocket.latest = this }
	open() { this.onopen?.() }
	send(raw: string) { this.sent.push(JSON.parse(raw) as Record<string, unknown>) }
	close() { if (this.readyState === 3) return; this.readyState = 3; this.onclose?.() }
	deliver(room: RaceRoomSnapshot) { this.onmessage?.({ data: JSON.stringify({ type: "snapshot", room }) } as MessageEvent<string>) }
}

const ticket: RaceTicket = { code: "ABCDEFGH", playerId: "host", token: "test-token" }

function player(id: string, name: string, fields: Partial<RacePlayer> = {}): RacePlayer {
	return { id, name, ready: false, connected: true, status: "waiting", cursor: 0, errors: 0, lives: 0, finishedAt: null, lastSeq: 0, ...fields }
}

function room(phase: RaceRoomSnapshot["phase"], players: RacePlayer[]): RaceRoomSnapshot {
	return { code: ticket.code, hostId: ticket.playerId, phase, config: { ...defaultRaceConfig, wordCount: 3, maxPlayers: 4 }, text: "abc", players, startsAt: phase === "countdown" ? Date.now() + 3000 : null, endsAt: Date.now() + 60000, serverNow: Date.now() }
}

describe("multiplayer race screen browser coverage", () => {
	let host: HTMLDivElement
	let root: Root
	let socket: RoomSocket
	let rootUnmounted = false

	beforeEach(() => {
		;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
		RoomSocket.latest = null
		rootUnmounted = false
		host = document.createElement("div")
		document.body.append(host)
		root = createRoot(host)
		vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(ticket), { status: 201 })))
		vi.stubGlobal("WebSocket", RoomSocket)
	})

	afterEach(async () => {
		if (!rootUnmounted) await act(async () => root.unmount())
		host.remove()
		localStorage.clear()
		sessionStorage.clear()
		history.replaceState(null, "", "/")
		vi.unstubAllGlobals()
	})

	it("creates a room, readies the fleet, types, filters the board, and rematches", async () => {
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		const name = host.querySelector<HTMLInputElement>(".race-config input")!
		await act(async () => { await userEvent.fill(name, "Alpha") })
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".race-config button")!) })
		await act(async () => Promise.resolve())
		socket = RoomSocket.latest!
		await act(() => socket.open?.())
		expect(host.textContent).toContain("Connecting to room ABCDEFGH")
		await act(() => socket.deliver(room("waiting", [player("host", "Alpha")])) )
		expect(host.textContent).toContain("Waiting at the harbor")
		await act(async () => { await userEvent.click([...host.querySelectorAll("button")].find((button) => button.textContent?.includes("I'm ready"))!) })
		expect(socket.sent.at(-1)).toMatchObject({ type: "ready", ready: true })

		const readyRoom = room("waiting", [player("host", "Alpha", { ready: true }), player("guest", "Bravo", { ready: true })])
		await act(() => socket.deliver(readyRoom))
		await act(async () => { await userEvent.click([...host.querySelectorAll("button")].find((button) => button.textContent === "Start race")!) })
		expect(socket.sent.at(-1)).toMatchObject({ type: "start" })
		await act(() => socket.deliver(room("countdown", readyRoom.players)))
		expect(host.textContent).toContain("SET YOUR SAIL")
		await act(() => socket.deliver(room("racing", readyRoom.players.map((entry) => player(entry.id, entry.name, { ...entry, status: "racing" })))))
		expect(host.querySelector('[data-testid="race-play"]')).not.toBeNull()
		const input = host.querySelector<HTMLInputElement>('[aria-label="Race typing input"]')!
		await act(async () => { await userEvent.click(input); await userEvent.keyboard("a") })
		expect(socket.sent.at(-1)).toMatchObject({ type: "type", text: "a", seq: 1 })
		expect(host.querySelector('[data-testid="race-passage"] .correct')?.textContent).toBe("a")

		await act(async () => { await userEvent.click([...host.querySelectorAll("button")].find((button) => button.textContent === "Full leaderboard")!) })
		const search = host.querySelector<HTMLInputElement>('[aria-label="Full leaderboard"] input')!
		await act(async () => { await userEvent.fill(search, "Bravo") })
		expect(host.querySelector('[aria-label="Full leaderboard"]')?.textContent).toContain("Bravo")
		expect(host.querySelector('[aria-label="Full leaderboard"]')?.textContent).not.toContain("Alpha")
		await act(async () => { await userEvent.click([...host.querySelectorAll("button")].find((button) => button.textContent === "Close")!) })

		const donePlayers = readyRoom.players.map((entry) => player(entry.id, entry.name, { ...entry, status: "finished", cursor: 3, finishedAt: Date.now() }))
		await act(() => socket.deliver(room("finished", donePlayers)))
		expect(host.textContent).toContain("Winner: Alpha")
		await act(async () => { await userEvent.click([...host.querySelectorAll("button")].find((button) => button.textContent === "Rematch")!) })
		expect(socket.sent.at(-1)).toMatchObject({ type: "rematch" })
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".race-header button.secondary-action")!) })
		expect(host.textContent).toContain("Create a room")
	})

	it("shows create errors, joins from a shared code, and reports lost connections", async () => {
		vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: "Room unavailable" }), { status: 503 }))
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		const name = host.querySelector<HTMLInputElement>(".race-config input")!
		await act(async () => { await userEvent.fill(name, "Alpha") })
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".race-config button")!) })
		expect(host.querySelector('[role="alert"]')?.textContent).toBe("Room unavailable")
		expect(host.querySelector<HTMLButtonElement>(".race-config button")?.disabled).toBe(false)
		vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 503 }))
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".race-config button")!) })
		expect(host.querySelector('[role="alert"]')?.textContent).toBe("Request failed (503)")
		vi.mocked(fetch).mockRejectedValueOnce("network rejected")
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".race-config button")!) })
		expect(host.querySelector('[role="alert"]')?.textContent).toBe("Could not enter room")

		const joinInputs = host.querySelectorAll<HTMLInputElement>(".race-join input")
		await act(async () => { await userEvent.fill(joinInputs[0]!, "abcdefgh") })
		await act(async () => { await userEvent.fill(joinInputs[1]!, "Bravo") })
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".race-join button")!) })
		await act(async () => Promise.resolve())
		socket = RoomSocket.latest!
		await act(() => socket.open())
		await act(() => socket.deliver(room("waiting", [player("host", "Bravo")])))
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn(async () => undefined) } })
		await act(async () => { await userEvent.click([...host.querySelectorAll("button")].find((button) => button.textContent === "Copy invite link")!) })
		expect(navigator.clipboard.writeText).toHaveBeenCalled()
		await act(() => socket.onmessage?.({ data: JSON.stringify({ type: "error", error: "Room paused" }) } as MessageEvent<string>))
		expect(host.querySelector('[role="alert"]')?.textContent).toBe("Room paused")
		await act(() => socket.close())
		expect(host.querySelector('[role="alert"]')?.textContent).toContain("Connection lost")
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".race-header button.secondary-action")!) })
		expect(host.querySelector(".race-join")).not.toBeNull()
	})

	it("exposes each supported room format and its matching settings", async () => {
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		const selects = () => host.querySelectorAll<HTMLSelectElement>(".race-config select")
		await act(async () => { await userEvent.selectOptions(selects()[0]!, "en") })
		await act(async () => { await userEvent.selectOptions(selects()[1]!, "time") })
		const timeLimit = host.querySelector<HTMLInputElement>('input[list="race-time-presets"]')!
		expect(timeLimit).not.toBeNull()
		await act(async () => { await userEvent.fill(timeLimit, "45") })
		expect(host.querySelector(".race-check")).not.toBeNull()
		const checks = host.querySelectorAll<HTMLInputElement>('.race-config input[type="checkbox"]')
		await act(async () => { await userEvent.click(checks[0]!) })
		await act(async () => { await userEvent.click(checks[1]!) })
		await act(async () => { await userEvent.selectOptions(selects()[1]!, "quote") })
		expect(host.querySelectorAll(".race-config select")).toHaveLength(4)
		await act(async () => { await userEvent.selectOptions(selects()[2]!, "hard") })
		await act(async () => { await userEvent.selectOptions(selects()[1]!, "custom") })
		const passage = host.querySelector<HTMLTextAreaElement>(".race-config textarea")!
		await act(async () => { await userEvent.fill(passage, "one two three") })
		const shuffle = host.querySelector<HTMLInputElement>('.race-config input[type="checkbox"]')!
		await act(async () => { await userEvent.click(shuffle) })
		expect(host.querySelector('[aria-label="Quote difficulty"]')).toBeNull()
		expect(host.querySelector(".race-config textarea")?.value).toBe("one two three")
		await act(async () => { await userEvent.selectOptions(selects()[1]!, "words") })
		expect(host.querySelector('input[list="race-word-presets"]')).not.toBeNull()
		const numeric = host.querySelectorAll<HTMLInputElement>('.race-config input[type="number"]')
		await act(async () => { await userEvent.fill(numeric[0]!, "25") })
		await act(async () => { await userEvent.fill(numeric[1]!, "100") })
		await act(async () => { await userEvent.selectOptions(selects()[2]!, "three-hulls") })
	})

	it("ignores a saved room ticket when a different deep link was requested", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", JSON.stringify(ticket))
		history.replaceState(null, "", "/?race=ZXCVBNMA")
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		expect(host.querySelector(".race-config")).not.toBeNull()
		expect(host.querySelector<HTMLInputElement>(".race-join input")?.value).toBe("ZXCVBNMA")
		expect(RoomSocket.latest).toBeNull()
	})

	it("recovers from a malformed saved room ticket", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", "{")
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		expect(host.querySelector(".race-config")).not.toBeNull()
	})

	it("handles snapshots without the local player and failed invite copying", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", JSON.stringify(ticket))
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		socket = RoomSocket.latest!
		await act(() => socket.open())
		expect(host.textContent).toContain("Connecting to room ABCDEFGH")
		await act(() => socket.deliver(room("waiting", [player("guest", "Bravo")])))
		expect(host.textContent).toContain("Waiting at the harbor")
		await act(() => socket.deliver(room("racing", [player("guest", "Bravo", { status: "racing" })])))
		expect(host.querySelector('[data-testid="race-play"]')).toBeNull()
		await act(() => socket.deliver(room("waiting", [player("guest", "Bravo")])) )
		await act(() => socket.onmessage?.({ data: JSON.stringify({ type: "error" }) } as MessageEvent<string>))
		expect(host.querySelector('[role="alert"]')?.textContent).toBe("Room error")
		const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard")
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn(async () => { throw new Error("clipboard unavailable") }) } })
		try {
			await act(async () => { await userEvent.click([...host.querySelectorAll("button")].find((button) => button.textContent === "Copy invite link")!) })
			expect(host.querySelector('[role="alert"]')?.textContent).toBe("Share room code ABCDEFGH")
		} finally {
			if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor)
			else Reflect.deleteProperty(navigator, "clipboard")
		}
	})

	it("ignores socket callbacks after unmount", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", JSON.stringify(ticket))
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		socket = RoomSocket.latest!
		await act(async () => root.unmount())
		rootUnmounted = true
		await act(async () => {
			socket.open()
			socket.deliver(room("waiting", [player("host", "Alpha")]))
			socket.close()
		})
		expect(socket.readyState).toBe(3)
	})

	it("shows a no-finisher result and opens its leaderboard", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", JSON.stringify(ticket))
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		socket = RoomSocket.latest!
		await act(() => socket.open())
		await act(() => socket.deliver(room("finished", [player("host", "Alpha", { status: "out" }), player("guest", "Bravo", { status: "out" })])))
		expect(host.textContent).toContain("No finisher this round.")
		await act(async () => { await userEvent.click([...host.querySelectorAll("button")].find((button) => button.textContent === "Full leaderboard")!) })
		expect(host.querySelector('[role="dialog"]')?.textContent).toContain("Bravo")
	})

	it("uses safe race clocks and messages finished or disconnected captains", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", JSON.stringify(ticket))
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		socket = RoomSocket.latest!
		await act(() => socket.open())
		const countdown = room("countdown", [player("host", "Alpha")])
		countdown.startsAt = null
		await act(() => socket.deliver(countdown))
		expect(host.querySelector(".race-countdown strong")?.textContent).toBe("1")

		const finished = room("racing", [player("host", "Alpha", { status: "finished" })])
		finished.endsAt = null
		await act(() => socket.deliver(finished))
		const input = host.querySelector<HTMLInputElement>('[aria-label="Race typing input"]')!
		expect(host.textContent).toContain("Finished. Waiting for the others.")
		expect(input.disabled).toBe(true)
		await act(() => socket.close())
		expect(input.placeholder).toBe("Reconnecting…")
	})

	it("describes an English custom room and the full online/offline roster", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", JSON.stringify(ticket))
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		socket = RoomSocket.latest!
		await act(() => socket.open())
		const waiting = room("waiting", [
			player("host", "Alpha", { ready: true }),
			player("guest", "Bravo", { connected: false }),
			player("captain-3", "Charlie", { ready: true }),
		])
		waiting.config = { ...waiting.config, language: "en", format: "custom", customText: "custom", variant: "perfect" }
		waiting.text = "x".repeat(121)
		await act(() => socket.deliver(waiting))
		expect(host.textContent).toContain("English · Custom passage")
		expect(host.textContent).toContain("One typo eliminates you.")
		expect(host.textContent).toContain("Bravo")
		expect(host.textContent).toContain("Charlie")
		expect(host.textContent).toContain("Offline")
		expect(host.querySelector(".race-preview")?.textContent).toContain("…")
		waiting.config = { ...waiting.config, language: "id", format: "quote", difficulty: "hard", variant: "three-hulls" }
		waiting.text = "quote preview"
		await act(() => socket.deliver(waiting))
		expect(host.textContent).toContain("Bahasa Indonesia · hard quote")
		expect(host.textContent).toContain("Third typo eliminates you.")
	})

	it("sends only plain single characters from an active racer in a large fleet", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", JSON.stringify(ticket))
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		socket = RoomSocket.latest!
		await act(() => socket.open())
		const captains = Array.from({ length: 10 }, (_, index) => player(index === 7 ? "host" : `p${index}`, `Captain ${index}`, { status: "racing", cursor: 10 - index }))
		await act(() => socket.deliver(room("racing", captains)))
		const input = host.querySelector<HTMLInputElement>('[aria-label="Race typing input"]')!
		await act(() => {
			input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true }))
			input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }))
		})
		expect(socket.sent).toHaveLength(0)
		await act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true })))
		expect(socket.sent.at(-1)).toMatchObject({ type: "type", text: "a", seq: 1 })
		socket.readyState = 2
		await act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true })))
		expect(socket.sent).toHaveLength(1)
		await act(() => socket.close())
		expect(input.disabled).toBe(true)
		await act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true })))
		expect(socket.sent).toHaveLength(1)
		const out = captains.map((entry) => entry.id === "host" ? { ...entry, status: "out" as const } : entry)
		await act(() => socket.deliver(room("racing", out)))
		expect(input.disabled).toBe(true)
	})

	it("renders a timed challenge and closes a socket after a transport error", async () => {
		sessionStorage.setItem("typecade:ocean-race:ticket", JSON.stringify(ticket))
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		socket = RoomSocket.latest!
		await act(() => socket.open())
		const timed = room("racing", [
			player("host", "Alpha", { status: "racing", lives: 2 }),
			player("guest", "Bravo", { status: "out", connected: false, errors: 3 }),
		])
		timed.config = { ...timed.config, format: "time", variant: "three-hulls" }
		timed.endsAt = 0
		await act(() => socket.deliver(timed))
		expect(host.textContent).toContain("Time 0s")
		expect(host.textContent).toContain("Lives 2")
		const input = host.querySelector<HTMLInputElement>('[aria-label="Race typing input"]')!
		expect(input.disabled).toBe(false)
		const paste = new Event("paste", { bubbles: true, cancelable: true })
		await act(() => input.dispatchEvent(paste))
		expect(paste.defaultPrevented).toBe(true)
		await act(async () => { await userEvent.fill(input, "ignored") })
		await act(() => socket.onerror?.())
		expect(socket.readyState).toBe(3)
		expect(host.textContent).toContain("Reconnecting")
	})

	it("reports invalid room settings before creating a room", async () => {
		await act(async () => root.render(<RaceScreen onBack={vi.fn()} />))
		await act(async () => { await userEvent.fill(host.querySelector<HTMLInputElement>(".race-config input")!, "Alpha") })
		await act(async () => { await userEvent.fill(host.querySelector<HTMLInputElement>('.race-config input[type="number"]')!, "0") })
		const form = host.querySelector<HTMLFormElement>(".race-config")!
		await act(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })))
		expect(host.querySelector('[role="alert"]')?.textContent).toContain("wordCount")
		expect(vi.mocked(fetch)).not.toHaveBeenCalled()
	})
})
