import { describe, expect, it, vi } from "vitest"
import { defaultRaceConfig, type RacePlayer } from "@typecade/race-rules"
import worker, { RaceRoom } from "./index"

function stateMock() {
	const values = new Map<string, unknown>()
	const sockets: FakeSocket[] = []
	const alarms: number[] = []
	const storage = {
		get: vi.fn(async <T>(key: string) => values.get(key) as T | undefined),
		put: vi.fn(async (key: string, value: unknown) => { values.set(key, structuredClone(value)) }),
		setAlarm: vi.fn(async (when: number) => { alarms.push(when) }),
	}
	const ctx = {
		storage,
		getWebSockets: () => sockets,
		acceptWebSocket: (socket: FakeSocket) => { sockets.push(socket) },
	}
	return { ctx, storage, values, sockets, alarms }
}

class FakeSocket {
	attachment: unknown = null
	readonly sent: string[] = []
	closed = false
	serializeAttachment(value: unknown) { this.attachment = value }
	deserializeAttachment() { return this.attachment }
	send(value: string) { this.sent.push(value) }
	close() { this.closed = true }
}

const request = (path: string, body?: unknown, method = "POST") => new Request(`https://room.test${path}`, {
	method,
	headers: { "content-type": "application/json" },
	...(body === undefined ? {} : { body: JSON.stringify(body), duplex: "half" }),
} as RequestInit & { duplex?: "half" })

