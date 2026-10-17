import { sfxRecipes, hasSfxRecipe } from "./audio/sfxRecipes"
import { Orchestra, type VoiceHost } from "./audio/instruments"
import { createStoneHall } from "./audio/reverb"
import { playScoreStep } from "./audio/score"
import { ambienceTrack, musicTracks, type MusicTrackId } from "./audio/assetManifest"
import { SampleBank } from "./audio/SampleBank"
import { StreamingDeck } from "./audio/StreamingDeck"
import { deathSample, eventSamples } from "./audio/sampleCues"
import type { EnemyKind } from "@typecade/contracts"
import { mixLevels } from "./audio/mixLevels"
import { bossTrack, depthTracks, titleTrack, type MusicTrack } from "./audio/musicTracks"

/** Optional shaping for a single synth voice. */
export interface VoiceShape { attack?: number; vibratoRate?: number; vibratoDepth?: number; delay?: number }

/** Minimum time battle music holds after the last surge or pressure peak. */
const BATTLE_HOLD_SECONDS = 20

type Mood = "title" | "dojo" | "arena" | "draft" | "dead" | "paused"
type Bus = "music" | "effects" | "ambience"
type Voice = { source: AudioScheduledSourceNode; nodes: AudioNode[]; bus: Bus; priority: number }
export interface DungeonSoundscape { mood: Mood; pressure?: number; critical?: boolean; boss?: boolean; depth?: number; surge?: boolean }
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

