import { DataTexture, LinearMipmapLinearFilter, NearestFilter, RepeatWrapping, RGBAFormat, type MeshStandardMaterial, type Texture } from "three"
import { createSeededRng } from "@typecade/game-rules"

/**
 * One shared 64×64 detail atlas for every vertex-coloured actor, prop and item.
 * Each channel is a tileable height field for one surface family; the per-vertex
 * `surfaceClass` attribute picks the channel, so a single texture and one program
 * give stone, cloth, metal, wood and hide their own hand-pixelled grain.
 *
 *   R  stone / bone   mottled grain, chips and hairline cracks
 *   G  cloth          over-under weave with uneven threads
 *   B  metal / wood   directional streaks, scratches and dents
 *   A  hide / scales  cellular scales with dark seams
 */
export const SURFACE_ATTRIBUTE = "surfaceClass"
export const SurfaceClass = { None: 0, Stone: 1, Cloth: 2, Metal: 3, Hide: 4, Wood: 5 } as const
export type SurfaceClass = typeof SurfaceClass[keyof typeof SurfaceClass]

const SIZE = 64
/** Texels per world unit: about 32, so a 2.5-unit actor carries ~80 pixels of grain. */
const DENSITY = (32 / SIZE).toFixed(3)
const ALBEDO = "1.0"
const BUMP = "2.4"

const wrap = (value: number) => ((value % SIZE) + SIZE) % SIZE

function valueNoise(random: () => number, period: number) {
  const lattice = Float32Array.from({ length: period * period }, () => random())
  const cell = SIZE / period
  return (x: number, y: number) => {
    const gx = x / cell, gy = y / cell, x0 = Math.floor(gx), y0 = Math.floor(gy)
    const tx = gx - x0, ty = gy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const at = (ix: number, iy: number) => lattice[((iy + period) % period) * period + (ix + period) % period]!
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
    return top + (bottom - top) * sy
  }
}

function stone(random: () => number) {
  const coarse = valueNoise(random, 4), mid = valueNoise(random, 8), fine = valueNoise(random, 16)
  const height = new Float32Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++)
    height[y * SIZE + x] = .3 + coarse(x, y) * .25 + mid(x, y) * .25 + fine(x, y) * .15 + (random() - .5) * .08
  for (let crack = 0; crack < 4; crack++) {
    let x = Math.floor(random() * SIZE), y = Math.floor(random() * SIZE)
    for (let step = 0; step < 12; step++) { height[wrap(y) * SIZE + wrap(x)] = .12; x += random() < .6 ? 1 : 0; y += random() < .5 ? 1 : -1 }
  }
  for (let chip = 0; chip < 26; chip++) { const i = Math.floor(random() * SIZE * SIZE); height[i] = Math.max(.1, height[i]! - .28) }
  return height
}

function cloth(random: () => number) {
  const height = new Float32Array(SIZE * SIZE), slub = Float32Array.from({ length: SIZE / 2 }, () => (random() - .5) * .16)
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const warp = ((x >> 2) + (y >> 2)) & 1
    const across = warp ? x % 4 : y % 4
    const profile = Math.sin(Math.PI * (across + .5) / 4)
    const thread = warp ? slub[x >> 1]! : slub[y >> 1]!
    height[y * SIZE + x] = .22 + profile * .6 + thread + (random() - .5) * .06
  }
  return height
}

function streaks(random: () => number) {
  const height = new Float32Array(SIZE * SIZE)
  const rows = Float32Array.from({ length: SIZE }, () => random())
  const along = valueNoise(random, 8)
  for (let y = 0; y < SIZE; y++) {
    const row = (rows[y]! * 2 + rows[wrap(y - 1)]! + rows[wrap(y + 1)]!) / 4
    for (let x = 0; x < SIZE; x++) height[y * SIZE + x] = .4 + (row - .5) * .34 + along(x, y) * .14 + (random() - .5) * .05
  }
  for (let scratch = 0; scratch < 9; scratch++) {
    const angle = (random() - .5) * 1.2, length = 6 + random() * 14
    let x = random() * SIZE, y = random() * SIZE
    for (let step = 0; step < length; step++) {
      height[wrap(Math.round(y)) * SIZE + wrap(Math.round(x))] = .92
      height[wrap(Math.round(y) + 1) * SIZE + wrap(Math.round(x))] = .2
      x += Math.cos(angle); y += Math.sin(angle)
    }
  }
  for (let dent = 0; dent < 4; dent++) {
    const cx = random() * SIZE, cy = random() * SIZE, radius = 1.5 + random() * 1.8
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
      const falloff = 1 - Math.hypot(x, y) / radius
      if (falloff > 0) { const i = wrap(Math.round(cy) + y) * SIZE + wrap(Math.round(cx) + x); height[i] = height[i]! - falloff * .25 }
    }
  }
  return height
}

