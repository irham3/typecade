/**
 * Medieval instrument models built from Web Audio nodes. Each call builds one note as a small
 * graph (a NoteGraph), then commits it to the host, which owns voice limits and cleanup.
 */
export interface VoiceHost {
  readonly ctx: AudioContext
  readonly noise: AudioBuffer
  /** Output node for the music bus. */
  readonly destination: AudioNode
  /** Registers a voice; returns false when the voice budget is spent (the note is then discarded). */
  adopt(source: AudioScheduledSourceNode, nodes: AudioNode[]): boolean
}

export type LeadInstrument = "lute" | "harp" | "horn" | "flute" | "bell" | "organ"
export type PadInstrument = "choir" | "strings" | "organ"
export type DrumSound = "war" | "tom" | "frame" | "anvil" | "shaker"
type EnvelopeShape = "pluck" | "pad" | "sustain" | "hit"

export const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

/** Collects every node and source of one note so they start, stop and clean up together. */
class NoteGraph {
  private readonly sources: AudioScheduledSourceNode[] = []
  private readonly nodes: AudioNode[] = []
  readonly output: GainNode

  constructor(private readonly host: VoiceHost, readonly at: number) {
    this.output = this.own(host.ctx.createGain())
  }

  own<T extends AudioNode>(node: T): T { this.nodes.push(node); return node }

  osc(type: OscillatorType, frequency: number): OscillatorNode {
    const voice = this.host.ctx.createOscillator()
    voice.type = type
    voice.frequency.setValueAtTime(frequency, this.at)
    this.sources.push(voice)
    return voice
  }

  noise(): AudioBufferSourceNode {
    const source = this.host.ctx.createBufferSource()
    source.buffer = this.host.noise; source.loop = true
    this.sources.push(source)
    return source
  }

  filter(type: BiquadFilterType, frequency: number, q = 1): BiquadFilterNode {
    const filter = this.own(this.host.ctx.createBiquadFilter())
    filter.type = type; filter.frequency.setValueAtTime(frequency, this.at); filter.Q.value = q
    return filter
  }

  gain(value: number): GainNode { const node = this.own(this.host.ctx.createGain()); node.gain.value = value; return node }

  /** Shapes: pluck (fast decay), pad (swell + release), sustain (hold), hit (percussive). */
  envelope(attack: number, duration: number, level: number, shape: EnvelopeShape): GainNode {
    const env = this.own(this.host.ctx.createGain()), peak = Math.max(.0002, level), at = this.at
    env.gain.setValueAtTime(.0001, at)
    env.gain.exponentialRampToValueAtTime(peak, at + attack)
    if (shape === "pad" || shape === "sustain") {
      env.gain.setValueAtTime(peak, at + Math.max(attack, duration * (shape === "pad" ? .7 : .8)))
      env.gain.exponentialRampToValueAtTime(.0001, at + duration + (shape === "pad" ? .35 : .08))
    } else env.gain.exponentialRampToValueAtTime(.0001, at + duration)
    return env
  }

  /** LFO on pitch for the given voices. */
  vibrato(voices: OscillatorNode[], rate: number, depthHz: number) {
    const lfo = this.osc("sine", rate), depth = this.gain(depthHz)
    lfo.connect(depth)
    for (const voice of voices) depth.connect(voice.frequency)
  }

  /** Pans, registers with the host and schedules every source. */
  commit(pan: number, stopAt: number) {
    const panner = this.own(this.host.ctx.createStereoPanner())
    panner.pan.value = Math.max(-.8, Math.min(.8, pan))
    this.output.connect(panner); panner.connect(this.host.destination)
    if (!this.host.adopt(this.sources[0]!, [...this.sources, ...this.nodes])) {
      for (const node of [...this.sources, ...this.nodes]) node.disconnect()
      return
    }
    for (const source of this.sources) { source.start(this.at); source.stop(stopAt) }
  }
}

export class Orchestra {
  constructor(private readonly host: VoiceHost) {}