/** Original D-minor score, synthesized locally; the audio clock owns its beat grid. */
export class DungeonAudio {
 private context: AudioContext | null = null
 private master: GainNode | null = null
 private buses: Partial<Record<Bus, GainNode>> = {}
 private duck: GainNode | null = null
 private compressor: DynamicsCompressorNode | null = null
 private noise: AudioBuffer | null = null
 private voices = new Set<Voice>()
 private timer: ReturnType<typeof setInterval> | null = null
 private scene: DungeonSoundscape = { mood: "title" }
 private visible = true
 private disposed = false
 private resuming = false
 private masterVolume: number = mixLevels.defaultVolume
 private limiter: DynamicsCompressorNode | null = null
 private orchestra: Orchestra | null = null
 private reverbNodes: AudioNode[] = []
 /** Recorded music and room tone (streamed) plus recorded one-shots; synthesis stays as the fallback and the magic layer. */
 private musicDeck: StreamingDeck | null = null
 private ambienceDeck: StreamingDeck | null = null
 private samples: SampleBank | null = null
 private recordedMusic: GainNode | null = null
 private musicTrack: MusicTrackId | null = null
 private battleSince = -100
 private musicVolume = .85
 private effectsVolume = 1
 private nextBeat = 0
 private step = 0
 private variation = 0
 private cooldowns = new Map<string, number>()
 private intensity = 0
 /** Theme currently playing; changes are deferred to the next 8-bar phrase so they never cut mid-melody. */
 private track: MusicTrack = titleTrack
 get volume() { return this.masterVolume }
 set volume(value: number) { this.setMix(value, this.musicVolume, this.effectsVolume) }
 setMix(volume: number, music = .85, effects = 1) {
  this.masterVolume = this.clamp(volume); this.musicVolume = this.clamp(music); this.effectsVolume = this.clamp(effects)
  if (this.context && this.master) {
   const now = this.context.currentTime
   this.master.gain.setTargetAtTime(this.masterVolume * mixLevels.masterGain, now, .04)
   this.buses.effects!.gain.setTargetAtTime(this.effectsVolume * mixLevels.effectsBus, now, .04)
   this.buses.music!.gain.setTargetAtTime(this.musicVolume * mixLevels.musicBus, now, .15)
   this.buses.ambience!.gain.setTargetAtTime(this.musicVolume * mixLevels.ambienceBus, now, .2)
   this.recordedMusic?.gain.setTargetAtTime(this.musicVolume * mixLevels.recordedMusic, now, .15)
  }
  this.transport()
 }
 private clamp(value: number) { return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0 }
 unlock() {
  if (this.disposed || !this.masterVolume || !this.visible || this.scene.mood === "paused") return
  try {
   if (!this.context) {
    const ctx = this.context = new AudioContext({ latencyHint: "interactive" })
    this.master = ctx.createGain(); this.master.gain.value = this.masterVolume * mixLevels.masterGain
    // Glue compressor then limiter: loud enough to hear over the horde, never clipping when hits stack.
    this.compressor = this.dynamics(ctx, mixLevels.glue)
    this.limiter = this.dynamics(ctx, mixLevels.limiter)
    this.master.connect(this.compressor); this.compressor.connect(this.limiter); this.limiter.connect(ctx.destination)
    this.duck = ctx.createGain(); this.duck.connect(this.master)
    for (const bus of ["music", "effects", "ambience"] as const) {
     const node = this.buses[bus] = ctx.createGain()
     node.gain.value = bus === "effects" ? this.effectsVolume * mixLevels.effectsBus : this.musicVolume * (bus === "music" ? mixLevels.musicBus : mixLevels.ambienceBus)
     node.connect(bus === "effects" ? this.master : this.duck)
    }
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    let seed = 7321
    for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1 }
    this.connectStoneHall(ctx)
    this.orchestra = new Orchestra(this.voiceHost(ctx))
    this.connectRecordings(ctx)
   }
   this.transport()
  } catch { this.dispose() /* Audio is optional when the browser has no device. */ }
 }
 private dynamics(ctx: AudioContext, settings: { threshold: number; knee: number; ratio: number; attack: number; release: number }) {
  const node = ctx.createDynamicsCompressor()
  node.threshold.value = settings.threshold; node.knee.value = settings.knee; node.ratio.value = settings.ratio
  node.attack.value = settings.attack; node.release.value = settings.release
  return node
 }
 /** Recorded music skips the hall reverb (it carries its own room); room tone rides the ambience bus. */
 private connectRecordings(ctx: AudioContext) {
  this.recordedMusic = ctx.createGain()
  this.recordedMusic.gain.value = this.musicVolume * mixLevels.recordedMusic
  this.recordedMusic.connect(this.duck!)
  this.musicDeck = new StreamingDeck(ctx, this.recordedMusic)
  this.ambienceDeck = new StreamingDeck(ctx, this.buses.ambience!, 3)
  this.ambienceDeck.setVolume(mixLevels.roomTone)
  this.samples = new SampleBank(ctx, this.buses.effects!)
  void this.samples.load()
 }
 /** Picks the recorded track for the scene. Battle music needs a surge or high pressure, and holds for 20 s to avoid flip-flopping. */
 private syncRecordings() {
  const ctx = this.context, deck = this.musicDeck
  if (!ctx || !deck) return
  const { mood, boss, surge } = this.scene
  let track: MusicTrackId | null
  if (mood === "title" || mood === "dojo") track = "menu"
  else if (mood === "dead") track = "defeat"
  else if (boss) track = "boss"
  else if (surge || this.intensity > .8) { track = "battle"; this.battleSince = ctx.currentTime }
  else track = this.musicTrack === "battle" && ctx.currentTime - this.battleSince < BATTLE_HOLD_SECONDS ? "battle" : "dungeon"
  if (track !== this.musicTrack) { this.musicTrack = track; deck.setTrack(track ? musicTracks[track] : null, track !== "defeat") }
  deck.setMuffled(mood === "draft" || mood === "paused")
  this.ambienceDeck?.setTrack(mood === "title" ? null : ambienceTrack)
 }
 /** Music and a little of the effects feed a stone-hall convolution reverb that returns to the master. */
 private connectStoneHall(ctx: AudioContext) {
  const hall = createStoneHall(ctx), musicSend = ctx.createGain(), effectsSend = ctx.createGain(), wet = ctx.createGain()
  musicSend.gain.value = mixLevels.hallSend.music; effectsSend.gain.value = mixLevels.hallSend.effects; wet.gain.value = mixLevels.hallSend.return
  this.buses.music!.connect(musicSend); this.buses.effects!.connect(effectsSend)
  musicSend.connect(hall); effectsSend.connect(hall); hall.connect(wet); wet.connect(this.master!)
  this.reverbNodes = [hall, musicSend, effectsSend, wet]
 }
 /** Lets instrument graphs share the music bus voice budget and cleanup. */
 private voiceHost(ctx: AudioContext): VoiceHost {
  const music = this.buses.music!
  return {
   ctx, noise: this.noise!, destination: music,
   adopt: (source, nodes) => {
    if (!this.musicVolume || this.scene.mood === "paused" || this.voices.size >= 56 || [...this.voices].filter(v => v.bus === "music").length >= mixLevels.musicVoices) return false
    const voice: Voice = { source, nodes, bus: "music", priority: 0 }
    this.voices.add(voice)
    source.onended = () => this.release(voice)
    return true
   },
  }
 }
 setScene(scene: DungeonSoundscape) {
  const previous = this.scene
  this.scene = scene
  this.transport()
  if (scene.mood === "dead" && previous.mood !== "dead") this.play("defeat")
  else if (scene.boss && !previous.boss && scene.mood === "arena") this.play("boss")
  else if (scene.critical && !previous.critical && scene.mood === "arena") this.play("warning")
 }
 setVisible(visible: boolean) { this.visible = visible; this.transport() }
 private transport() {
  const ctx = this.context
  if (!ctx || this.disposed) return
  if (!this.visible || !this.masterVolume || (!this.musicVolume && !this.effectsVolume) || this.scene.mood === "paused") { this.suspend(); return }
  this.syncRecordings(); this.musicDeck?.resume(); this.ambienceDeck?.resume()
  if (ctx.state === "suspended" && !this.resuming) { this.resuming = true; void ctx.resume().catch(() => {}).finally(() => { this.resuming = false; if (this.context === ctx && (!this.visible || !this.masterVolume || (!this.musicVolume && !this.effectsVolume) || this.scene.mood === "paused")) this.suspend() }) }
  if (this.scene.mood === "dead") {
   if (this.timer !== null) clearInterval(this.timer)
   this.timer = null
   for (const voice of [...this.voices]) if (voice.bus !== "effects") this.release(voice, true)
  } else if (this.timer === null) {
   this.nextBeat = ctx.currentTime + .06
   this.timer = setInterval(() => this.schedule(), 40)
  }
 }
 private release(voice: Voice, stop = false) {
  if (!this.voices.delete(voice)) return
  voice.source.onended = null
  if (stop) voice.source.stop()
  for (const node of voice.nodes) node.disconnect()
 }
 private sound(frequency: number, duration: number, level: number, bus: Bus, at: number, type: OscillatorType | "noise" = "triangle", end = frequency, pan = 0, priority = 0, shape: VoiceShape = {}) {
  const ctx = this.context
  if (!ctx || ctx.state !== "running" || !this.visible || !this.masterVolume || this.scene.mood === "paused") return
  if ((bus === "effects" ? this.effectsVolume : this.musicVolume) === 0) return
  // Reserve headroom and voices for damage/casts; swarm chatter may be dropped.
  const busLimit = bus === "effects" ? 30 : bus === "music" ? 24 : 2
  const fullBus = [...this.voices].filter(v => v.bus === bus).length >= busLimit
  if (fullBus || this.voices.size >= 56) {
   const minor = [...this.voices].find(v => v.priority < priority && (!fullBus || v.bus === bus))
   if (!minor) return
   this.release(minor, true)
  }
  const source = type === "noise" ? ctx.createBufferSource() : ctx.createOscillator()
  const envelope = ctx.createGain(), panner = ctx.createStereoPanner(), nodes: AudioNode[] = [source, envelope, panner]
  at = Math.max(ctx.currentTime, at)
  if (type === "noise") { const bufferSource = source as AudioBufferSourceNode; bufferSource.buffer = this.noise; bufferSource.loop = true; bufferSource.playbackRate.value = .8 + (this.variation % 5) * .08 }
  else {
   const oscillator = source as OscillatorNode
   oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at)
   oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration)
  }
  if (type === "noise") {
   const filter = ctx.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = frequency; filter.Q.value = .6
   source.connect(filter); filter.connect(envelope); nodes.push(filter)
  } else source.connect(envelope)
  // One continuous oscillator with an LFO on pitch: smooth groans, howls and wails instead of chopped notes.
  if (shape.vibratoRate && shape.vibratoDepth && type !== "noise") {
   const lfo = ctx.createOscillator(), depth = ctx.createGain()
   lfo.frequency.value = shape.vibratoRate; depth.gain.value = frequency * shape.vibratoDepth
   lfo.connect(depth); depth.connect((source as OscillatorNode).frequency)
   lfo.start(at); lfo.stop(at + duration + .02); nodes.push(lfo, depth)
  }
  envelope.gain.setValueAtTime(.0001, at)
  envelope.gain.exponentialRampToValueAtTime(Math.max(.0001, level), at + (shape.attack ?? Math.min(.012, duration / 4)))
  envelope.gain.exponentialRampToValueAtTime(.0001, at + duration)
  panner.pan.value = Math.max(-.65, Math.min(.65, pan)); envelope.connect(panner); panner.connect(this.buses[bus]!)
  const voice = { source, nodes, bus, priority }; this.voices.add(voice)
  source.onended = () => this.release(voice)
  source.start(at); source.stop(at + duration + .02)
 }
 private schedule() {
  const ctx = this.context
  if (!ctx || ctx.state !== "running") return
  // Never catch up missed bars after a throttled/background tab.
  if (this.nextBeat < ctx.currentTime) this.nextBeat = ctx.currentTime + .02
  while (this.nextBeat < ctx.currentTime + .14) {
   const wanted = this.themeFor(this.scene)
   if (wanted !== this.track && (this.step % 128 === 0 || (wanted === bossTrack && this.step % 16 === 0))) this.track = wanted
   const track = this.track, at = this.nextBeat, index = this.step % 16, bar = Math.floor(this.step / 16) % 8
   const arena = this.scene.mood === "arena"
   this.intensity += ((arena ? Math.max(this.scene.boss ? 1 : this.scene.critical ? .75 : .2, this.scene.pressure ?? 0) : 0) - this.intensity) * .08
   const energy = this.intensity
   if (index === 0 && this.step % 64 === 0) this.syncRecordings()
   if (index === 0) this.sound(500, 1.3, .045, "ambience", at, "noise", 500, bar % 2 ? -.45 : .45)
   if (index === 5 || index === 13) this.sound(1900, .04, .025, "ambience", at, "noise", 1900, index === 5 ? -.4 : .4)
   if (this.orchestra && this.musicVolume) playScoreStep(this.orchestra, track, this.step, at, 60 / track.tempo / 4, { energy, calm: !arena, title: this.scene.mood === "title", hushed: this.scene.mood === "draft", boss: !!this.scene.boss })
   if (arena) {
    if (this.scene.critical && index % 8 === 0) {
     this.sound(105, .13, .23, "effects", at, "triangle", 62, 0, 2)
     this.sound(88, .1, .14, "effects", at + .19, "triangle", 55, 0, 2)
    }
   }
   this.step++; this.nextBeat += 60 / track.tempo / 4
  }
 }
 private layerSamples(kind: string, pan: number) {
  const samples = this.samples
  if (!samples?.ready) return
  const layers = kind.startsWith("death-") ? [deathSample(kind.slice(6) as EnemyKind)] : eventSamples[kind] ?? []
  for (const layer of layers) if (layer) samples.play(layer.group, { ...layer, pan, gain: (layer.gain ?? 1) * mixLevels.sampleGain })
 }
 /** Title and calm moods use the title theme, boss fights the duel theme, runs one theme per depth. */
 private themeFor(scene: DungeonSoundscape): MusicTrack {
  if (scene.mood === "title" || scene.mood === "dojo") return titleTrack
  if (scene.boss) return bossTrack
  return depthTracks[(scene.depth ?? 0) % depthTracks.length]!
 }
 play(kind: string, pan = 0) {
  const ctx = this.context
  if (!ctx || ctx.state !== "running" || !this.visible || !this.masterVolume || !this.effectsVolume || this.scene.mood === "paused") return
  const now = ctx.currentTime, major = ["hurt", "defeat", "boss", "level", "upgrade", "storm", "cleave", "heal", "explosion", "victory", "finisher", "meteor", "nova", "whirl", "leap", "surge"].includes(kind)
  const gap = kind === "tick" ? .055 : kind.startsWith("enemy-") ? 1.4 : major ? .12 : .1
  if (now - (this.cooldowns.get(kind) ?? -10) < gap) return
  if (kind.startsWith("enemy-")) { if (now - (this.cooldowns.get("enemy") ?? -10) < .65) return; this.cooldowns.set("enemy", now) }
  this.cooldowns.set(kind, now); this.variation++
  this.layerSamples(kind, pan)
  const pitch = [1, 1.035, .97, 1.015, .985][this.variation % 5]!, priority = kind === "hurt" || kind === "defeat" ? 4 : major ? 3 : kind === "tick" || kind.startsWith("enemy-") ? 0 : 1
  const tone = (freq: number, duration: number, level: number, type: OscillatorType | "noise", end = freq, delay = 0) => this.sound(freq * pitch, duration, level * mixLevels.effectsRecipeGain, "effects", now + delay, type, end * pitch, pan, priority)
  const chime = (notes: number[], level:number, spacing:number) => notes.forEach((n, i) => tone(hz(n), .3, level, "sine", hz(n), i * spacing))
  if (major && this.duck) {
   this.duck.gain.cancelScheduledValues(now); this.duck.gain.setValueAtTime(this.duck.gain.value, now)
   this.duck.gain.linearRampToValueAtTime(mixLevels.duckTo, now + .025); this.duck.gain.setTargetAtTime(1, now + .12, .16)
  }
  if (hasSfxRecipe(kind)) {
   sfxRecipes[kind]!({
    tone: (f, d, l, type, end = f, delay = 0) => tone(f, d, l, type, end, delay),
    sweep: (from, to, d, l, type, shape = {}) => this.sound(from * pitch, d, l * mixLevels.effectsRecipeGain, "effects", now + (shape.delay ?? 0), type, to * pitch, pan, priority, shape),
    chime,
   })
   return
  }
  switch (kind) {
   case "shield": tone(490,.38,.16,"sine",980);chime([74,81,86],.16,.065);break
   case "mana": chime([81,86,93],.17,.05);break
   case "deploy": tone(190,.15,.2,"square",270);chime([69,74,81],.16,.07);break
   case "ui": tone(660, .055, .055, "sine", 880); break
   case "tick": tone(1100, .035, .035, "sine", 750); break
   case "slash": case "dust": tone(2100, .12, .22, "noise"); tone(430, .075, .13, "triangle", 100); tone(2600, .18, .05, "sine", 2400, .02); break
   case "cleave": tone(1300, .32, .37, "noise"); tone(190, .24, .3, "triangle", 45); break
   case "hurt": tone(90, .24, .46, "triangle", 34); tone(750, .14, .28, "noise"); break
   case "hit": tone(130, .1, .2, "triangle", 50); break
   case "shatter": case "block": tone(2400, .14, .19, "noise"); tone(780, .11, .12, "square", 230); break
   case "heal": chime([74, 77, 81, 86], .23, .085); break
   case "pickup": chime([86, 93], .13, .045); break
   case "chest": tone(420, .1, .12, "noise"); chime([74, 81, 86, 89], .2, .055); break
   case "magnet": chime([62, 69, 74, 81], .15, .045); break
   case "level": chime([74, 77, 81, 86, 89], .25, .085); tone(146, .65, .15, "triangle", 293); break
   case "upgrade": chime([69, 74, 77, 81, 86], .24, .055); break
   case "boss": tone(73, 1.1, .25, "sawtooth", 55); tone(220, .7, .3, "noise"); break
   case "warning": tone(146, .22, .18, "sine", 110); break
   case "defeat": chime([74, 69, 65, 62, 50], .2, .17); break
   case "victory": chime([74, 81, 86, 89, 93], .24, .11); break
  }
 }
 suspend() {
  this.musicDeck?.pause(); this.ambienceDeck?.pause(); this.samples?.stopAll()
  if (this.timer !== null) clearInterval(this.timer)
  this.timer = null
  for (const voice of [...this.voices]) this.release(voice, true)
  this.cooldowns.clear()
  if (this.context?.state === "running") void this.context.suspend().catch(() => {})
 }
 dispose() {
  this.disposed = true; this.suspend()
  this.musicDeck?.dispose(); this.ambienceDeck?.dispose(); this.samples?.dispose(); this.recordedMusic?.disconnect()
  this.musicDeck = this.ambienceDeck = null; this.samples = null; this.recordedMusic = null; this.musicTrack = null
  for (const node of [...Object.values(this.buses), ...this.reverbNodes, this.duck, this.master, this.compressor, this.limiter]) node?.disconnect()
  if (this.context) void this.context.close().catch(() => {})
  this.context = null; this.noise = null; this.buses = {}; this.duck = this.master = null; this.compressor = this.limiter = null; this.orchestra = null; this.reverbNodes = []
 }
}
