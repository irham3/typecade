/**
 * Streams long tracks through <audio> elements (constant, small memory, unlike decoding a
 * 4-minute song into a ~60 MB AudioBuffer). Two decks crossfade between tracks; an optional
 * low-pass "muffle" sits on the output for menus and drafts. Everything is released on dispose.
 */
export class StreamingDeck {
  private readonly decks: Array<{ element: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode }>
  private readonly filter: BiquadFilterNode
  private readonly output: GainNode
  private current = 0
  private url: string | null = null
  private playing = false
  private muffled = false
  private fadeTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly ctx: AudioContext, destination: AudioNode, private readonly fadeSeconds = 1.6) {
    this.output = ctx.createGain()
    this.filter = ctx.createBiquadFilter()
    this.filter.type = "lowpass"; this.filter.frequency.value = 20000
    this.filter.connect(this.output); this.output.connect(destination)
    this.decks = [0, 1].map(() => {
      const element = new Audio()
      element.preload = "none"; element.crossOrigin = "anonymous"
      const source = ctx.createMediaElementSource(element), gain = ctx.createGain()
      gain.gain.value = 0
      source.connect(gain).connect(this.filter)
      return { element, source, gain }
    })
  }

  /** Crossfades to `url` (no-op if already playing it). `loop` false plays once (stingers). */
  setTrack(url: string | null, loop = true) {
    if (url === this.url) return
    this.url = url
    const now = this.ctx.currentTime, previous = this.decks[this.current]!
    previous.gain.gain.cancelScheduledValues(now)
    previous.gain.gain.setTargetAtTime(0, now, this.fadeSeconds / 4)
    const outgoing = previous.element
    if (this.fadeTimer !== null) clearTimeout(this.fadeTimer)
    this.fadeTimer = setTimeout(() => {
      this.fadeTimer = null
      if (this.decks[this.current]!.element !== outgoing) outgoing.pause()
    }, this.fadeSeconds * 1000 + 200)
    if (!url) return
    this.current = 1 - this.current
    const next = this.decks[this.current]!
    next.element.src = url; next.element.loop = loop; next.element.currentTime = 0
    next.gain.gain.cancelScheduledValues(now)
    next.gain.gain.setValueAtTime(0, now)
    next.gain.gain.setTargetAtTime(1, now, this.fadeSeconds / 4)
    if (this.playing) void next.element.play().catch(() => { /* autoplay blocked until the next gesture */ })
  }

  setVolume(volume: number) { this.output.gain.setTargetAtTime(volume, this.ctx.currentTime, .2) }

  /** Low-pass the music (menus, drafts) without stopping it. */
  setMuffled(muffled: boolean) {
    // Only schedule on change: repeated automation calls would grow the AudioParam event list.
    if (muffled === this.muffled) return
    this.muffled = muffled
    this.filter.frequency.cancelScheduledValues(this.ctx.currentTime)
    this.filter.frequency.setTargetAtTime(muffled ? 900 : 20000, this.ctx.currentTime, .25)
  }

  resume() {
    this.playing = true
    const deck = this.decks[this.current]!
    if (this.url && deck.element.paused) void deck.element.play().catch(() => { /* retried on the next gesture */ })
  }

  pause() {
    this.playing = false
    if (this.fadeTimer !== null) { clearTimeout(this.fadeTimer); this.fadeTimer = null }
    for (const deck of this.decks) deck.element.pause()
  }

  dispose() {
    this.pause()
    for (const deck of this.decks) {
      deck.element.removeAttribute("src"); deck.element.load()
      deck.source.disconnect(); deck.gain.disconnect()
    }
    this.filter.disconnect(); this.output.disconnect()
    this.url = null
  }
}
