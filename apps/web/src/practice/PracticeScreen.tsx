import { useCallback, useEffect, useRef, useState } from "react"
import { defaultRaceConfig, generateRaceText, parseRaceConfig, type RaceConfig } from "@typecade/race-rules"
import { TypingSession, type TypingSessionSnapshot } from "@typecade/typing-engine"
import { TypingInput, TypingPassage } from "../TypingField"
import { readStorage, writeStorage } from "../storage"

type PracticePhase = "setup" | "racing" | "finished" | "out"

const bestKey = "typecade:practice:best"

function storedBestWpm(): number {
	const value = Number(readStorage("localStorage", bestKey))
	return Number.isFinite(value) && value >= 0 ? value : 0
}

function recordBestWpm(run: TypingSessionSnapshot): number {
	const stored = storedBestWpm()
	const best = Math.max(stored, run.metrics.wpm)
	if (best > stored) writeStorage("localStorage", bestKey, String(best))
	return best
}

export function PracticeScreen({ onBack }: { onBack: () => void }) {
	const [config, setConfig] = useState<RaceConfig>({ ...defaultRaceConfig })
	const [phase, setPhase] = useState<PracticePhase>("setup")
	const [passage, setPassage] = useState("")
	const [snapshot, setSnapshot] = useState<TypingSessionSnapshot | null>(null)
	const [remaining, setRemaining] = useState(0)
	const [lives, setLives] = useState(3)
	const [error, setError] = useState("")
	const [fontSize, setFontSize] = useState(28)
	const [monospace, setMonospace] = useState(false)
	const [bestWpm, setBestWpm] = useState(storedBestWpm)
	const session = useRef<TypingSession | null>(null)
	const sessionEnded = useRef(false)
	const endAt = useRef(0)

	const start = (event: React.SyntheticEvent) => {
		event.preventDefault()
		try {
			const rules = parseRaceConfig(config)
			const text = generateRaceText(rules, `${Date.now()}:practice`)
			setError("")
			setPassage(text)
			session.current = new TypingSession(text)
			sessionEnded.current = false
			setSnapshot(session.current.getSnapshot())
			setLives(rules.variant === "perfect" ? 1 : 3)
			setRemaining(rules.format === "time" ? rules.timeSeconds : 0)
			endAt.current = 0
			setPhase("racing")
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Check the practice settings.")
		}
	}

	const finishTimedSession = useCallback(() => {
		sessionEnded.current = true
		const final = session.current!.getSnapshot(config.timeSeconds * 1000)
		setSnapshot(final)
		setRemaining(0)
		setBestWpm(recordBestWpm(final))
		setPhase("finished")
	}, [config.timeSeconds])

	useEffect(() => {
		if (phase !== "racing" || config.format !== "time") return
		const update = () => {
			if (!endAt.current) return
			const seconds = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
			setRemaining(seconds)
			if (seconds === 0) finishTimedSession()
		}
		const interval = window.setInterval(update, 100)
		return () => window.clearInterval(interval)
	}, [config.format, finishTimedSession, phase])

	const typeKey = (key: string) => {
		if (sessionEnded.current || key === "Backspace") return
		if (!endAt.current) endAt.current = Date.now() + config.timeSeconds * 1000
		const active = session.current!
		if (config.format === "time" && Date.now() >= endAt.current) {
			finishTimedSession()
			return
		}
		const events = active.processKey(key, Date.now() - (endAt.current - config.timeSeconds * 1000))
		const next = active.getSnapshot()
		setSnapshot(next)
		if (events.some((item) => item.type === "typo")) {
			if (config.variant === "perfect") { sessionEnded.current = true; setLives(0); setPhase("out") }
			if (config.variant === "three-hulls") {
				const nextLives = Math.max(0, 3 - next.metrics.incorrectKeystrokes)
				setLives(nextLives)
				if (nextLives === 0) { sessionEnded.current = true; setPhase("out") }
			}
		}
		if (next.complete) {
			sessionEnded.current = true
			setBestWpm(recordBestWpm(next))
			setPhase("finished")
		}
	}

	const updateConfig = <K extends keyof RaceConfig>(key: K, value: RaceConfig[K]) => setConfig((current) => ({ ...current, [key]: value }))
	const currentText = snapshot?.targetText ?? passage
	const cursor = snapshot?.cursor ?? 0

	return (
		<main className="practice-screen" data-testid="practice-screen">
			<header className="practice-header pixel-panel">
				<button className="pixel-action secondary" onClick={onBack}>Main menu</button>
				<div><small>TYPECADE · COASTAL PRACTICE</small><h1>Practice</h1></div>
				{phase === "racing" ? <strong className="practice-clock" aria-live="polite">{config.format === "time" ? `${remaining}s` : `${Math.round((snapshot?.metrics.progress ?? 0) * 100)}%`}</strong> : <span className="practice-best">Best {bestWpm} WPM</span>}
			</header>

			{phase === "setup" ? (
				<form className="practice-config pixel-panel" onSubmit={start}>
					<div className="practice-config-heading"><div><small>BUILD A SESSION</small><h2>Typing settings</h2></div><span>Rules can change between sessions.</span></div>
					<div className="practice-config-grid">
						<label>Language<select aria-label="Practice language" value={config.language} onChange={(e) => updateConfig("language", e.target.value as RaceConfig["language"])}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></label>
						<label>Text format<select aria-label="Practice text format" value={config.format} onChange={(e) => updateConfig("format", e.target.value as RaceConfig["format"])}><option value="words">Words</option><option value="time">Time</option><option value="quote">Quote</option><option value="custom">Custom text</option></select></label>
						{config.format === "words" && <label>Word count<input aria-label="Practice word count" type="number" min="1" max="1000" value={config.wordCount} onChange={(e) => updateConfig("wordCount", Number(e.target.value))} /></label>}
						{config.format === "time" && <label>Duration in seconds<input aria-label="Practice duration" type="number" min="1" max="3600" value={config.timeSeconds} onChange={(e) => updateConfig("timeSeconds", Number(e.target.value))} /></label>}
						{config.format === "quote" && <label>Quote difficulty<select aria-label="Quote difficulty" value={config.difficulty} onChange={(e) => updateConfig("difficulty", e.target.value as RaceConfig["difficulty"])}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>}
						{config.format === "custom" && <label className="practice-wide">Custom passage<textarea aria-label="Custom passage" maxLength={5000} value={config.customText} onChange={(e) => updateConfig("customText", e.target.value)} placeholder="Paste or write a passage to practice" /></label>}
						{(config.format === "words" || config.format === "time") && <div className="practice-options practice-wide">
							<label className="pixel-check"><input type="checkbox" checked={config.punctuation} onChange={(e) => updateConfig("punctuation", e.target.checked)} /> Punctuation</label>
							<label className="pixel-check"><input type="checkbox" checked={config.numbers} onChange={(e) => updateConfig("numbers", e.target.checked)} /> Numbers</label>
						</div>}
						{config.format === "custom" && <label className="pixel-check practice-wide"><input type="checkbox" checked={config.shuffle} onChange={(e) => updateConfig("shuffle", e.target.checked)} /> Shuffle words</label>}
						<label>Challenge<select aria-label="Practice challenge" value={config.variant} onChange={(e) => updateConfig("variant", e.target.value as RaceConfig["variant"])}><option value="classic">Classic Current</option><option value="perfect">Perfect Tide · first typo ends run</option><option value="three-hulls">Three Hulls · three mistakes</option></select></label>
						<label>Text size <span>{fontSize}px</span><input aria-label="Text size" type="range" min="20" max="40" step="2" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} /></label>
						<label className="pixel-check"><input type="checkbox" checked={monospace} onChange={(e) => setMonospace(e.target.checked)} /> Monospace text</label>
					</div>
					{error && <p className="practice-error" role="alert">{error}</p>}
					<footer><span>Text and challenge settings are saved for this session only.</span><button className="pixel-action primary" type="submit">Start practice</button></footer>
				</form>
			) : phase === "racing" ? (
				<section className="practice-racing pixel-panel" data-testid="practice-racing">
					<div className="practice-run-meta"><span>{config.language === "id" ? "Bahasa Indonesia" : "English"} · {config.format} · {config.variant.replaceAll("-", " ")}</span>{config.variant !== "classic" && <span>{lives} hulls</span>}</div>
					<TypingPassage text={currentText} cursor={cursor} className="practice-passage" testId="practice-passage" fontSize={fontSize} monospace={monospace} mistake={snapshot?.eventLog.at(-1)?.ok === 0} />
					<TypingInput label="Practice typing input" onType={typeKey} onEscape={() => setPhase("setup")} />
					<p className="practice-focus-hint">Timer starts with your first key. After a typo, retype the highlighted character. Esc opens settings.</p>
					<button className="pixel-action secondary" onClick={() => setPhase("setup")}>Typing settings</button>
					<div className="practice-stats"><span><strong>{snapshot?.metrics.wpm ?? 0}</strong> WPM</span><span><strong>{snapshot?.metrics.accuracy ?? 100}%</strong> accuracy</span><span><strong>{snapshot?.metrics.maxCombo ?? 0}</strong> best streak</span></div>
				</section>
			) : (
				<section className="practice-result pixel-panel" data-testid="practice-result">
					<small>{phase === "out" ? "PRACTICE ENDED" : "SESSION COMPLETE"}</small>
					<h2>{phase === "out" ? config.variant === "perfect" ? "Perfect Tide broken" : "All hulls lost" : "Good run"}</h2>
					<div className="practice-result-stats"><strong>{snapshot!.metrics.wpm}<span>WPM</span></strong><strong>{snapshot!.metrics.accuracy}%<span>Accuracy</span></strong><strong>{snapshot!.metrics.consistency}%<span>Consistency</span></strong></div>
					<p>Best: {bestWpm} WPM</p>
					<div><button className="pixel-action primary" onClick={(e) => start(e)}>Practice again</button><button className="pixel-action secondary" onClick={() => setPhase("setup")}>Typing settings</button></div>
				</section>
			)}
		</main>
	)
}
