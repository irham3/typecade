export class DungeonAudio {
 private context: AudioContext | null = null
 private voices = new Set<OscillatorNode>()
 volume = .28
 unlock() {
  if(!this.volume)return
  try { this.context ??= new AudioContext(); void this.context.resume().catch(() => {}) } catch { /* Audio is optional when the browser has no device. */ }
 }
 play(kind: string) {
  const ctx = this.context
  if (!ctx || ctx.state !== "running" || !this.volume || this.voices.size >= 8) return
  const note = kind === "hit" ? 110 : kind === "storm" ? 180 : kind === "heal" ? 660 : kind === "pickup" ? 880 : kind === "shatter" ? 270 : kind === "tick" ? 720 : 360
  const oscillator = ctx.createOscillator(), gain = ctx.createGain()
  oscillator.type = kind === "tick" ? "sine" : "triangle"
  oscillator.frequency.setValueAtTime(note, ctx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(Math.max(50, note * (kind === "pickup" ? 1.7 : .5)), ctx.currentTime + .10)
  gain.gain.setValueAtTime(this.volume * (kind === "tick" ? .08 : .25), ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .12)
  oscillator.connect(gain); gain.connect(ctx.destination); this.voices.add(oscillator)
  oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect() }
  oscillator.start(); oscillator.stop(ctx.currentTime + .13)
 }
 suspend() { if (this.context?.state === "running") void this.context.suspend().catch(() => {}) }
 dispose() { for (const voice of this.voices) { voice.onended = null; voice.stop(); voice.disconnect() }; this.voices.clear(); if (this.context) void this.context.close().catch(() => {}); this.context = null }
}
