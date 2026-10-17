import { sampleGroups, type SampleGroup } from "./assetManifest"

export interface SamplePlay { gain?: number; pan?: number; rate?: number; delay?: number }

/** Max simultaneous voices per group, so a horde dying at once does not stack 40 identical hits. */
const PER_GROUP_LIMIT = 4
const LOAD_CONCURRENCY = 6

/**
 * Short recorded one-shots. Buffers are fetched and decoded once (about 0.7 MB of OGG), then
 * shared; each play creates a tiny source → gain → panner chain that disconnects itself on end.
 */
export class SampleBank {
  private readonly buffers = new Map<string, AudioBuffer>()
  private readonly active = new Map<SampleGroup, number>()
  private readonly live = new Set<AudioBufferSourceNode>()
  private aborted = false

  constructor(private readonly ctx: AudioContext, private readonly destination: AudioNode) {}

  /** Starts background loading; plays before a buffer is ready are skipped (synth layers still sound). */
  async load(): Promise<void> {
    const urls = [...new Set(Object.values(sampleGroups).flat())]
    for (let i = 0; i < urls.length && !this.aborted; i += LOAD_CONCURRENCY) {
      await Promise.all(urls.slice(i, i + LOAD_CONCURRENCY).map(url => this.fetchOne(url)))
    }
  }

  get ready() { return this.buffers.size > 0 }

  play(group: SampleGroup, { gain = 1, pan = 0, rate = 1, delay = 0 }: SamplePlay = {}) {
    if (this.aborted || (this.active.get(group) ?? 0) >= PER_GROUP_LIMIT) return
    const options = sampleGroups[group].filter(url => this.buffers.has(url))
    if (!options.length) return
    const buffer = this.buffers.get(options[Math.floor(Math.random() * options.length)]!)!
    const source = this.ctx.createBufferSource(), level = this.ctx.createGain(), panner = this.ctx.createStereoPanner()
    source.buffer = buffer
    // Small pitch jitter keeps rapid repeats from sounding like a machine gun.
    source.playbackRate.value = rate * (.94 + Math.random() * .12)
    level.gain.value = gain
    panner.pan.value = Math.max(-.8, Math.min(.8, pan))
    source.connect(level).connect(panner).connect(this.destination)
    this.active.set(group, (this.active.get(group) ?? 0) + 1)
    this.live.add(source)
    source.onended = () => {
      this.live.delete(source)
      this.active.set(group, Math.max(0, (this.active.get(group) ?? 1) - 1))
      source.disconnect(); level.disconnect(); panner.disconnect()
    }
    source.start(this.ctx.currentTime + delay)
  }

  /** Stops every playing voice (pause/hide); buffers stay cached. */
  stopAll() { for (const source of [...this.live]) { try { source.stop() } catch { /* already ended */ } } }

  dispose() {
    this.aborted = true
    this.stopAll()
    this.buffers.clear()
    this.active.clear()
  }

  private async fetchOne(url: string) {
    try {
      const response = await fetch(url)
      if (!response.ok || this.aborted) return
      this.buffers.set(url, await this.ctx.decodeAudioData(await response.arrayBuffer()))
    } catch {
      // A missing or undecodable sample leaves that variant out; the synth layer still plays.
    }
  }
}
