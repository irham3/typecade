import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace, type Texture } from "three"
import { createSeededRng } from "@typecade/game-rules"
import { environmentGrade } from "./environmentGrade"

export interface SurfaceTextures {
  map: CanvasTexture
  normalMap: CanvasTexture
}

type HeightPainter = (height: Float32Array, size: number, random: () => number) => void

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

/** Builds a tangent-space normal map from a height field with a Sobel-style gradient. */
function heightToNormalCanvas(height: Float32Array, size: number, strength: number) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const context = canvas.getContext("2d")!
  const image = context.createImageData(size, size)
  const sample = (x: number, y: number) => height[((y + size) % size) * size + (x + size) % size]!
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength
    const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength
    const length = Math.hypot(dx, dy, 1)
    const index = (y * size + x) * 4
    image.data[index] = ((-dx / length) * .5 + .5) * 255
    image.data[index + 1] = ((dy / length) * .5 + .5) * 255
    image.data[index + 2] = (1 / length * .5 + .5) * 255
    image.data[index + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return canvas
}

function pixelTexture(canvas: HTMLCanvasElement, colour: boolean): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.magFilter = texture.minFilter = NearestFilter
  texture.wrapS = texture.wrapT = RepeatWrapping
  if (colour) texture.colorSpace = SRGBColorSpace
  return texture
}

/**
 * Paints albedo from the same height field that drives the normal map, so
 * grout, chips and cracks catch light consistently.
 */
function surface(seed: string, size: number, paint: HeightPainter, tint: (h: number, random: () => number) => [number, number, number], normalStrength: number): SurfaceTextures {
  const rng = createSeededRng(seed)
  const random = () => rng.nextFloat()
  const height = new Float32Array(size * size).fill(.6)
  paint(height, size, random)
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const context = canvas.getContext("2d")!
  const image = context.createImageData(size, size)
  for (let i = 0; i < height.length; i++) {
    const [r, g, b] = tint(height[i]!, random)
    image.data[i * 4] = clamp01(r) * 255
    image.data[i * 4 + 1] = clamp01(g) * 255
    image.data[i * 4 + 2] = clamp01(b) * 255
    image.data[i * 4 + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return { map: pixelTexture(canvas, true), normalMap: pixelTexture(heightToNormalCanvas(height, size, normalStrength), false) }
}

/** Four bevelled flagstones per tile with grout, chips and hairline cracks. */
const paintFlagstones: HeightPainter = (height, size, random) => {
  const half = size / 2
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const lx = x % half, ly = y % half
    const edge = Math.min(lx, ly, half - 1 - lx, half - 1 - ly)
    const bevel = edge < 1 ? .1 : edge < 3 ? .45 + edge * .1 : .78
    height[y * size + x] = bevel + (random() - .5) * .08
  }
  for (let crack = 0; crack < 5; crack++) {
    let x = Math.floor(random() * size), y = Math.floor(random() * size)
    for (let step = 0; step < 14; step++) {
      height[(y % size) * size + (x % size)] = .25
      x = (x + (random() < .6 ? 1 : 0) + size) % size
      y = (y + (random() < .5 ? 1 : -1) + size) % size
    }
  }
  for (let chip = 0; chip < 12; chip++) {
    const x = Math.floor(random() * size), y = Math.floor(random() * size)
    height[y * size + x] = Math.max(.2, height[y * size + x]! - .3)
  }
}

/** Running-bond bricks for walls and ruins. */
const paintBricks: HeightPainter = (height, size, random) => {
  const rowHeight = size / 4, brickWidth = size / 2
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const row = Math.floor(y / rowHeight)
    const lx = (x + (row % 2) * brickWidth / 2) % brickWidth, ly = y % rowHeight
    const edge = Math.min(lx, ly, brickWidth - 1 - lx, rowHeight - 1 - ly)
    height[y * size + x] = (edge < 1 ? .15 : edge < 2 ? .55 : .82) + (random() - .5) * .1
  }
}

const stoneTint = (h: number, random: () => number): [number, number, number] => {
  const speck = (random() - .5) * environmentGrade.surfaces.albedoSpeck * 1.5
  const moss = h < .3 && random() < .35 ? .08 : 0
  const value = environmentGrade.surfaces.albedoBase + h * environmentGrade.surfaces.albedoRange + speck
  return [value - moss, value + moss * .6, value + .03 - moss]
}

export class TextureFactory {
  private readonly owned = new Set<Texture>()

  floor(): SurfaceTextures { return this.track(surface("tex:floor", 32, paintFlagstones, stoneTint, 2.2)) }
  wall(): SurfaceTextures { return this.track(surface("tex:wall", 32, paintBricks, stoneTint, 2.8)) }

  dispose() { this.owned.forEach(texture => texture.dispose()); this.owned.clear() }

  private track(textures: SurfaceTextures) {
    this.owned.add(textures.map)
    this.owned.add(textures.normalMap)
    return textures
  }
}
