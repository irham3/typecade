import type { CombatActionKind, ItemContribution } from "@/lib/engine/overdrive"

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
let volume = 0.5
let muted = false
let unlocked = false
let noiseState = 0x6d2b79f5
let keyVariationIndex = 0

const ITEM_AUDIO = {
  wasd: { frequency: 420, wave: "square" },
  vowel_magnet: { frequency: 510, wave: "sine" },
  longshot: { frequency: 680, wave: "triangle" },
  sprinter: { frequency: 760, wave: "square" },
  second_wind: { frequency: 560, wave: "triangle" },
  copper_key: { frequency: 920, wave: "sine" },
  home_row: { frequency: 390, wave: "square" },
  punctuator: { frequency: 840, wave: "triangle" },
  combo_battery: { frequency: 310, wave: "sine" },
  overclock: { frequency: 640, wave: "sawtooth" },
  double_tap: { frequency: 720, wave: "square" },
  snowball: { frequency: 600, wave: "sine" },
  interest_bank: { frequency: 880, wave: "triangle" },
  glass_keycap: { frequency: 1_020, wave: "sine" },
  vampire: { frequency: 230, wave: "sawtooth" },
  escape: { frequency: 460, wave: "square" },
  time_freeze: { frequency: 540, wave: "sine" },
  quota_slash: { frequency: 350, wave: "sawtooth" },
  insurance: { frequency: 330, wave: "triangle" },
} as const satisfies Record<string, {
  frequency: number
  wave: OscillatorType
}>

const ITEM_KIND_INTERVAL: Record<ItemContribution["kind"], number> = {
  protection: 120,
  time: -80,
  quota: -120,
  mult: 180,
  base: 90,
  score: 240,
  token: 300,
}

const ACTION_AUDIO: Record<CombatActionKind, {
  frequency: number
  wave: OscillatorType
}> = {
  slash: { frequency: 520, wave: "square" },
  dash: { frequency: 290, wave: "sawtooth" },
  blade: { frequency: 760, wave: "triangle" },
  railgun: { frequency: 1_080, wave: "square" },
  echo: { frequency: 640, wave: "sine" },
  shield: { frequency: 340, wave: "triangle" },
  bomb: { frequency: 180, wave: "sawtooth" },
  drain: { frequency: 220, wave: "sawtooth" },
  "overdrive-burst": { frequency: 96, wave: "square" },
}

function nextNoiseSample() {
  noiseState ^= noiseState << 13
  noiseState ^= noiseState >>> 17
  noiseState ^= noiseState << 5
  return (noiseState >>> 0) / 4_294_967_296
}

function nextKeyFrequency() {
  const offsets = [0, 97, 43, 181, 119, 23]
  const frequency = 1_450 + offsets[keyVariationIndex % offsets.length]
  keyVariationIndex += 1
  return frequency
}

export function unlock(): void {
  if (unlocked) return
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    compressor = ctx.createDynamicsCompressor()
    
    masterGain.connect(compressor)
    compressor.connect(ctx.destination)
    
    masterGain.gain.value = muted ? 0 : volume
  }
  unlocked = true
  if (ctx.state === "suspended") void ctx.resume()
}

function tone(freq: number, type: OscillatorType, ms: number, peak = 0.15, slide?: number, delay = 0) {
  if (!unlocked || !ctx || !masterGain) return
  const at = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, at + ms / 1000)
  
  gain.gain.setValueAtTime(0.001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.001, at + ms / 1000)
  
  osc.connect(gain).connect(masterGain)
  osc.start(at)
  osc.stop(at + ms / 1000 + 0.02)
}

function noise(ms: number, peak = 0.08, delay = 0) {
  if (!unlocked || !ctx || !masterGain) return
  const length = Math.floor(ctx.sampleRate * ms / 1000)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = (nextNoiseSample() * 2 - 1) * (1 - i / length)
  }
  const src = ctx.createBufferSource()
  const gain = ctx.createGain()
  
  src.buffer = buffer
  gain.gain.value = peak
  
  const at = ctx.currentTime + delay
  src.connect(gain).connect(masterGain)
  src.start(at)
}

export const sfx = {
  unlock,
  key() { tone(nextKeyFrequency(), "square", 24, 0.045) },
  shot(combo: number) { tone(520 + Math.min(combo, 30) * 9, "square", 65, 0.09, 900 + combo * 8) },
  action(kind: CombatActionKind, overdrive = false) {
    const cue = ACTION_AUDIO[kind]
    tone(
      cue.frequency,
      cue.wave,
      overdrive ? 150 : 90,
      overdrive ? 0.14 : 0.08,
      overdrive ? cue.frequency * 1.8 : cue.frequency * 1.25,
    )
    if (kind === "bomb" || kind === "overdrive-burst") noise(70, overdrive ? 0.08 : 0.04, 0.02)
  },
  hit() { 
    tone(180, "triangle", 55, 0.08, 110)
    noise(45, 0.035) 
  },
  typo() { 
    tone(190, "sawtooth", 170, 0.18, 72)
    noise(120, 0.08) 
  },
  word(combo: number) { 
    tone(440 * Math.pow(2, (combo % 12) / 12), "sine", 110, 0.14)
    tone(660, "triangle", 70, 0.08, undefined, 0.035)
  },
  mult(mult: number) { 
    ;[0, 1, 2].forEach(i => tone(620 + mult * 45 + i * 110, "triangle", 130, 0.13, undefined, i * 0.055)) 
  },
  item(itemId: string, kind: ItemContribution["kind"]) {
    const cue = ITEM_AUDIO[itemId as keyof typeof ITEM_AUDIO]
    if (!cue) return
    const interval = ITEM_KIND_INTERVAL[kind]
    tone(cue.frequency, cue.wave, 120, 0.08, Math.max(48, cue.frequency + interval))
    if (kind === "protection" || kind === "quota") noise(70, 0.025, 0.04)
  },
  stageClear() { 
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, "square", 150, 0.14, undefined, i * 0.09)) 
  },
  boss() { 
    tone(92, "sawtooth", 600, 0.16, 55)
    tone(184, "square", 400, 0.07, 92, 0.12) 
  },
  runOver() { 
    ;[392, 311, 262, 196].forEach((f, i) => tone(f, "sawtooth", 210, 0.14, undefined, i * 0.14)) 
  },
  setVolume(v: number) { 
    volume = Math.max(0, Math.min(1, v))
    if (masterGain) masterGain.gain.value = muted ? 0 : volume 
  },
  setMuted(v: boolean) { 
    muted = v
    if (masterGain) masterGain.gain.value = muted ? 0 : volume 
  },
}
