/// <reference types="@cloudflare/workers-types" />
import { applyRaceInput, createRacePlayer, generateRaceText, parseRaceConfig, rankRacePlayers, type RaceConfig, type RacePlayer, type RaceRoomSnapshot } from "@typecade/race-rules"

interface Env {
	ROOMS: DurableObjectNamespace
	ASSETS: Fetcher
}

interface Member {
	player: RacePlayer
	tokenHash: string
	lastSeenAt: number
	inputWindowAt: number
	inputCount: number
}

interface StoredRoom {
	code: string
	hostId: string
	phase: RaceRoomSnapshot["phase"]
	config: RaceConfig
	text: string
	members: Record<string, Member>
	startsAt: number | null
	endsAt: number | null
	createdAt: number
}

const roomCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const connectionProtocol = "race-v1"

function json(value: unknown, status = 200): Response {
	return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } })
}

function errorResponse(message: string, status = 400): Response {
	return json({ error: message }, status)
}

function roomCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(8))
	return Array.from(bytes, (byte) => roomCodeAlphabet[byte % roomCodeAlphabet.length]).join("")
}

function playerName(value: unknown): string {
	if (typeof value !== "string") throw new Error("Enter a name")
	const name = value.normalize("NFKC").replace(/[\p{C}]/gu, "").trim().replace(/\s+/g, " ")
	if (name.length < 2 || name.length > 20) throw new Error("Name must be 2–20 characters")
	return name
}

async function hashToken(token: string): Promise<string> {
	const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
	return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
	const body = await request.text()
	if (body.length > 10000) throw new Error("Request is too large")
	const value: unknown = JSON.parse(body)
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request")
	return value as Record<string, unknown>
}

const worker = {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url)
		if (url.pathname === "/api/health") return json({ ok: true })
		if (url.pathname === "/api/rooms" && request.method === "POST") {
			try {
				const body = await readJson(request)
				const config = parseRaceConfig(body.config)
				const name = playerName(body.name)
				const code = roomCode()
				return await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(new Request(`https://room.internal/create`, { method: "POST", body: JSON.stringify({ code, config, name }) }))
			} catch (error) {
				return errorResponse(error instanceof Error ? error.message : "Could not create room")
			}
		}
		const match = /^\/api\/rooms\/([A-HJ-NP-Z2-9]{8})(?:\/(join|ws))?$/.exec(url.pathname)
		if (match) {
			const [, code, action] = match
			const stub = env.ROOMS.get(env.ROOMS.idFromName(code!))
			if (action === "join" && request.method === "POST") return stub.fetch(new Request("https://room.internal/join", { method: "POST", body: request.body, headers: request.headers }))
			if (action === "ws" && request.headers.get("upgrade")?.toLowerCase() === "websocket") return stub.fetch(new Request(`https://room.internal/ws${url.search}`, request))
			return errorResponse("Unsupported room request", 405)
		}
		if (url.pathname.startsWith("/api/")) return errorResponse("Not found", 404)
		return env.ASSETS.fetch(request)
	},
}

export default worker

export class RaceRoom {
	private room: StoredRoom | null = null
	private readonly ready: Promise<void>
	private lastBroadcastAt = 0

	constructor(private readonly ctx: DurableObjectState, private readonly env: Env) {
		this.ready = ctx.storage.get<StoredRoom>("room").then((value) => { this.room = value ?? null })
	}

	async fetch(request: Request): Promise<Response> {
		await this.ready
		const path = new URL(request.url).pathname
		try {
			if (path === "/create" && request.method === "POST") return await this.create(await readJson(request))
			if (path === "/join" && request.method === "POST") return await this.join(await readJson(request))
			if (path === "/ws" && request.headers.get("upgrade")?.toLowerCase() === "websocket") return await this.connect(request)
			return errorResponse("Not found", 404)
		} catch (error) {
			return errorResponse(error instanceof Error ? error.message : "Room error")
		}
	}