function scales(random: () => number) {
  const height = new Float32Array(SIZE * SIZE)
  const seeds = Array.from({ length: 22 }, () => [random() * SIZE, random() * SIZE] as const)
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    let first = Infinity, second = Infinity
    for (const [sx, sy] of seeds) {
      const dx = Math.min(Math.abs(x - sx), SIZE - Math.abs(x - sx)), dy = Math.min(Math.abs(y - sy), SIZE - Math.abs(y - sy))
      const distance = Math.hypot(dx, dy)
      if (distance < first) { second = first; first = distance } else if (distance < second) second = distance
    }
    const seam = Math.min(1, (second - first) / 2.5)
    height[y * SIZE + x] = .15 + seam * .55 + Math.max(0, 1 - first / 9) * .22 + (random() - .5) * .05
  }
  return height
}

export function createSurfaceDetail(): Texture {
  const rng = createSeededRng("tex:surface-detail")
  const random = () => rng.nextFloat()
  const channels = [stone(random), cloth(random), streaks(random), scales(random)]
  // Coarse wear patches on every family, so a plate or a robe is never one even pattern.
  const wear = valueNoise(random, 4), grime = valueNoise(random, 8)
  for (const height of channels) for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x
    height[i] = height[i]! * (.72 + wear(x, y) * .4) - Math.max(0, grime(x, y) - .7) * .5
  }
  const data = new Uint8Array(SIZE * SIZE * 4)
  for (let i = 0; i < SIZE * SIZE; i++) for (let c = 0; c < 4; c++) data[i * 4 + c] = Math.max(0, Math.min(255, channels[c]![i]! * 255))
  const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.magFilter = NearestFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

/**
 * Object-space triplanar detail: albedo grain, metal sheen and derivative bump.
 * Geometry without the attribute reads class 0 and renders unchanged.
 */
export function withSurfaceDetail<T extends MeshStandardMaterial>(material: T, detail: Texture): T {
  const previous = material.onBeforeCompile.bind(material)
  const previousKey = material.customProgramCacheKey.bind(material)
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer)
    shader.uniforms.detailMap = { value: detail }
    shader.vertexShader = `attribute float ${SURFACE_ATTRIBUTE};\nvarying float vSurfaceClass;\nvarying vec3 vDetailPos;\nvarying vec3 vDetailNormal;\n` + shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>\nvSurfaceClass = ${SURFACE_ATTRIBUTE};\nvDetailPos = position;\nvDetailNormal = normal;`,
    )
    shader.fragmentShader = `uniform sampler2D detailMap;
varying float vSurfaceClass;
varying vec3 vDetailPos;
varying vec3 vDetailNormal;
vec3 detailPerturb(vec3 surfacePos, vec3 surfaceNormal, vec2 dHdxy) {
  vec3 sigmaX = normalize(dFdx(surfacePos)), sigmaY = normalize(dFdy(surfacePos));
  vec3 r1 = cross(sigmaY, surfaceNormal), r2 = cross(surfaceNormal, sigmaX);
  float det = dot(sigmaX, r1);
  return normalize(abs(det) * surfaceNormal - sign(det) * (dHdxy.x * r1 + dHdxy.y * r2));
}
` + shader.fragmentShader
      .replace("#include <color_fragment>", `#include <color_fragment>
vec3 detailWeights = pow(abs(normalize(vDetailNormal)), vec3(4.0));
detailWeights /= detailWeights.x + detailWeights.y + detailWeights.z;
vec3 detailCoord = vDetailPos * ${DENSITY};
vec4 detailSample = texture2D(detailMap, detailCoord.zy) * detailWeights.x + texture2D(detailMap, detailCoord.xz) * detailWeights.y + texture2D(detailMap, detailCoord.xy) * detailWeights.z;
vec4 detailMask = vec4(lessThan(abs(vec4(vSurfaceClass) - vec4(1.0, 2.0, 3.0, 4.0)), vec4(.5)));
float detailWood = step(abs(vSurfaceClass - 5.0), .5);
detailMask.z += detailWood;
float detailHeight = dot(detailSample, detailMask);
float detailOn = min(1.0, detailMask.x + detailMask.y + detailMask.z + detailMask.w);
diffuseColor.rgb *= mix(1.0, .62 + detailHeight * .76, detailOn * ${ALBEDO});`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
float detailMetal = detailMask.z - detailWood;
roughnessFactor = mix(roughnessFactor, .32 + (1.0 - detailHeight) * .3, detailMetal);`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
vec2 detailSlope = vec2(dFdx(detailHeight), dFdy(detailHeight)) * ${BUMP} * detailOn;
normal = detailPerturb(-vViewPosition, normal, detailSlope);`)
  }
  material.customProgramCacheKey = () => `${previousKey()}|surface-detail`
  return material
}
