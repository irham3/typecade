let ctx: AudioContext | null = null
let volume = 0.5
let muted = false

function ac(): AudioContext {
	if (!ctx) ctx = new AudioContext()
	if (ctx.state === "suspended") void ctx.resume()
	return ctx
}

function tone(freq: number, type: OscillatorType, durMs: number, peak = 0.25, slideTo?: number) {
	if (muted || volume === 0) return
	const a = ac()
	const osc = a.createOscillator()
	const g = a.createGain()
	osc.type = type
	osc.frequency.setValueAtTime(freq, a.currentTime)
	if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + durMs / 1000)
	g.gain.setValueAtTime(peak * volume, a.currentTime)
	g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + durMs / 1000)
	osc.connect(g).connect(a.destination)
	osc.start()
	osc.stop(a.currentTime + durMs / 1000 + 0.02)
}

export const sfx = {
	// keystroke: short high square click, slight random detune so it never sounds robotic
	click() { tone(1800 + Math.random() * 400, "square", 30, 0.06) },
	// clean word: sine blip, pitch steps up with combo (resets each octave)
	blip(comboStep: number) { tone(440 * Math.pow(2, (comboStep % 12) / 12), "sine", 90, 0.18) },
	// typo: sawtooth sliding down
	error() { tone(220, "sawtooth", 160, 0.22, 110) },
	// mult up: triangle, higher with each mult
	multUp(mult: number) { tone(660 + mult * 60, "triangle", 120, 0.2) },
	// stage clear: rising 4-note square arpeggio (C5 E5 G5 C6)
	stageClear() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, "square", 110, 0.18), i * 90)) },
	// run over: falling sawtooth notes
	runOver() { [392, 311, 262, 196].forEach((f, i) => setTimeout(() => tone(f, "sawtooth", 180, 0.18), i * 140)) },
	setVolume(v: number) { volume = Math.max(0, Math.min(1, v)) },
	setMuted(m: boolean) { muted = m },
}