describe("multiplayer Worker", () => {
	it("routes health, room actions, errors, and static assets", async () => {
		const NativeRequest = Request
		class WorkerRequest extends NativeRequest {
			constructor(input: RequestInfo | URL, init?: RequestInit) {
				const compatibleInit = init?.body
					? { ...init, ...(init instanceof NativeRequest ? { method: init.method, headers: init.headers } : {}), duplex: "half" as const }
					: init
				super(input, compatibleInit as RequestInit & { duplex?: "half" })
			}
		}
		vi.stubGlobal("Request", WorkerRequest)
		try {
		const roomFetch = vi.fn(async (request: Request) => new Response(
			new URL(request.url).pathname === "/create" ? JSON.stringify({ code: "ABCDEFGH" }) : "room",
			{ status: 201 },
		))
		const assets = { fetch: vi.fn(async () => new Response("asset")) }
		const env = {
			ROOMS: { idFromName: (code: string) => code, get: () => ({ fetch: roomFetch }) },
			ASSETS: assets,
		} as never
		const health = await worker.fetch(new Request("https://app.test/api/health"), env)
		expect(await health.json()).toEqual({ ok: true })
		expect((await worker.fetch(new Request("https://app.test/api/missing"), env)).status).toBe(404)
		expect((await worker.fetch(new Request("https://app.test/api/rooms/ABCDEFGH"), env)).status).toBe(405)
		expect((await worker.fetch(request("/api/rooms/ABCDEFGH/join", {}), env)).status).toBe(201)
		const invalidJson = await worker.fetch(new Request("https://app.test/api/rooms", { method: "POST", body: "{" }), env)
		expect(invalidJson.status).toBe(400)
		expect(await invalidJson.json()).toMatchObject({ error: expect.any(String) })
		expect((await worker.fetch(request("/api/rooms", []), env)).status).toBe(400)
		const oversized = await worker.fetch(new Request("https://app.test/api/rooms", { method: "POST", body: "x".repeat(10001) }), env)
		expect(oversized.status).toBe(400)
		const invalidName = await worker.fetch(request("/api/rooms", { config: defaultRaceConfig, name: "x" }), env)
		expect(invalidName.status).toBe(400)
		expect((await worker.fetch(request("/api/rooms", { config: defaultRaceConfig, name: null }), env)).status).toBe(400)

		const created = await worker.fetch(request("/api/rooms", { config: defaultRaceConfig, name: " Host " }), env)
		const ticket = await created.json() as { code: string }
		expect(created.status).toBe(201)
		expect(ticket.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)
		await worker.fetch(request(`/api/rooms/${ticket.code}/join`, { name: "Guest" }), env)
		const ws = await worker.fetch(new Request(`https://app.test/api/rooms/${ticket.code}/ws`, { headers: { upgrade: "websocket" } }), env)
		expect(ws.status).toBe(201)
		expect(roomFetch).toHaveBeenCalledTimes(4)
		const asset = await worker.fetch(new Request("https://app.test/index.html"), env)
		expect(await asset.text()).toBe("asset")
		const failingEnv = { ROOMS: { idFromName: () => { throw "no room namespace" } }, ASSETS: assets } as never
		expect(await (await worker.fetch(request("/api/rooms", { config: defaultRaceConfig, name: "Host" }), failingEnv)).json()).toEqual({ error: "Could not create room" })
		} finally {
			vi.unstubAllGlobals()
		}
	})

	it("rejects invalid room payloads, duplicate names, full rooms, and forged tickets", async () => {
		vi.useFakeTimers()
		vi.setSystemTime(2_000_000)
		try {
			const state = stateMock()
			const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
			expect((await room.fetch(request("/join", { name: "Guest" }))).status).toBe(404)
			expect((await room.fetch(new Request("https://room.test/create", { method: "POST", body: "{" }))).status).toBe(400)
			expect((await room.fetch(new Request("https://room.test/create", { method: "POST", body: "x".repeat(10001) }))).status).toBe(400)
			const config = { ...defaultRaceConfig, maxPlayers: 2 }
			expect((await room.fetch(request("/create", { code: "ABCDEFGH", config: { ...config, wordCount: 0 }, name: "Host" }))).status).toBe(400)
			const created = await room.fetch(request("/create", { code: "ABCDEFGH", config, name: " Host " }))
			const hostTicket = await created.json() as { playerId: string }
			expect((await room.fetch(request("/join", { name: "hOsT" }))).status).toBe(409)
			const joined = await room.fetch(request("/join", { name: "Guest" }))
			const guestTicket = await joined.json() as { playerId: string }
			expect(joined.status).toBe(201)
			expect((await room.fetch(request("/join", { name: "Another" }))).status).toBe(409)
			const internal = (room as unknown as { room: { phase: string; members: Record<string, { lastSeenAt: number }> } }).room
			vi.advanceTimersByTime(120001)
			internal.members[hostTicket.playerId]!.lastSeenAt = Date.now() - 120001
			internal.members[guestTicket.playerId]!.lastSeenAt = Date.now()
			const replacement = await room.fetch(request("/join", { name: "Another" }))
			const replacementTicket = await replacement.json() as { playerId: string }
			expect(replacement.status).toBe(201)
			const stored = state.values.get("room") as { hostId: string; members: Record<string, unknown> }
			expect(stored.hostId).toBe(replacementTicket.playerId)
			expect(Object.keys(stored.members)).toEqual([guestTicket.playerId, replacementTicket.playerId])
			const forged = await room.fetch(new Request(`https://room.test/ws?playerId=${hostTicket.playerId}`, { headers: { upgrade: "websocket", "sec-websocket-protocol": "race-v1, token.wrong" } }))
			expect(forged.status).toBe(401)
			expect((await room.fetch(request("/join", { name: "Another" }))).status).toBe(409)
			internal.phase = "racing"
			expect((await room.fetch(request("/join", { name: "New" }))).status).toBe(409)
		} finally { vi.useRealTimers() }
	})

	it("authenticates WebSocket tickets and replaces a player's old socket", async () => {
		const NativeResponse = Response
		class WorkerResponse extends NativeResponse {
			private readonly workerStatus: number
			readonly webSocket: WebSocket | null
			constructor(body: BodyInit | null, init: ResponseInit & { webSocket?: WebSocket | null } = {}) {
				super(body, { ...init, status: init.status === 101 ? 200 : init.status })
				this.workerStatus = init.status ?? 200
				this.webSocket = init.webSocket ?? null
			}
			override get status() { return this.workerStatus }
		}
		vi.stubGlobal("Response", WorkerResponse)
		const pair = { 0: new FakeSocket(), 1: new FakeSocket() }
		vi.stubGlobal("WebSocketPair", class { 0 = pair[0]; 1 = pair[1] })
		try {
			const state = stateMock()
			const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
			const created = await room.fetch(request("/create", { code: "ABCDEFGH", config: defaultRaceConfig, name: "Host" }))
			const ticket = await created.json() as { playerId: string; token: string }
			const previous = new FakeSocket()
			previous.serializeAttachment({ playerId: ticket.playerId })
			const unrelated = new FakeSocket()
			unrelated.serializeAttachment({ playerId: "another-player" })
			state.sockets.push(unrelated, previous)

			const missingPlayer = await room.fetch(new Request("https://room.test/ws", { headers: { upgrade: "websocket", "sec-websocket-protocol": `race-v1, token.${ticket.token}` } }))
			expect(missingPlayer.status).toBe(401)
			const missingTicket = await room.fetch(new Request(`https://room.test/ws?playerId=${ticket.playerId}`, { headers: { upgrade: "websocket" } }))
			expect(missingTicket.status).toBe(401)
			const connected = await room.fetch(new Request(`https://room.test/ws?playerId=${ticket.playerId}`, { headers: { upgrade: "websocket", "sec-websocket-protocol": `race-v1, token.${ticket.token}` } }))
			expect(connected.status).toBe(101)
			expect(connected.headers.get("sec-websocket-protocol")).toBe("race-v1")
			expect(previous.closed).toBe(true)
			expect(JSON.parse(pair[1].sent[0]!).type).toBe("snapshot")
			expect(state.sockets).toContain(pair[1])
		} finally {
			vi.unstubAllGlobals()
		}
	})

	it("creates, fills, starts, finishes, and rematches a room through its state machine", async () => {
		vi.useFakeTimers()
		vi.setSystemTime(1_000_000)
		try {
			const state = stateMock()
			const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
			const config = { ...defaultRaceConfig, format: "custom" as const, customText: "abc", maxPlayers: 2 }
			const created = await room.fetch(request("/create", { code: "ABCDEFGH", config, name: "Host" }))
			const host = await created.json() as { playerId: string }
			const guestResponse = await room.fetch(request("/join", { name: "Guest" }))
			const guest = await guestResponse.json() as { playerId: string }
			expect(created.status).toBe(201)
			expect(guestResponse.status).toBe(201)
			expect((await room.fetch(request("/join", { name: "Guest" }))).status).toBe(409)
			expect((await room.fetch(request("/create", { code: "ABCDEFGH", config, name: "Host" }))).status).toBe(409)

			const internalRoom = (room as unknown as { room: { members: Record<string, { player: { connected: boolean } }> } }).room
			for (const member of Object.values(internalRoom.members)) member.player.connected = true
			const hostSocket = new FakeSocket()
			hostSocket.serializeAttachment({ playerId: host.playerId })
			const guestSocket = new FakeSocket()
			guestSocket.serializeAttachment({ playerId: guest.playerId })
			state.sockets.push(hostSocket, guestSocket)
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "ready", ready: true }))
			await room.webSocketMessage(guestSocket as unknown as WebSocket, JSON.stringify({ type: "ready", ready: true }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "start" }))
			expect(state.alarms.at(-1)).toBe(1_003_000)
			vi.setSystemTime(1_003_000)
			await room.alarm()
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "abc", seq: 1 }))
			await room.webSocketMessage(guestSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "abc", seq: 1 }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "rematch" }))
			expect(JSON.parse(hostSocket.sent.at(-1)!).room.phase).toBe("waiting")
			await room.webSocketMessage(hostSocket as unknown as WebSocket, "not-json")
			await room.webSocketMessage(hostSocket as unknown as WebSocket, new ArrayBuffer(4))
			expect((await room.fetch(request("/unknown", undefined, "GET"))).status).toBe(404)
		} finally {
			vi.useRealTimers()
		}
	})

	it("validates racing inputs, rate-limits bursts, handles disconnects, and expires a round", async () => {
		vi.useFakeTimers()
		vi.setSystemTime(3_000_000)
		try {
			const state = stateMock()
			const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
			const config = { ...defaultRaceConfig, format: "custom" as const, customText: "abc", maxPlayers: 2 }
			const host = await (await room.fetch(request("/create", { code: "ABCDEFGH", config, name: "Host" }))).json() as { playerId: string }
			const guest = await (await room.fetch(request("/join", { name: "Guest" }))).json() as { playerId: string }
			const hostSocket = new FakeSocket()
			const guestSocket = new FakeSocket()
			hostSocket.serializeAttachment({ playerId: host.playerId })
			guestSocket.serializeAttachment({ playerId: guest.playerId })
			state.sockets.push(hostSocket, guestSocket)
			const current = (room as unknown as { room: { phase: string; hostId: string; startsAt: number | null; endsAt: number | null; members: Record<string, { player: RacePlayer; inputCount: number; inputWindowAt: number }> } }).room
			for (const member of Object.values(current.members)) member.player.connected = true

			await room.webSocketMessage(hostSocket as unknown as WebSocket, "x".repeat(513))
			await room.webSocketMessage(new FakeSocket() as unknown as WebSocket, JSON.stringify({ type: "ready" }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "start" }))
			expect(JSON.parse(hostSocket.sent.at(-1)!).error).toContain("At least two")
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "ready", ready: true }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "start" }))
			expect(JSON.parse(hostSocket.sent.at(-1)!).type).toBe("error")
			await room.webSocketMessage(guestSocket as unknown as WebSocket, JSON.stringify({ type: "ready", ready: true }))
			await room.webSocketMessage(guestSocket as unknown as WebSocket, JSON.stringify({ type: "start" }))
			expect(current.phase).toBe("waiting")
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "start" }))
			expect(current.phase).toBe("countdown")
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "a", seq: 1 }))
			await room.alarm()
			expect(current.phase).toBe("countdown")
			vi.setSystemTime(current.startsAt!)
			await room.alarm()
			expect(current.phase).toBe("racing")

			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: 4, seq: 1 }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "a", seq: "1" }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "x".repeat(33), seq: 1 }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "a", seq: 1 }))
			const sentAfterFirst = hostSocket.sent.length
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "b", seq: 1 }))
			expect(hostSocket.sent.length).toBe(sentAfterFirst)
			for (let seq = 2; seq <= 7; seq += 1) {
				await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "x".repeat(32), seq }))
			}
			expect(current.members[host.playerId]!.inputCount).toBe(194)
			vi.advanceTimersByTime(1000)
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "bc", seq: 8 }))
			expect(current.members[host.playerId]!.player.status).toBe("finished")
			expect(current.members[host.playerId]!.inputCount).toBe(2)
			await room.webSocketMessage(guestSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "abc", seq: 1 }))
			expect(current.phase).toBe("finished")
			current.members[guest.playerId]!.player.connected = false
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "rematch" }))
			expect(current.phase).toBe("waiting")
			expect(Object.keys(current.members)).toEqual([host.playerId])
			state.sockets.splice(state.sockets.indexOf(guestSocket), 1)
			const nextGuest = await (await room.fetch(request("/join", { name: "Guest Two" }))).json() as { playerId: string }
			const nextGuestSocket = new FakeSocket()
			nextGuestSocket.serializeAttachment({ playerId: nextGuest.playerId })
			state.sockets.push(nextGuestSocket)
			current.members[host.playerId]!.player.connected = true
			current.members[nextGuest.playerId]!.player.connected = true
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "ready", ready: true }))
			await room.webSocketMessage(nextGuestSocket as unknown as WebSocket, JSON.stringify({ type: "ready", ready: true }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "start" }))
			expect(current.phase).toBe("countdown")
			vi.setSystemTime(current.startsAt!)
			await room.alarm()
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "a", seq: 99 }))
			vi.setSystemTime(current.endsAt!)
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "b", seq: 100 }))
			current.members[nextGuest.playerId]!.player.status = "out"
			await room.alarm()
			expect(current.phase).toBe("finished")
			expect(current.members[host.playerId]!.player.status).toBe("out")
			expect(current.members[nextGuest.playerId]!.player.status).toBe("out")
		} finally {
			vi.useRealTimers()
		}
	})

	it("hands a waiting room to a connected player and ignores stale duplicate sockets", async () => {
		const state = stateMock()
		const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
		const config = { ...defaultRaceConfig, maxPlayers: 2 }
		const host = await (await room.fetch(request("/create", { code: "ABCDEFGH", config, name: "Host" }))).json() as { playerId: string }
		const guest = await (await room.fetch(request("/join", { name: "Guest" }))).json() as { playerId: string }
		const hostSocket = new FakeSocket()
		const replacement = new FakeSocket()
		const guestSocket = new FakeSocket()
		hostSocket.serializeAttachment({ playerId: host.playerId })
		replacement.serializeAttachment({ playerId: host.playerId })
		guestSocket.serializeAttachment({ playerId: guest.playerId })
		state.sockets.push(hostSocket, replacement, guestSocket)
		const current = (room as unknown as { room: { hostId: string; members: Record<string, { player: { connected: boolean; ready: boolean } }> } }).room
		for (const member of Object.values(current.members)) member.player.connected = true
		await room.webSocketClose(guestSocket as unknown as WebSocket)
		expect(current.hostId).toBe(host.playerId)
		current.members[guest.playerId]!.player.connected = true
		await room.webSocketClose(hostSocket as unknown as WebSocket)
		expect(current.members[host.playerId]!.player.connected).toBe(true)
		state.sockets.splice(state.sockets.indexOf(replacement), 1)
		await room.webSocketError(hostSocket as unknown as WebSocket)
		expect(current.hostId).toBe(guest.playerId)
		expect(current.members[host.playerId]!.player.ready).toBe(false)
		await room.webSocketClose(guestSocket as unknown as WebSocket)
		expect(current.hostId).toBe(guest.playerId)
	})

	it("cleans up absent rooms and turns non-Error storage failures into room errors", async () => {
		const emptyState = stateMock()
		const empty = new RaceRoom(emptyState.ctx as unknown as DurableObjectState, {} as never)
		expect((await empty.fetch(new Request("https://room.test/ws", { headers: { upgrade: "websocket" } }))).status).toBe(404)
		await empty.webSocketError(new FakeSocket() as unknown as WebSocket)
		await empty.alarm()

		const state = stateMock()
		vi.spyOn(state.storage, "put").mockRejectedValue("storage unavailable")
		const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
		const result = await room.fetch(request("/create", { code: "ABCDEFGH", config: defaultRaceConfig, name: "Host" }))
		expect(result.status).toBe(400)
		expect(await result.json()).toEqual({ error: "Room error" })
	})

	it("uses the configured time limit for time-format rooms", async () => {
		vi.useFakeTimers()
		vi.setSystemTime(5_000_000)
		try {
			const state = stateMock()
			const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
			const config = { ...defaultRaceConfig, format: "time" as const, timeSeconds: 1, maxPlayers: 2 }
			const host = await (await room.fetch(request("/create", { code: "ABCDEFGH", config, name: "Host" }))).json() as { playerId: string }
			const guest = await (await room.fetch(request("/join", { name: "Guest" }))).json() as { playerId: string }
			const current = (room as unknown as { room: { phase: string; startsAt: number | null; endsAt: number | null; members: Record<string, { player: RacePlayer; inputCount: number }> } }).room
			for (const member of Object.values(current.members)) member.player.connected = true
			const hostSocket = new FakeSocket()
			const guestSocket = new FakeSocket()
			hostSocket.serializeAttachment({ playerId: host.playerId })
			guestSocket.serializeAttachment({ playerId: guest.playerId })
			state.sockets.push(hostSocket, guestSocket)
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "ready", ready: true }))
			await room.webSocketMessage(guestSocket as unknown as WebSocket, JSON.stringify({ type: "ready", ready: true }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "start" }))
			expect(current.endsAt).toBe(current.startsAt! + 1000)
			vi.setSystemTime(current.startsAt!)
			await room.alarm()
			vi.setSystemTime(current.endsAt!)
			await room.alarm()
			expect(current.phase).toBe("finished")
			expect(current.members[host.playerId]!.player.status).toBe("finished")
			expect(current.members[guest.playerId]!.player.status).toBe("finished")
			current.phase = "racing"
			current.startsAt = Date.now() + 500
			current.endsAt = Date.now() + 1000
			const inputCount = current.members[host.playerId]!.inputCount
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "a", seq: 1 }))
			expect(current.members[host.playerId]!.inputCount).toBe(inputCount)
			current.startsAt = Date.now() - 500
			current.endsAt = Date.now()
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "b", seq: 2 }))
			expect(current.members[host.playerId]!.inputCount).toBe(inputCount)
		} finally {
			vi.useRealTimers()
		}
	})

	it("rejects race input when persisted timing boundaries are missing", async () => {
		const state = stateMock()
		const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
		const config = { ...defaultRaceConfig, format: "custom" as const, customText: "abc", maxPlayers: 2 }
		const host = await (await room.fetch(request("/create", { code: "ABCDEFGH", config, name: "Host" }))).json() as { playerId: string }
		const guest = await (await room.fetch(request("/join", { name: "Guest" }))).json() as { playerId: string }
		const hostSocket = new FakeSocket()
		const guestSocket = new FakeSocket()
		hostSocket.serializeAttachment({ playerId: host.playerId })
		guestSocket.serializeAttachment({ playerId: guest.playerId })
		state.sockets.push(hostSocket, guestSocket)
		const current = (room as unknown as { room: { phase: string; startsAt: number | null; endsAt: number | null; members: Record<string, { player: RacePlayer }> } }).room
		current.phase = "racing"
		current.startsAt = null
		current.endsAt = null
		await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "a", seq: 1 }))
		expect(current.members[host.playerId]!.player.cursor).toBe(0)
		current.startsAt = Date.now() - 1
		await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "a", seq: 1 }))
		expect(current.members[host.playerId]!.player.cursor).toBe(0)
	})
})