  /** Plucked string (lute, harp): bright attack that darkens quickly via a closing low-pass. */
  pluck(midi: number, at: number, duration: number, level: number, pan = 0, brightness = 1) {
    const note = new NoteGraph(this.host, at), f = midiToHz(midi)
    const filter = note.filter("lowpass", Math.min(9000, f * 9 * brightness), 3)
    filter.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.4), at + duration * .5)
    note.osc("sawtooth", f).connect(filter)
    note.osc("triangle", f * 1.003).connect(filter)
    filter.connect(note.envelope(.004, duration, level, "pluck")).connect(note.output)
    note.commit(pan, at + duration)
  }

  /** Sung "ah": detuned saws through two vowel formants, slow swell and gentle vibrato. */
  choir(midis: readonly number[], at: number, duration: number, level: number) {
    midis.forEach((midi, index) => {
      const note = new NoteGraph(this.host, at), f = midiToHz(midi)
      const voices = [-7, 0, 6].map(cents => note.osc("sawtooth", f * 2 ** (cents / 1200)))
      note.vibrato(voices, 4.6 + index * .3, f * .006)
      const mix = note.gain(.33), first = note.filter("bandpass", 700, 4), second = note.filter("bandpass", 1150, 6)
      const env = note.envelope(Math.min(.5, duration * .35), duration, level, "pad")
      for (const voice of voices) voice.connect(mix)
      mix.connect(first).connect(env); mix.connect(second).connect(env)
      env.connect(note.output)
      note.commit((index - 1) * .35, at + duration + .4)
    })
  }

  /** Bowed low strings: detuned saws, soft low-pass and a slow bow attack. */
  strings(midi: number, at: number, duration: number, level: number, pan = 0) {
    const note = new NoteGraph(this.host, at), f = midiToHz(midi)
    const filter = note.filter("lowpass", Math.min(2400, f * 5), .7)
    for (const cents of [-5, 5]) note.osc("sawtooth", f * 2 ** (cents / 1200)).connect(filter)
    filter.connect(note.envelope(Math.min(.25, duration * .3), duration, level, "pad")).connect(note.output)
    note.commit(pan, at + duration + .4)
  }

  /** Brass horn: the filter opens on the attack (the "blat"), light vibrato on held notes. */
  horn(midi: number, at: number, duration: number, level: number, pan = 0) {
    const note = new NoteGraph(this.host, at), f = midiToHz(midi)
    const voice = note.osc("sawtooth", f)
    note.vibrato([voice], 5.2, f * .004)
    const filter = note.filter("lowpass", f * 1.2, 1.2)
    filter.frequency.linearRampToValueAtTime(f * 6, at + .07)
    filter.frequency.exponentialRampToValueAtTime(f * 3.2, at + .3)
    voice.connect(filter).connect(note.envelope(.06, duration, level, "sustain")).connect(note.output)
    note.commit(pan, at + duration + .1)
  }

  /** Wooden flute: sine with a soft octave, breath noise and vibrato. */
  flute(midi: number, at: number, duration: number, level: number, pan = 0) {
    const note = new NoteGraph(this.host, at), f = midiToHz(midi)
    const env = note.envelope(.05, duration, level, "sustain")
    const tone = note.osc("sine", f)
    note.vibrato([tone], 5, f * .005)
    tone.connect(env)
    note.osc("sine", f * 2).connect(note.gain(.18)).connect(env)
    note.noise().connect(note.filter("bandpass", f * 2, 2)).connect(note.gain(.12)).connect(env)
    env.connect(note.output)
    note.commit(pan, at + duration + .1)
  }

  /** Crypt bell: inharmonic partials with long, staggered decays. */
  bell(midi: number, at: number, level: number, pan = 0) {
    const note = new NoteGraph(this.host, at), f = midiToHz(midi)
    for (const [ratio, gain, decay] of [[1, 1, 3.2], [2.76, .5, 2], [5.4, .3, 1.2], [8.93, .15, .7]] as const) {
      note.osc("sine", f * ratio).connect(note.envelope(.005, decay, gain * level, "hit")).connect(note.output)
    }
    note.commit(pan, at + 3.3)
  }

  /** Pipe organ chord: drawbar sines (8', 4', 2') with slow tremolo. */
  organ(midis: readonly number[], at: number, duration: number, level: number) {
    const note = new NoteGraph(this.host, at)
    const voices = midis.flatMap(midi => [1, 2, 4].map(mult => note.osc("sine", midiToHz(midi) * mult)))
    const mix = note.gain(1 / voices.length)
    const tremolo = note.osc("sine", 5.5), depth = note.gain(.12)
    tremolo.connect(depth); depth.connect(mix.gain)
    for (const voice of voices) voice.connect(mix)
    mix.connect(note.envelope(.12, duration, level, "pad")).connect(note.output)
    note.commit(0, at + duration + .4)
  }

  /** Percussion kit: taiko war drum, tom, frame drum, anvil clank, shaker. */
  drum(kind: DrumSound, at: number, level: number, pan = 0) {
    const note = new NoteGraph(this.host, at)
    if (kind === "war" || kind === "tom") {
      const [start, end, length] = kind === "war" ? [95, 42, .7] : [190, 95, .32]
      const body = note.osc("sine", start)
      body.frequency.exponentialRampToValueAtTime(end, at + length * .6)
      body.connect(note.envelope(.002, length, level, "hit")).connect(note.output)
      note.noise().connect(note.filter("lowpass", kind === "war" ? 260 : 900)).connect(note.envelope(.002, .05, level * .5, "hit")).connect(note.output)
      note.commit(pan, at + length + .05)
      return
    }
    if (kind === "anvil") {
      const filter = note.filter("bandpass", 2200, 3)
      for (const f of [1180, 1795, 2710]) note.osc("square", f).connect(filter)
      filter.connect(note.envelope(.001, .4, level * .5, "hit")).connect(note.output)
      note.commit(pan, at + .45)
      return
    }
    const frame = kind === "frame"
    note.noise().connect(note.filter(frame ? "bandpass" : "highpass", frame ? 700 : 7000)).connect(note.envelope(.002, frame ? .12 : .05, level, "hit")).connect(note.output)
    note.commit(pan, at + .2)
  }
}
