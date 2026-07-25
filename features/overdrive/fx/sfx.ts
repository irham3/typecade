let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
let volume = 0.5
let muted = false
let unlocked = false
let noiseState = 0x6d2b79f5
let keyVariationIndex = 0

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
