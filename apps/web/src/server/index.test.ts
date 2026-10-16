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
		deleteAlarm: vi.fn(async () => undefined),
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
 it("settles skill finishers, interrupted combats and older persisted finish times",async()=>{
  vi.useFakeTimers();vi.setSystemTime(20_000_000)
  try{
   for(const mode of ["sprint","clash","raid"] as const){
    const state=stateMock(),room=new RaceRoom(state.ctx as unknown as DurableObjectState,{} as never)
    await room.fetch(request("/create",{code:"ABCDEFGH",name:"Blue",config:{...defaultRaceConfig,mode,language:"en",format:"custom",customText:"hit",maxPlayers:4}}))
    for(const name of ["Red","Green","Gold"])await room.fetch(request("/join",{name}))
    const current=(room as unknown as {room:{phase:string;startsAt:number;text:string;config:{mode?:string};combat:import("@typecade/race-rules").ArenaCombat;members:Record<string,{player:RacePlayer}>};snapshot:()=>import("@typecade/race-rules").RaceRoomSnapshot})
    const ids=Object.keys(current.room.members),sockets=ids.map(id=>{const socket=new FakeSocket();socket.serializeAttachment({playerId:id});state.sockets.push(socket);current.room.members[id]!.player.connected=true;return socket})
    const send=async(i:number,message:unknown)=>room.webSocketMessage(sockets[i]! as unknown as WebSocket,JSON.stringify(message))
    for(let i=0;i<4;i++)await send(i,{type:"ready",ready:true})
    if(mode==="sprint")delete current.room.config.mode
    await send(0,{type:"start"});vi.setSystemTime(current.room.startsAt);await room.alarm()
    if(mode==="sprint"){
     for(let i=0;i<4;i++){await send(i,{type:"skill",skill:"cleave",text:"CLEAVE",seq:1});expect(current.room.members[ids[i]!]!.player.status).toBe("finished")}
     expect(current.room.phase).toBe("finished")
     for(const entry of Object.values(current.room.members))entry.player.finishedAt=null
     expect(current.snapshot().players).toHaveLength(4)
    }else{
     current.room.text="hit ".repeat(25000);current.room.members[ids[0]!]!.player.cursor=99999
     vi.advanceTimersByTime(50);await send(0,{type:"type",text:" ",seq:1})
     expect(current.room.members[ids[0]!]!.player.status).toBe("racing")
     if(mode==="raid")current.room.combat.bossHp=1
     else for(const id of ids.slice(1))current.room.combat.players[id]!.hp=1
     vi.advanceTimersByTime(1000);await send(0,{type:"skill",skill:"cleave",text:"CLEAVE",seq:1})
     expect(current.room.phase).toBe("finished")
     await send(0,{type:"rematch"});for(let i=0;i<4;i++)await send(i,{type:"ready",ready:true});await send(0,{type:"start"});vi.setSystemTime(current.room.startsAt);await room.alarm()
     await send(3,{type:"leave"});expect(current.room.phase).toBe("racing")
     await send(2,{type:"leave"});await send(1,{type:"leave"})
     expect(current.room.phase).toBe(mode==="clash"?"finished":"racing")
    }
   }
  }finally{vi.useRealTimers()}
 })
 it("supports old stored rooms with absent mode/budget fields and rejects actions outside their clock",async()=>{
  vi.useFakeTimers();vi.setSystemTime(0)
  try{
   const state=stateMock(),room=new RaceRoom(state.ctx as unknown as DurableObjectState,{} as never)
   const ticket=await(await room.fetch(request("/create",{code:"ABCDEFGH",name:"Blue",config:{...defaultRaceConfig,mode:"raid",maxPlayers:4}}))).json() as {playerId:string}
   const current=(room as unknown as {room:{phase:string;config:{mode?:string};combat?:import("@typecade/race-rules").ArenaCombat;text:string;startsAt:number|null;endsAt:number|null;members:Record<string,{player:RacePlayer}>}}).room
   const socket=new FakeSocket();socket.serializeAttachment({playerId:ticket.playerId});state.sockets.push(socket);current.members[ticket.playerId]!.player.connected=true
   const send=async(message:unknown)=>room.webSocketMessage(socket as unknown as WebSocket,JSON.stringify(message))
   await send({type:"start"});expect(socket.sent.at(-1)).toContain("At least four")
   current.phase="racing";current.members[ticket.playerId]!.player.status="racing";current.text="abc"
   await send({type:"skill",skill:"storm",seq:1,text:"BADAI"})
   current.startsAt=0;await send({type:"skill",skill:"storm",seq:1,text:"BADAI"})
   current.endsAt=10000;await send({type:"type",text:"a",seq:1});expect(current.members[ticket.playerId]!.player.cursor).toBe(1)
   current.members[ticket.playerId]!.player.status="out";await send({type:"type",text:"b",seq:2});expect(current.members[ticket.playerId]!.player.cursor).toBe(1)
   current.phase="waiting";delete current.config.mode;current.members[ticket.playerId]!.player.status="waiting";await send({type:"ready",ready:true});await send({type:"start"});expect(socket.sent.at(-1)).toContain("At least two")
   for(let i=0;i<90;i++)await send({type:"unknown"});expect(socket.closed).toBe(true)
  }finally{vi.useRealTimers()}
 })

 it("runs server-owned dungeon roles, word effects, skill checks, deadlines and rematches",async()=>{
  vi.useFakeTimers();vi.setSystemTime(10_000_000)
  try{
   for(const mode of ["raid","clash","sprint"] as const){
    const state=stateMock(),room=new RaceRoom(state.ctx as unknown as DurableObjectState,{} as never)
    await room.fetch(request("/create",{code:"ABCDEFGH",name:"Blue",config:{...defaultRaceConfig,language:"en",mode,format:"custom",customText:"hit hit hit hit hit",maxPlayers:4}}))
    for(const name of ["Red","Green","Gold"])await room.fetch(request("/join",{name}))
    const current=(room as unknown as {room:{phase:string;startsAt:number;endsAt:number;text:string;combat:import("@typecade/race-rules").ArenaCombat;members:Record<string,{player:RacePlayer;inputCredits:number;inputAt:number}>}}).room
    const ids=Object.keys(current.members),sockets=ids.map(id=>{const socket=new FakeSocket();socket.serializeAttachment({playerId:id});state.sockets.push(socket);current.members[id]!.player.connected=true;return socket})
    const send=async(i:number,message:unknown)=>room.webSocketMessage(sockets[i]! as unknown as WebSocket,JSON.stringify(message))
    await send(2,{type:"role",role:"dps"});for(let i=0;i<4;i++)await send(i,{type:"ready",ready:true})
    if(mode==="raid"){await send(0,{type:"start"});expect(current.phase).toBe("waiting");expect(sockets[0]!.sent.at(-1)).toContain("Raid needs");await send(2,{type:"role",role:"healer"})}
    await send(0,{type:"start"});vi.setSystemTime(current.startsAt);await room.alarm();expect(current.phase).toBe("racing")
    const type=async(i:number,text:string)=>{for(const char of text){vi.advanceTimersByTime(50);await send(i,{type:"type",text:char,seq:current.members[ids[i]!]!.player.lastSeq+1})}}
    await type(0,"hit ");expect(current.combat.players[ids[0]!]!.words).toBe(1)
    await send(0,{type:"skill",skill:"storm",seq:1,text:"FAKE"});expect(sockets[0]!.sent.at(-1)).toContain("valid skill")
    await send(0,{type:"skill",skill:"storm",seq:1,text:"STORM"});expect(current.combat.players[ids[0]!]!.cooldowns.storm).toBe(5)
    vi.advanceTimersByTime(1000);await send(0,{type:"skill",skill:"storm",seq:2,text:"STORM"});expect(sockets[0]!.sent.at(-1)).toContain("more words")
    if(mode==="raid"){
     current.combat.players[ids[0]!]!.hp=0;await send(0,{type:"type",text:"h",seq:99});expect(current.members[ids[0]!]!.player.lastSeq).toBe(99)
     await type(2,"hit ");expect(current.combat.revives).toBe(2);expect(current.combat.players[ids[0]!]!.hp).toBeGreaterThan(0)
     current.combat.nextAttack=Date.now();await room.alarm();expect(current.combat.actions.at(-1)!.target).toBe(ids[3])
     current.combat.bossHp=1;await type(1,"hit ");expect(current.combat.winner).toBe("team");expect(current.phase).toBe("finished")
    }else if(mode==="clash"){
     current.combat.players[ids[1]!]!.hp=1;current.combat.players[ids[2]!]!.hp=0;current.combat.players[ids[3]!]!.hp=0
     await type(0,"hit ");expect(current.phase).toBe("finished");expect(current.combat.winner).toBe(ids[0])
    }else{
     current.combat.players[ids[0]!]!.distance=24;vi.advanceTimersByTime(1000);await send(0,{type:"skill",skill:"cleave",seq:3,text:"CLEAVE"});expect(current.members[ids[0]!]!.player.status).toBe("finished")
     vi.setSystemTime(current.endsAt);await room.alarm();expect(current.phase).toBe("finished")
    }
    await send(0,{type:"rematch"});expect(current.members[ids[2]!]!.player.role).toBe(mode==="raid"?"healer":"dps");expect(current.combat).toBeUndefined()
    for(let i=0;i<4;i++)await send(i,{type:"ready",ready:true})
    await send(0,{type:"start"});vi.setSystemTime(current.startsAt);await room.alarm()
    vi.advanceTimersByTime(1000);await room.alarm()
    current.members[ids[0]!]!.inputCredits=0;current.members[ids[0]!]!.inputAt=Date.now();await send(0,{type:"skill",skill:"cleave",seq:1,text:"CLEAVE"});expect(sockets[0]!.sent.at(-1)).toContain("playable pace")
    if(mode==="raid"){for(const player of Object.values(current.combat.players))player.hp=0;await room.alarm();expect(current.combat.winner).toBe("boss")}
    else{vi.setSystemTime(current.endsAt);await room.alarm();expect(current.phase).toBe("finished")}
    await room.webSocketClose(sockets[0]! as unknown as WebSocket)
    for(let i=0;i<81;i++)await send(1,{type:"unknown"})
    expect(sockets[1]!.closed).toBe(true)
   }
  }finally{vi.useRealTimers()}
 })
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

	it("releases explicit departures immediately, transfers hosting, and settles a deserted race", async () => {
		const state = stateMock()
		const room = new RaceRoom(state.ctx as unknown as DurableObjectState, {} as never)
		const host = await (await room.fetch(request("/create", { code: "ABCDEFGH", config: { ...defaultRaceConfig, maxPlayers: 3 }, name: "Host" }))).json() as { playerId: string }
		const guest = await (await room.fetch(request("/join", { name: "Guest" }))).json() as { playerId: string }
		const third = await (await room.fetch(request("/join", { name: "Third" }))).json() as { playerId: string }
		const internal = (room as unknown as { room: { phase: string; hostId: string; members: Record<string, { player: RacePlayer }> } }).room
		const sockets = [host, guest, third].map((ticket) => { const socket = new FakeSocket(); socket.serializeAttachment({ playerId: ticket.playerId }); internal.members[ticket.playerId]!.player.connected = true; state.sockets.push(socket); return socket })
		await room.webSocketMessage(sockets[0]! as unknown as WebSocket, JSON.stringify({ type: "leave" }))
		expect(internal.hostId).toBe(guest.playerId)
		expect(internal.members[host.playerId]).toBeUndefined()
		expect((await room.fetch(request("/join", { name: "Replacement" }))).status).toBe(201)
		internal.phase = "racing"
		for (const member of Object.values(internal.members)) member.player.status = "racing"
		await room.webSocketMessage(sockets[2]! as unknown as WebSocket, JSON.stringify({ type: "leave" }))
		expect(internal.phase).toBe("racing")
		const replacement = Object.values(internal.members).find((entry) => entry.player.name === "Replacement")!
		replacement.player.status = "finished"
		await room.webSocketMessage(sockets[1]! as unknown as WebSocket, JSON.stringify({ type: "leave" }))
		expect(internal.phase).toBe("finished")
		expect(state.storage.deleteAlarm).toHaveBeenCalled()
		expect(internal.hostId).toBe(replacement.player.id)
		const replacementSocket = new FakeSocket()
		replacementSocket.serializeAttachment({ playerId: replacement.player.id })
		await room.webSocketMessage(replacementSocket as unknown as WebSocket, JSON.stringify({ type: "leave" }))
		expect(internal.hostId).toBe("")
		expect(sockets.every((socket) => socket.closed)).toBe(true)
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
			for(const [i,text] of Array.from("abc").entries())await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text, seq:i+1 }))
			for(const [i,text] of Array.from("abc").entries())await room.webSocketMessage(guestSocket as unknown as WebSocket, JSON.stringify({ type: "type", text, seq:i+1 }))
			await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "rematch" }))
			expect(Object.values(internalRoom.members).every((member) => member.player.connected)).toBe(true)
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
			const sentBeforeInvalid = hostSocket.sent.length
			for (const raw of ["null", "[]", "1", "true", '"ready"', "{}", "{"]) {
				await expect(room.webSocketMessage(hostSocket as unknown as WebSocket, raw)).resolves.toBeUndefined()
			}
			expect(hostSocket.sent).toHaveLength(sentBeforeInvalid)
			expect(current.members[host.playerId]!.player.ready).toBe(false)
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
			for (let seq = 2; seq <= 20; seq += 1) {
    await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type: "type", text: "x", seq }))
   }
   expect(current.members[host.playerId]!.player.cursor).toBe(1)
   expect(hostSocket.sent.some(raw=>JSON.parse(raw).error?.includes("too fast"))).toBe(true)
   vi.advanceTimersByTime(1000)
   for(const [i,text] of Array.from("bc").entries())await room.webSocketMessage(hostSocket as unknown as WebSocket, JSON.stringify({ type:"type",text,seq:i+21 }))
   expect(current.members[host.playerId]!.player.status).toBe("finished")
			for(const [i,text] of Array.from("abc").entries())await room.webSocketMessage(guestSocket as unknown as WebSocket, JSON.stringify({ type: "type", text, seq:i+1 }))
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
