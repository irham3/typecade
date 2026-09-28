import { describe, expect, it, vi } from "vitest"
import { defaultRaceConfig } from "@typecade/race-rules"
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
		const env = {
			ROOMS: { idFromName: (code: string) => code, get: () => ({ fetch: roomFetch }) },
			ASSETS: { fetch: vi.fn(async () => new Response("asset")) },
		} as never
		const health = await worker.fetch(new Request("https://app.test/api/health"), env)
		expect(await health.json()).toEqual({ ok: true })
		expect((await worker.fetch(new Request("https://app.test/api/missing"), env)).status).toBe(404)
		expect((await worker.fetch(new Request("https://app.test/api/rooms/ABCDEFGH"), env)).status).toBe(405)
		expect((await worker.fetch(request("/api/rooms/ABCDEFGH/join", {}), env)).status).toBe(201)
		const invalidJson = await worker.fetch(new Request("https://app.test/api/rooms", { method: "POST", body: "{" }), env)
		expect(invalidJson.status).toBe(400)
		expect(await invalidJson.json()).toMatchObject({ error: expect.any(String) })
		const oversized = await worker.fetch(new Request("https://app.test/api/rooms", { method: "POST", body: "x".repeat(10001) }), env)
		expect(oversized.status).toBe(400)
		const invalidName = await worker.fetch(request("/api/rooms", { config: defaultRaceConfig, name: "x" }), env)
		expect(invalidName.status).toBe(400)

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
			const internal = (room as unknown as { room: { members: Record<string, { lastSeenAt: number }> } }).room
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
		} finally { vi.useRealTimers() }
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
})