	private async create(body: Record<string, unknown>): Promise<Response> {
		if (this.room) return errorResponse("Room code collision", 409)
		const config = parseRaceConfig(body.config)
		const name = playerName(body.name)
		const code = String(body.code)
		const playerId = crypto.randomUUID()
		const token = crypto.randomUUID()
		const player = createRacePlayer(playerId, name, config.variant)
		this.room = {
			code, hostId: playerId, phase: "waiting", config,
			text: generateRaceText(config, `${code}:${crypto.randomUUID()}`),
			members: { [playerId]: { player, tokenHash: await hashToken(token), lastSeenAt: Date.now(), inputWindowAt: 0, inputCount: 0 } },
			startsAt: null, endsAt: null, createdAt: Date.now(),
		}
		await this.save()
		return json({ code, playerId, token }, 201)
	}

	private async join(body: Record<string, unknown>): Promise<Response> {
		const room = this.room
		if (!room) return errorResponse("Room not found", 404)
		if (room.phase !== "waiting") return errorResponse("This race has already started", 409)
		const name = playerName(body.name)
		const now = Date.now()
		for (const [id, member] of Object.entries(room.members)) {
			if (!member.player.connected && member.lastSeenAt < now - 120000) delete room.members[id]
		}
		if (Object.values(room.members).some((member) => member.player.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return errorResponse("Name already taken in this room", 409)
		if (Object.keys(room.members).length >= room.config.maxPlayers) return errorResponse("Room is full", 409)
		const playerId = crypto.randomUUID()
		const token = crypto.randomUUID()
		room.members[playerId] = { player: createRacePlayer(playerId, name, room.config.variant), tokenHash: await hashToken(token), lastSeenAt: now, inputWindowAt: 0, inputCount: 0 }
		if (!room.members[room.hostId]) room.hostId = playerId
		await this.save()
		this.broadcast()
		return json({ code: room.code, playerId, token }, 201)
	}

	private async connect(request: Request): Promise<Response> {
		const room = this.room
		if (!room) return errorResponse("Room not found", 404)
		const playerId = new URL(request.url).searchParams.get("playerId")
		const protocols = (request.headers.get("sec-websocket-protocol") ?? "").split(",").map((item) => item.trim())
		const token = protocols.find((protocol) => protocol.startsWith("token."))?.slice(6)
		const member = playerId ? room.members[playerId] : null
		if (!member || !token || await hashToken(token) !== member.tokenHash) return errorResponse("Invalid room ticket", 401)
		const pair = new WebSocketPair()
		const [client, server] = Object.values(pair)
		for (const socket of this.ctx.getWebSockets()) {
			if ((socket.deserializeAttachment() as { playerId?: string } | null)?.playerId === playerId) socket.close(4000, "Session replaced")
		}
		this.ctx.acceptWebSocket(server)
		server.serializeAttachment({ playerId })
		member.player.connected = true
		member.lastSeenAt = Date.now()
		await this.save()
		server.send(JSON.stringify({ type: "snapshot", room: this.snapshot() }))
		this.broadcast()
		return new Response(null, { status: 101, webSocket: client, headers: { "sec-websocket-protocol": connectionProtocol } })
	}

	async webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer): Promise<void> {
		await this.ready
		const room = this.room
		const playerId = (socket.deserializeAttachment() as { playerId?: string } | null)?.playerId
		const member = playerId ? room?.members[playerId] : null
		if (!room || !member || typeof raw !== "string" || raw.length > 512) return
		let message: Record<string, unknown>
		try { message = JSON.parse(raw) as Record<string, unknown> } catch { return }
		const now = Date.now()
		member.lastSeenAt = now
		if (message.type === "ready" && room.phase === "waiting") {
			member.player.ready = message.ready === true
			await this.save()
			this.broadcast()
		} else if (message.type === "start" && room.phase === "waiting" && playerId === room.hostId) {
			const players = Object.values(room.members).map((entry) => entry.player)
			if (players.length < 2 || players.some((player) => !player.ready || !player.connected)) {
				socket.send(JSON.stringify({ type: "error", error: "At least two connected players must be ready" }))
				return
			}
			room.phase = "countdown"
			room.startsAt = now + 3000
			room.endsAt = room.startsAt + (room.config.format === "time" ? room.config.timeSeconds * 1000 : Math.min(3600000, Math.max(180000, room.text.length * 200)))
			await this.save()
			await this.ctx.storage.setAlarm(room.startsAt)
			this.broadcast()
		} else if (message.type === "type" && room.phase === "racing" && now >= (room.startsAt ?? Infinity) && now < (room.endsAt ?? 0)) {
			const value = message.text
			const seq = message.seq
			if (typeof value !== "string" || typeof seq !== "number" || value.length > 32) return
			if (now - member.inputWindowAt >= 1000) { member.inputWindowAt = now; member.inputCount = 0 }
			member.inputCount += value.length
			if (member.inputCount > 180) return
			const result = applyRaceInput(member.player, room.text, value, seq, now, room.config)
			if (result.player === member.player) return
			member.player = result.player
			if (Object.values(room.members).every((entry) => entry.player.status === "finished" || entry.player.status === "out")) room.phase = "finished"
			await this.save()
			if (room.phase === "finished" || result.player.status !== "racing" || now - this.lastBroadcastAt >= 200) this.broadcast()
			else socket.send(JSON.stringify({ type: "snapshot", room: this.snapshot() }))
		} else if (message.type === "rematch" && room.phase === "finished" && playerId === room.hostId) {
			for (const [id, entry] of Object.entries(room.members)) {
				if (!entry.player.connected) delete room.members[id]
				else entry.player = createRacePlayer(id, entry.player.name, room.config.variant)
			}
			room.phase = "waiting"
			room.startsAt = null
			room.endsAt = null
			room.text = generateRaceText(room.config, `${room.code}:${crypto.randomUUID()}`)
			await this.save()
			this.broadcast()
		}
	}

	async webSocketClose(socket: WebSocket): Promise<void> {
		await this.ready
		const room = this.room
		const playerId = (socket.deserializeAttachment() as { playerId?: string } | null)?.playerId
		const member = playerId ? room?.members[playerId] : null
		if (!room || !member) return
		if (this.ctx.getWebSockets().some((other) => other !== socket && (other.deserializeAttachment() as { playerId?: string } | null)?.playerId === playerId)) return
		member.player.connected = false
		member.player.ready = false
		member.lastSeenAt = Date.now()
		if (room.phase === "waiting" && room.hostId === playerId) room.hostId = Object.values(room.members).find((entry) => entry.player.connected)?.player.id ?? playerId!
		await this.save()
		this.broadcast()
	}

	async webSocketError(socket: WebSocket): Promise<void> { await this.webSocketClose(socket) }

	async alarm(): Promise<void> {
		await this.ready
		const room = this.room
		if (!room) return
		const now = Date.now()
		if (room.phase === "countdown" && room.startsAt && now >= room.startsAt) {
			room.phase = "racing"
			for (const member of Object.values(room.members)) member.player.status = "racing"
			await this.ctx.storage.setAlarm(room.endsAt!)
		} else if (room.phase === "racing" && room.endsAt && now >= room.endsAt) {
			room.phase = "finished"
			for (const member of Object.values(room.members)) {
				if (member.player.status === "racing") {
					member.player.status = room.config.format === "time" ? "finished" : "out"
					member.player.finishedAt = now
				}
			}
		}
		await this.save()
		this.broadcast()
	}

	private snapshot(): RaceRoomSnapshot {
		const room = this.room!
		return {
			code: room.code, hostId: room.hostId, phase: room.phase, config: room.config, text: room.text,
			players: rankRacePlayers(Object.values(room.members).map((member) => member.player), room.config),
			startsAt: room.startsAt, endsAt: room.endsAt, serverNow: Date.now(),
		}
	}

	private broadcast(): void {
		const now = Date.now()
		this.lastBroadcastAt = now
		const payload = JSON.stringify({ type: "snapshot", room: this.snapshot() })
		for (const socket of this.ctx.getWebSockets()) {
			try { socket.send(payload) } catch { /* Closed sockets are handled by webSocketClose. */ }
		}
	}

	private async save(): Promise<void> { await this.ctx.storage.put("room", this.room) }
}
