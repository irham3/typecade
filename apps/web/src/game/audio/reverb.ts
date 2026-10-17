/**
 * Convolution reverb with a generated impulse response: a stone hall with early reflections
 * and a long, darkening tail. This single node is most of what makes the mix sound
 * "inside a dungeon" rather than in an empty room.
 */
export function createStoneHall(ctx: BaseAudioContext, seconds = 3.4, decay = 2.8): ConvolverNode {
  const length = Math.floor(ctx.sampleRate * seconds)
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  let seed = 90210
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1 }
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel)
    let lowpassed = 0
    for (let i = 0; i < length; i++) {
      const t = i / length
      // Stone absorbs highs over time: blend toward a low-passed copy as the tail ages.
      const white = random()
      lowpassed += (white - lowpassed) * (.6 - t * .5)
      const tail = Math.pow(1 - t, decay)
      data[i] = (white * (1 - t) + lowpassed * t) * tail
    }
    // Sparse early reflections off nearby walls.
    for (const [ms, gain] of [[11, .7], [23, .5], [37, .42], [53, .3], [71, .22]] as const) {
      const index = Math.floor(ctx.sampleRate * ms / 1000) + channel * 37
      if (index < length) data[index] = (data[index] ?? 0) + gain * (channel ? -1 : 1)
    }
  }
  const convolver = ctx.createConvolver()
  convolver.buffer = impulse
  return convolver
}
