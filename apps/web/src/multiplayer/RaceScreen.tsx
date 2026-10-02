import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { applyRaceInput, defaultRaceConfig, parseRaceConfig, raceAccuracy, type RaceConfig, type RacePlayer, type RaceRoomSnapshot, type RaceTicket } from "@typecade/race-rules"

const ticketKey = "typecade:ocean-race:ticket"
const nameKey = "typecade:ocean-race:name"
const boatAsset = "/assets/ocean/equipment/ui_equipment_boat_default.png"

function storedTicket(): RaceTicket | null {
	try {
		const saved = JSON.parse(sessionStorage.getItem(ticketKey) ?? "null") as RaceTicket | null
		const requested = new URLSearchParams(location.search).get("race")?.toUpperCase()
		return saved && (!requested || saved.code === requested) ? saved : null
	} catch { return null }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
	const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
	const data = await response.json() as T & { error?: string }
	if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`)
	return data
}

function progress(player: RacePlayer, text: string): number {
	return Math.min(1, player.cursor / Math.max(1, text.length))
}

export function RaceScreen({ onBack }: { onBack: () => void }) {
	const [ticket, setTicket] = useState<RaceTicket | null>(storedTicket)
	const [config, setConfig] = useState<RaceConfig>(defaultRaceConfig)
	const [name, setName] = useState(() => localStorage.getItem(nameKey) ?? "")
	const [joinCode, setJoinCode] = useState(() => new URLSearchParams(location.search).get("race")?.toUpperCase() ?? "")
	const [snapshot, setSnapshot] = useState<RaceRoomSnapshot | null>(null)
	const [connected, setConnected] = useState(false)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState("")
	const [showBoard, setShowBoard] = useState(false)
	const [search, setSearch] = useState("")
	const [now, setNow] = useState(0)
	const [pending, setPending] = useState<Array<{ seq: number; key: string }>>([])
	const socketRef = useRef<WebSocket | null>(null)
	const inputRef = useRef<HTMLInputElement | null>(null)
	const nextSeqRef = useRef(0)

	useEffect(() => {
		if (!ticket) return
		let disposed = false
		let retryTimer: ReturnType<typeof setTimeout> | undefined
		let retryDelay = 500
		const connect = () => {
			const scheme = location.protocol.replace(/^http/, "ws")
			const socket = new WebSocket(`${scheme}//${location.host}/api/rooms/${ticket.code}/ws?playerId=${encodeURIComponent(ticket.playerId)}`, ["race-v1", `token.${ticket.token}`])
			socketRef.current = socket
			socket.onopen = () => { if (!disposed) { setConnected(true); setError(""); retryDelay = 500 } }
			socket.onmessage = (event) => {
			if (disposed) return
			const message = JSON.parse(event.data) as { type: string; room?: RaceRoomSnapshot; error?: string }
			if (message.type === "error") setError(message.error ?? "Room error")
			if (message.type === "snapshot" && message.room) {
				const own = message.room.players.find((player) => player.id === ticket.playerId)
				if (own) {
					setPending((entries) => entries.filter((entry) => entry.seq > own.lastSeq))
					nextSeqRef.current = Math.max(nextSeqRef.current, own.lastSeq)
				}
				setSnapshot(message.room)
			}
			}
			socket.onclose = () => {
				if (disposed) return
				setConnected(false)
				setError("Connection lost. Reconnecting…")
				retryTimer = setTimeout(connect, retryDelay)
				retryDelay = Math.min(5000, retryDelay * 2)
			}
			socket.onerror = () => socket.close()
		}
		connect()
		return () => {
			disposed = true
			clearTimeout(retryTimer)
			socketRef.current?.close()
			socketRef.current = null
			setConnected(false)
		}
	}, [ticket])

	const phase = snapshot?.phase
	useEffect(() => {
		if (phase !== "countdown" && phase !== "racing") return
		const timer = setInterval(() => setNow(Date.now()), 100)
		return () => clearInterval(timer)
	}, [phase])

	useEffect(() => { if (phase === "racing") inputRef.current?.focus() }, [phase])

	const ownServer = snapshot?.players.find((player) => player.id === ticket?.playerId)
	const own = useMemo(() => {
		if (!snapshot || !ownServer) return null
		return pending.reduce((player, entry) => applyRaceInput(player, snapshot.text, entry.key, entry.seq, now, snapshot.config).player, ownServer)
	}, [snapshot, ownServer, pending, now])

	async function enter(path: string, body: unknown) {
		setBusy(true)
		setError("")
		try {
			const next = await postJson<RaceTicket>(path, body)
			sessionStorage.setItem(ticketKey, JSON.stringify(next))
			localStorage.setItem(nameKey, name.trim())
			history.replaceState(null, "", `?race=${next.code}`)
			setTicket(next)
			setSnapshot(null)
			setPending([])
			nextSeqRef.current = 0
		} catch (cause) { setError(cause instanceof Error ? cause.message : "Could not enter room") }
		finally { setBusy(false) }
	}

	function leave() {
		socketRef.current?.close()
		sessionStorage.removeItem(ticketKey)
		history.replaceState(null, "", location.pathname)
		setTicket(null)
		setSnapshot(null)
		setConnected(false)
		setError("")
	}

	function send(message: unknown) {
		if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(message))
	}

	function typeKey(event: KeyboardEvent<HTMLInputElement>) {
		if (!snapshot || !own || snapshot.phase !== "racing" || own.status !== "racing" || !connected || event.ctrlKey || event.metaKey || event.altKey) return
		if (Array.from(event.key).length !== 1) return
		event.preventDefault()
		const seq = ++nextSeqRef.current
		setPending((entries) => [...entries, { seq, key: event.key }])
		send({ type: "type", text: event.key, seq })
	}

	const copyLink = async (currentTicket: RaceTicket) => {
		try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}?race=${currentTicket.code}`) }
		catch { setError(`Share room code ${currentTicket.code}`) }
	}

	return <section className="race-screen" data-testid="race-screen">
		<header className="race-header panel-chrome">
			<div><small>TYPECADE · OCEAN RACE</small><h1>Race the current</h1></div>
			<div className="race-header-actions">
				{ticket && <button className="secondary-action" onClick={leave}>Leave room</button>}
				<button className="secondary-action" onClick={onBack}>Main menu</button>
			</div>
		</header>
		{error && <p className="race-error" role="alert">{error}</p>}
		{!ticket ? <div className="race-setup">
			<form className="race-config panel-chrome" onSubmit={(event) => { event.preventDefault(); try { void enter("/api/rooms", { name, config: parseRaceConfig(config) }) } catch (cause) { setError(cause instanceof Error ? cause.message : "Invalid settings") } }}>
				<h2>Create a room</h2><p>Everyone types the same text. Set the rules before sharing the code.</p>
				<label>Your name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} placeholder="Captain name" required /></label>
				<div className="race-config-grid">
					<label>Language<select value={config.language} onChange={(event) => setConfig({ ...config, language: event.target.value as RaceConfig["language"] })}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></label>
					<label>Text format<select value={config.format} onChange={(event) => setConfig({ ...config, format: event.target.value as RaceConfig["format"] })}><option value="words">Words</option><option value="time">Time</option><option value="quote">Quote</option><option value="custom">Custom text</option></select></label>
					{config.format === "words" && <label>Words <span>1–1000</span><input type="number" min="1" max="1000" value={config.wordCount} onChange={(event) => setConfig({ ...config, wordCount: Number(event.target.value) })} list="race-word-presets" /><datalist id="race-word-presets"><option value="10" /><option value="25" /><option value="50" /><option value="100" /></datalist></label>}
					{config.format === "time" && <label>Seconds <span>1–3600</span><input type="number" min="1" max="3600" value={config.timeSeconds} onChange={(event) => setConfig({ ...config, timeSeconds: Number(event.target.value) })} list="race-time-presets" /><datalist id="race-time-presets"><option value="15" /><option value="30" /><option value="60" /><option value="120" /></datalist></label>}
					{config.format === "quote" && <label>Quote difficulty<select value={config.difficulty} onChange={(event) => setConfig({ ...config, difficulty: event.target.value as RaceConfig["difficulty"] })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>}
					{config.format === "custom" && <label className="race-wide">Custom text<textarea value={config.customText} onChange={(event) => setConfig({ ...config, customText: event.target.value })} maxLength={5000} placeholder="Write the passage all players will type" required /></label>}
					<label>Challenge<select value={config.variant} onChange={(event) => setConfig({ ...config, variant: event.target.value as RaceConfig["variant"] })}><option value="classic">Classic · fastest finish</option><option value="perfect">Perfect Tide · one typo and out</option><option value="three-hulls">Three Hulls · three typos and out</option></select></label>
					<label>Players <span>2–100</span><input type="number" min="2" max="100" value={config.maxPlayers} onChange={(event) => setConfig({ ...config, maxPlayers: Number(event.target.value) })} /></label>
					{(config.format === "words" || config.format === "time") && <><label className="race-check"><input type="checkbox" checked={config.punctuation} onChange={(event) => setConfig({ ...config, punctuation: event.target.checked })} /> Punctuation</label><label className="race-check"><input type="checkbox" checked={config.numbers} onChange={(event) => setConfig({ ...config, numbers: event.target.checked })} /> Numbers</label></>}
					{config.format === "custom" && <label className="race-check"><input type="checkbox" checked={config.shuffle} onChange={(event) => setConfig({ ...config, shuffle: event.target.checked })} /> Shuffle words</label>}
				</div>
				<button className="primary-action" disabled={busy}>Create room</button>
			</form>
			<form className="race-join panel-chrome" onSubmit={(event) => { event.preventDefault(); void enter(`/api/rooms/${joinCode.trim().toUpperCase()}/join`, { name }) }}>
				<h2>Join a friend</h2><p>Enter the eight character room code. Your name is shared with the lobby.</p>
				<label>Room code<input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} maxLength={8} minLength={8} placeholder="ABCDEFGH" required /></label>
				<label>Your name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} placeholder="Captain name" required /></label>
				<button className="secondary-action" disabled={busy}>Join room</button>
				<small>Live guest rooms are casual. Ranked ratings need accounts and are not shown as verified here.</small>
			</form>
		</div> : !snapshot ? <div className="race-loading" role="status">Connecting to room {ticket.code}…</div> : <>
			<div className="race-room-meta panel-chrome"><div><strong>ROOM {snapshot.code}</strong><span>{snapshot.config.language.toUpperCase()} · {snapshot.config.format} · {snapshot.config.variant.replaceAll("-", " ")} · {snapshot.players.length}/{snapshot.config.maxPlayers} players</span></div><span className={connected ? "race-online" : "race-offline"}>{connected ? "Live" : "Reconnecting"}</span></div>
			{snapshot.phase === "waiting" && <div className="race-waiting panel-chrome">
				<div className="race-waiting-head"><div><h2>Waiting at the harbor</h2><p>Share the code, then each player marks ready. The host starts the race.</p></div><button onClick={() => copyLink(ticket)}>Copy invite link</button></div>
				<div className="race-waiting-grid"><div><h3>Captains</h3><ol>{snapshot.players.map((player) => <li key={player.id}><span>{player.name}{player.id === snapshot.hostId ? " · Host" : ""}{player.id === ticket.playerId ? " · You" : ""}</span><strong>{player.ready ? "Ready" : player.connected ? "Waiting" : "Offline"}</strong></li>)}</ol></div><div><h3>Shared rules</h3><p>{snapshot.config.language === "id" ? "Bahasa Indonesia" : "English"} · {snapshot.config.format === "words" ? `${snapshot.config.wordCount} words` : snapshot.config.format === "time" ? `${snapshot.config.timeSeconds} seconds` : snapshot.config.format === "quote" ? `${snapshot.config.difficulty} quote` : "Custom passage"}</p><p>{snapshot.config.variant === "perfect" ? "One typo eliminates you." : snapshot.config.variant === "three-hulls" ? "Third typo eliminates you." : "Fastest valid finish wins."}</p><p className="race-preview">{snapshot.text.slice(0, 120)}{snapshot.text.length > 120 ? "…" : ""}</p></div></div>
				<div className="race-waiting-actions"><button className="primary-action" onClick={() => send({ type: "ready", ready: !own?.ready })} disabled={!connected}>{own?.ready ? "Cancel ready" : "I'm ready"}</button>{ticket.playerId === snapshot.hostId && <button className="secondary-action" onClick={() => send({ type: "start" })} disabled={!connected || snapshot.players.length < 2 || snapshot.players.some((player) => !player.ready || !player.connected)}>Start race</button>}</div>
			</div>}
			{snapshot.phase === "countdown" && <div className="race-countdown panel-chrome" role="status"><span>SET YOUR SAIL</span><strong>{Math.max(1, Math.ceil(((snapshot.startsAt ?? now) - now) / 1000))}</strong><p>The same passage is ready for every captain.</p></div>}
			{snapshot.phase === "racing" && own && <RacePlay room={snapshot} own={own} ticket={ticket} now={now} inputRef={inputRef} onKeyDown={typeKey} onOpenBoard={() => setShowBoard(true)} connected={connected} />}
			{snapshot.phase === "finished" && <div className="race-results panel-chrome"><h2>Race finished</h2><p>{snapshot.players.some((player) => player.status === "finished") ? `Winner: ${snapshot.players[0]?.name}` : "No finisher this round."}</p><Leaderboard room={snapshot} ownId={ticket.playerId} /><div className="race-waiting-actions">{ticket.playerId === snapshot.hostId && <button className="primary-action" onClick={() => send({ type: "rematch" })}>Rematch</button>}<button className="secondary-action" onClick={() => setShowBoard(true)}>Full leaderboard</button></div></div>}
			{showBoard && <div className="race-board-backdrop"><section className="race-board-dialog panel-chrome" role="dialog" aria-modal="true" aria-label="Full leaderboard"><div className="race-board-head"><h2>Full leaderboard</h2><button onClick={() => setShowBoard(false)}>Close</button></div><label>Find captain<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name" /></label><Leaderboard room={snapshot} ownId={ticket.playerId} filter={search} /></section></div>}
		</>}
	</section>
}

function RacePlay({ room, own, ticket, now, inputRef, onKeyDown, onOpenBoard, connected }: { room: RaceRoomSnapshot; own: RacePlayer; ticket: RaceTicket; now: number; inputRef: React.RefObject<HTMLInputElement | null>; onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void; onOpenBoard: () => void; connected: boolean }) {
	const ranked = room.players
	const ownRank = ranked.findIndex((player) => player.id === ticket.playerId) + 1
	const rivals = ranked.filter((player) => player.id !== ticket.playerId).sort((a, b) => Math.abs(a.cursor - own.cursor) - Math.abs(b.cursor - own.cursor)).slice(0, 5)
	const bins = Array.from({ length: 10 }, (_, index) => ranked.filter((player) => Math.min(9, Math.floor(progress(player, room.text) * 10)) === index).length)
	const nearby = ranked.filter((_, index) => index === 0 || Math.abs(index + 1 - ownRank) <= 2 || ranked[index]?.id === ticket.playerId).slice(0, 6)
	const remaining = Math.max(0, Math.ceil(((room.endsAt ?? now) - now) / 1000))
	return <div className="race-play" data-testid="race-play">
		<div className="race-main">
			<div className="race-stage panel-chrome" aria-label="Ocean race visualization">
				<div className="race-horizon" /><div className="race-buoy">FINISH</div>
				{rivals.map((player, index) => <div key={player.id} className={`race-boat rival rival-${index}`} style={{ left: `${Math.max(5, Math.min(91, 42 + (progress(player, room.text) - progress(own, room.text)) * 350))}%` }}><img src={boatAsset} alt="" /><span>{player.name}</span></div>)}
				<div className="race-boat self" style={{ left: "42%" }}><img src={boatAsset} alt="" /><span>YOU · {Math.round(progress(own, room.text) * 100)}%</span></div>
			</div>
			<div className="race-type panel-chrome"><div className="race-type-top"><strong>{ownRank}/{ranked.length} · {Math.round(progress(own, room.text) * 100)}%</strong><span>{room.config.format === "time" ? `Time ${remaining}s` : `Safety timer ${remaining}s`} · Accuracy {raceAccuracy(own)}% · Typos {own.errors}{room.config.variant !== "classic" ? ` · Lives ${own.lives}` : ""}</span></div><p className="race-passage" data-testid="race-passage"><span className="correct">{room.text.slice(0, own.cursor)}</span><mark>{room.text[own.cursor] ?? ""}</mark>{room.text.slice(own.cursor + 1)}</p><label className="race-input-label">{own.status === "out" ? "You are out. Watch the remaining captains." : own.status === "finished" ? "Finished. Waiting for the others." : "Type here to sail"}<input ref={inputRef} aria-label="Race typing input" onKeyDown={onKeyDown} onPaste={(event) => event.preventDefault()} autoComplete="off" spellCheck={false} disabled={own.status !== "racing" || !connected} value="" onChange={() => {}} placeholder={connected ? "Your keyboard moves the boat" : "Reconnecting…"} /></label></div>
		</div>
		<aside className="race-side panel-chrome"><div className="race-side-head"><h2>Fleet</h2><button onClick={onOpenBoard}>Full leaderboard</button></div><p>Your position follows server validated characters. The stage shows nearby boats.</p><ol className="race-nearby">{nearby.map((player) => <li key={player.id} className={player.id === ticket.playerId ? "you" : ""}><span>#{ranked.indexOf(player) + 1} {player.name}</span><strong>{Math.round(progress(player, room.text) * 100)}%</strong></li>)}</ol><h3>Fleet map</h3><div className="race-minimap" aria-label="Fleet distribution by progress">{bins.map((count, index) => <div key={index} title={`${index * 10}–${index * 10 + 10}%: ${count} players`}><i style={{ height: `${Math.max(8, Math.min(100, count / Math.max(1, ranked.length) * 350))}%` }} /><span>{count || ""}</span></div>)}</div><small>0% → 100% · You: {Math.round(progress(own, room.text) * 100)}%</small></aside>
	</div>
}

function Leaderboard({ room, ownId, filter = "" }: { room: RaceRoomSnapshot; ownId: string; filter?: string }) {
	return <ol className="race-leaderboard">{room.players.filter((player) => player.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())).map((player) => <li key={player.id} className={player.id === ownId ? "you" : ""}><span>#{room.players.indexOf(player) + 1}</span><strong>{player.name}{player.id === ownId ? " · You" : ""}</strong><span>{Math.round(progress(player, room.text) * 100)}%</span><span>{raceAccuracy(player)}%</span><em>{player.status}</em></li>)}</ol>
}
