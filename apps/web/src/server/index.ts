/// <reference types="@cloudflare/workers-types" />
import { applyRaceInput, createRacePlayer, generateRaceText, parseRaceConfig, rankRacePlayers, type RaceConfig, type RacePlayer, type RaceRoomSnapshot } from "@typecade/race-rules"
import { applyArenaWord, arenaMinimum, castArenaSkill, courseDistance, createArenaCombat, finishArenaDeadline, generateDungeonRoomText, leaveArena, tickArena, type ArenaCombat, type DungeonRole } from "@typecade/race-rules"
import type { SkillId } from "@typecade/contracts"
import { skillRules } from "@typecade/content"

interface Env {
	ROOMS: DurableObjectNamespace
	ASSETS: Fetcher
}

interface Member {
	player: RacePlayer
	tokenHash: string
	lastSeenAt: number
	inputCredits?: number
	inputAt?: number
 messagesAt?:number
 messagesCount?:number
}

interface StoredRoom {
 combat?: ArenaCombat
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
const roles: DungeonRole[] = ["dps","dps","healer","tank"]
// Shared typing/skill budget: allow short network bursts, cap sustained input at 300 WPM.
function consumeInput(member: Member, count: number, now: number): boolean {
 const credits=Math.min(12,(member.inputCredits??12)+Math.max(0,now-(member.inputAt??now))*.025)
 member.inputAt=now;member.inputCredits=credits
 if(count>credits)return false
 member.inputCredits-=count;return true
}
function roomText(config:RaceConfig,seed:string){return config.format==="custom"||config.format==="quote"?generateRaceText(config,seed):generateDungeonRoomText(config,seed)}

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
		player.role="dps"
		this.room = {
			code, hostId: playerId, phase: "waiting", config,
			text: roomText(config, `${code}:${crypto.randomUUID()}`),
			members: { [playerId]: { player, tokenHash: await hashToken(token), lastSeenAt: Date.now() } },
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
		room.members[playerId] = { player: createRacePlayer(playerId, name, room.config.variant), tokenHash: await hashToken(token), lastSeenAt: now }
		room.members[playerId]!.player.role=roles[(Object.keys(room.members).length-1)%4]
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
		const receivedAt=Date.now()
		if(receivedAt-(member.messagesAt??0)>=1000){member.messagesAt=receivedAt;member.messagesCount=0}
		member.messagesCount=(member.messagesCount??0)+1
		if(member.messagesCount>80){socket.close(1008,"Too many room messages");return}
		let message: Record<string, unknown>
		try { message = JSON.parse(raw) as Record<string, unknown> } catch { return }
		if (!message || typeof message !== "object" || Array.isArray(message)) return
		const now = Date.now()
		member.lastSeenAt = now
		if (message.type === "leave") {
			if(room.combat){leaveArena(room.combat,playerId!);if(room.combat.ended)room.phase="finished"}
			delete room.members[playerId!]
			if (room.hostId === playerId) {
				const remaining = Object.values(room.members)
				room.hostId = (remaining.find((entry) => entry.player.connected) ?? remaining[0])?.player.id ?? ""
			}
			if (room.phase === "racing" && Object.values(room.members).every((entry) => entry.player.status === "finished" || entry.player.status === "out")) room.phase = "finished"
			await this.save()
			this.broadcast()
			socket.close(1000, "Left room")
		} else if(message.type==="role"&&room.phase==="waiting"&&roles.includes(message.role as DungeonRole)){
			member.player.role=message.role as DungeonRole;await this.save();this.broadcast()
		} else if (message.type === "ready" && room.phase === "waiting") {
			member.player.ready = message.ready === true
			await this.save()
			this.broadcast()
		} else if (message.type === "start" && room.phase === "waiting" && playerId === room.hostId) {
			const players = Object.values(room.members).map((entry) => entry.player)
			const minimum=arenaMinimum(room.config.mode??"sprint")
			if (players.length < minimum || players.some((player) => !player.ready || !player.connected)) {
				socket.send(JSON.stringify({ type: "error", error: minimum===4?"At least four connected players must be ready":"At least two connected players must be ready" }))
				return
			}
			if(room.config.mode==="raid"&&(["dps","healer","tank"] as const).some(role=>players.filter(p=>p.role===role).length<(role==="dps"?2:1))){socket.send(JSON.stringify({type:"error",error:"Raid needs two DPS, a healer and a tank"}));return}
			room.phase = "countdown"
			room.startsAt = now + 3000
			room.endsAt = room.startsAt + (room.config.format === "time" ? room.config.timeSeconds * 1000 : Math.min(3600000, Math.max(180000, room.text.length * 200)))
			room.combat=createArenaCombat(room.config.mode??"sprint",players,room.startsAt)
			for(const entry of Object.values(room.members)){entry.inputCredits=12;entry.inputAt=room.startsAt}
			await this.save()
			await this.ctx.storage.setAlarm(room.startsAt)
			this.broadcast()
		} else if(message.type==="skill"&&room.phase==="racing"&&member.player.status==="racing"&&now>=(room.startsAt??Infinity)&&now<(room.endsAt??0)&&room.combat){
			const skill=message.skill as SkillId
			if(!Object.hasOwn(skillRules,skill)||message.text!==skillRules[skill][room.config.language]||!consumeInput(member,Array.from(String(message.text)).length,now)){socket.send(JSON.stringify({type:"error",error:"Type a valid skill keyword at a playable pace"}));return}
			const result=castArenaSkill(room.combat,playerId!,message.skill as SkillId,message.seq as number,now)
			if(result){socket.send(JSON.stringify({type:"error",error:result}));return}
			if(room.combat.mode==="sprint"&&room.config.format!=="time"&&room.combat.players[playerId!]!.distance>=courseDistance(room.text)){member.player.status="finished";member.player.finishedAt=now}
			if(room.combat.ended)room.phase="finished"
			if(Object.values(room.members).every(entry=>entry.player.status==="finished"||entry.player.status==="out"))room.phase="finished"
			await this.save();this.broadcast()
		} else if (message.type === "type" && room.phase === "racing" && now >= (room.startsAt ?? Infinity) && now < (room.endsAt ?? 0)) {
			const value = message.text
			const seq = message.seq
			if (typeof value !== "string" || typeof seq !== "number" || value.length > 32) return
			if(!Number.isSafeInteger(seq)||seq<=member.player.lastSeq||Array.from(value).length!==1)return
			if(room.combat&&room.combat.players[playerId!]!.hp<=0){member.player.lastSeq=seq;socket.send(JSON.stringify({type:"snapshot",room:this.snapshot()}));return}
			if(!consumeInput(member,1,now)){member.player.lastSeq=seq;socket.send(JSON.stringify({type:"error",error:"Input arrived too fast. Retype the current character."}));socket.send(JSON.stringify({type:"snapshot",room:this.snapshot()}));return}
			const result = applyRaceInput(member.player, room.text, value, seq, now, room.config)
			if (result.player === member.player) return
			member.player = result.player
			if(room.combat){
				const before=result.player.cursor-result.accepted
				for(let cursor=before;cursor<result.player.cursor;cursor++)if(room.text[cursor]===" "||cursor===room.text.length-1){const end=room.text[cursor]===" "?cursor:cursor+1;const start=room.text.lastIndexOf(" ",end-1)+1;applyArenaWord(room.combat,playerId!,room.text.slice(start,end),now)}
				if(room.combat.mode!=="sprint"&&member.player.status==="finished")member.player.status="racing"
				if(room.combat.mode==="sprint"&&room.config.format!=="time"&&room.combat.players[playerId!]!.distance>=courseDistance(room.text)){member.player.status="finished";member.player.finishedAt=now}
				if(room.combat.ended)room.phase="finished"
				if(room.combat.mode!=="sprint"&&member.player.cursor>room.text.length-100&&room.text.length<100000)room.text+=" "+generateDungeonRoomText({...room.config,format:"time"},`${room.code}:${room.text.length}`)
			}
			if (Object.values(room.members).every((entry) => entry.player.status === "finished" || entry.player.status === "out")) room.phase = "finished"
			await this.save()
			if (room.phase === "finished" || result.player.status !== "racing" || now - this.lastBroadcastAt >= 200) this.broadcast()
			else socket.send(JSON.stringify({ type: "snapshot", room: this.snapshot() }))
		} else if (message.type === "rematch" && room.phase === "finished" && playerId === room.hostId) {
			for (const [id, entry] of Object.entries(room.members)) {
				if (!entry.player.connected) delete room.members[id]
				else entry.player = { ...createRacePlayer(id, entry.player.name, room.config.variant), role:entry.player.role, connected: true }
			}
			room.phase = "waiting"
			room.startsAt = null
			room.endsAt = null
			room.text=roomText(room.config,`${room.code}:${crypto.randomUUID()}`);room.combat=undefined
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
		if (room.hostId === playerId) room.hostId = Object.values(room.members).find((entry) => entry.player.connected)?.player.id ?? playerId!
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
			await this.ctx.storage.setAlarm(room.config.mode==="clash"||room.config.mode==="raid"?Math.min(now+1000,room.endsAt!):room.endsAt!)
		} else if (room.phase === "racing" && room.endsAt && now >= room.endsAt) {
			room.phase = "finished"
			if(room.combat&&room.combat.mode!=="sprint")finishArenaDeadline(room.combat)
			for (const member of Object.values(room.members)) {
				if (member.player.status === "racing") {
					member.player.status = room.config.format === "time" ? "finished" : "out"
					member.player.finishedAt = now
				}
			}
		} else if(room.phase==="racing"&&room.combat&&room.config.mode!=="sprint"){
			tickArena(room.combat,now,Object.values(room.members).filter(e=>e.player.connected).map(e=>e.player.id))
			if(room.combat.ended)room.phase="finished"
			else await this.ctx.storage.setAlarm(Math.min(now+1000,room.endsAt!))
		}
		await this.save()
		this.broadcast()
	}

	private snapshot(): RaceRoomSnapshot {
		const room = this.room!
		const players=rankRacePlayers(Object.values(room.members).map(member=>member.player),room.config),combat=room.combat
		if(combat){players.sort((a,b)=>combat.mode==="clash"?(Number(b.id===combat.winner)-Number(a.id===combat.winner)||combat.players[b.id]!.score-combat.players[a.id]!.score||combat.players[b.id]!.hp-combat.players[a.id]!.hp):combat.mode==="sprint"?(Number(a.status==="out")-Number(b.status==="out")||Number(b.status==="finished")-Number(a.status==="finished")||(a.status==="finished"&&b.status==="finished"?(a.finishedAt??Infinity)-(b.finishedAt??Infinity):combat.players[b.id]!.distance-combat.players[a.id]!.distance)):combat.players[b.id]!.score-combat.players[a.id]!.score)}
		return {
			combat:room.combat,
			code: room.code, hostId: room.hostId, phase: room.phase, config: room.config, text: room.text,
			players,
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

	private async save(): Promise<void> {
		if (this.room!.phase === "finished") await this.ctx.storage.deleteAlarm()
		await this.ctx.storage.put("room", this.room)
	}
}
