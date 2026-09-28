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

	beforeEach(() => {
		;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
		host = document.createElement("div")
		document.body.append(host)
		root = createRoot(host)
		vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(ticket), { status: 201 })))
		vi.stubGlobal("WebSocket", RoomSocket)
	})

	afterEach(async () => {
		await act(async () => root.unmount())
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
})
