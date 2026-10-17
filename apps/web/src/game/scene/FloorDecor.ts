import { AdditiveBlending, DoubleSide, DynamicDrawUsage, InstancedMesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, RingGeometry, CircleGeometry, type BufferGeometry, type Material, type Scene } from "three"
import { createSeededRng, dungeonWalkable } from "@typecade/game-rules"
import type { DungeonModels } from "../DungeonModels"
import type { Part } from "../models/blueprint"
import { environmentGrade } from "../render/environmentGrade"

/** One kind of walk-through floor dressing. Never blocks movement; purely decorative. */
interface DecorKind {
  geometry: BufferGeometry
  material: Material
  perChunk: number
  /** Uniform scale range [min, max]. */
  scale: [number, number]
  /** Height above the floor. */
  lift: number
  /** Lie flat (planes) or stand upright (meshes). */
  flat?: boolean
}

const CHUNK = 32
const MAX_CHUNKS = 9

const bonePile: Part[] = [
  [0xe6dcc0, 0, .05, 0, .7, .08, .1], [0xe6dcc0, -.36, .06, 0, .12, .12, .14, "round"], [0xe6dcc0, .36, .06, 0, .12, .12, .14, "round"],
  [0xd9cfb1, .2, .05, .3, .45, .07, .08, "box", .7],
]
const skull: Part[] = [
  [0xeadbb2, 0, .2, 0, .34, .3, .36, "round"], [0xeadbb2, 0, .1, .1, .22, .1, .2],
  [0x2a1f1a, -.08, .22, .16, .08, .08, .05], [0x2a1f1a, .08, .22, .16, .08, .08, .05],
]
const rubble: Part[] = [
  [0x6b6a70, 0, .08, 0, .3, .16, .26], [0x5a5960, .26, .06, .14, .2, .12, .18], [0x77757b, -.2, .05, -.12, .18, .1, .16], [0x84828a, .05, .05, -.26, .12, .08, .12],
]
const grass: Part[] = [
  [0x5f8f3e, 0, .18, 0, .08, .36, .08, "cone"], [0x6fa64a, .1, .14, .05, .07, .28, .07, "cone", -.3], [0x4f7f36, -.1, .15, -.04, .07, .3, .07, "cone", .35],
  [0x7cb556, .04, .12, -.1, .06, .24, .06, "cone", .15],
]
const glowshrooms: Part[] = [
  [0xd9e8f0, 0, .1, 0, .05, .2, .05, "cylinder"], [0x7fd6ff, 0, .22, 0, .16, .08, .16, "round"],
  [0xd9e8f0, .16, .07, .06, .04, .14, .04, "cylinder"], [0x98edfa, .16, .16, .06, .11, .06, .11, "round"],
  [0xd9e8f0, -.12, .06, -.08, .03, .12, .03, "cylinder"], [0xa58bff, -.12, .13, -.08, .09, .05, .09, "round"],
]
const candles: Part[] = [
  [0xf0e3c4, 0, .14, 0, .07, .28, .07, "cylinder"], [0xffe066, 0, .32, 0, .04, .08, .04, "cone"],
  [0xf0e3c4, .14, .1, .05, .06, .2, .06, "cylinder"], [0xffe066, .14, .24, .05, .035, .07, .035, "cone"],
  [0xe6d6b0, -.1, .08, .08, .06, .16, .06, "cylinder"], [0xffe066, -.1, .2, .08, .03, .06, .03, "cone"],
  [0x5a3a2a, 0, .01, 0, .42, .02, .36, "round"],
]
const crystals: Part[] = [
  [0x9ff5fa, 0, .22, 0, .12, .44, .12, "cone"], [0x7fd6ff, .13, .14, .04, .08, .28, .08, "cone", -.4], [0xa58bff, -.1, .12, -.05, .08, .24, .08, "cone", .45],
  [0x4a5262, 0, .03, 0, .32, .06, .28],
]
const fallenBlade: Part[] = [
  [0xb5c6d0, 0, .04, 0, .1, .04, .9], [0x6a4a2e, 0, .05, -.55, .07, .06, .22], [0xe8b966, 0, .05, -.42, .26, .06, .06],
]

/**
 * Walk-through floor dressing (bones, rubble, grass, glowing mushrooms, candles, crystals,
 * puddles, cracks and rune circles). Seeded per chunk, so it is stable as chunks recycle,
 * and it only uses walkable floor so nothing ever appears to block a path.
 */
export class FloorDecor {
  private readonly kinds: DecorKind[]
  private readonly meshes: InstancedMesh[] = []
  private readonly materials: Material[] = []
  private readonly runeMaterial: MeshBasicMaterial
  private readonly puddleMaterial: MeshStandardMaterial
  private readonly dummy = new Object3D()

  constructor(scene: Scene, models: DungeonModels) {
    this.runeMaterial = this.own(new MeshBasicMaterial({ color: 0x8f7bff, transparent: true, opacity: .55, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }))
    this.puddleMaterial = this.own(new MeshStandardMaterial({ color: 0x1d3a52, roughness: .08, metalness: .6, transparent: true, opacity: .78 }))
    const crackMaterial = this.own(new MeshBasicMaterial({ color: 0x141a22, transparent: true, opacity: .55, depthWrite: false }))
    const crack = models.keep(new RingGeometry(.2, .26, 5, 1, 0, Math.PI * 1.1))
    this.kinds = [
      { geometry: models.geometry(bonePile), material: models.material, perChunk: 7, scale: [.8, 1.3], lift: 0 },
      { geometry: models.geometry(skull), material: models.material, perChunk: 4, scale: [.8, 1.2], lift: 0 },
      { geometry: models.geometry(rubble), material: models.material, perChunk: 10, scale: [.7, 1.6], lift: 0 },
      { geometry: models.geometry(grass), material: models.material, perChunk: 14, scale: [.8, 1.6], lift: 0 },
      { geometry: models.geometry(glowshrooms), material: models.material, perChunk: 3, scale: [.9, 1.4], lift: 0 },
      { geometry: models.geometry(candles), material: models.material, perChunk: 3, scale: [1, 1.3], lift: 0 },
      { geometry: models.geometry(crystals), material: models.material, perChunk: 2, scale: [1, 1.6], lift: 0 },
      { geometry: models.geometry(fallenBlade), material: models.material, perChunk: 3, scale: [1, 1.3], lift: 0 },
      { geometry: models.keep(new CircleGeometry(1, 9)), material: this.puddleMaterial, perChunk: 4, scale: [.6, 1.4], lift: .012, flat: true },
      { geometry: crack, material: crackMaterial, perChunk: 10, scale: [1.5, 4], lift: .008, flat: true },
      { geometry: models.keep(new RingGeometry(.95, 1.1, 6)), material: this.runeMaterial, perChunk: 1, scale: [1.2, 1.8], lift: .02, flat: true },
      { geometry: models.keep(new RingGeometry(.55, .62, 3)), material: this.runeMaterial, perChunk: 1, scale: [1.2, 1.8], lift: .021, flat: true },
    ]
    for (const kind of this.kinds) {
      const mesh = new InstancedMesh(kind.geometry, kind.material, kind.perChunk * MAX_CHUNKS)
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.frustumCulled = false
      mesh.count = 0
      mesh.receiveShadow = true
      scene.add(mesh)
      this.meshes.push(mesh)
    }
  }

  /** Re-seeds dressing for the 3×3 chunk window around (cx, cz). Rune circles share one seed so the pair aligns. */
  rebuild(cx: number, cz: number, runeColor: number) {
    this.runeMaterial.color.setHex(runeColor)
    this.kinds.forEach((kind, kindIndex) => {
      const mesh = this.meshes[kindIndex]!
      let count = 0
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const bx = (cx + dx) * CHUNK, bz = (cz + dz) * CHUNK
        const rune = kindIndex >= this.kinds.length - 2
        const rng = createSeededRng(`decor:${rune ? "rune" : kindIndex}:${bx}:${bz}`)
        for (let i = 0; i < kind.perChunk; i++) {
          const x = bx + rng.nextFloat() * 28 - 14, z = bz + rng.nextFloat() * 28 - 14
          const spin = rng.nextFloat() * Math.PI * 2
          const size = kind.scale[0] + rng.nextFloat() * (kind.scale[1] - kind.scale[0])
          if (!dungeonWalkable({ x, z }) || !dungeonWalkable({ x: x + size, z }) || !dungeonWalkable({ x, z: z + size })) continue
          this.dummy.position.set(x, kind.lift, z)
          this.dummy.rotation.set(kind.flat ? -Math.PI / 2 : 0, kind.flat ? 0 : spin, kind.flat ? spin : 0)
          this.dummy.scale.setScalar(size)
          this.dummy.updateMatrix()
          mesh.setMatrixAt(count++, this.dummy.matrix)
        }
      }
      mesh.count = count
      mesh.instanceMatrix.needsUpdate = true
    })
  }

  /** Gentle rune pulse and puddle shimmer; frozen under Reduced Effects. */
  update(elapsed: number, reduced: boolean) {
    this.runeMaterial.opacity = environmentGrade.decor.runeOpacity + (reduced ? 0 : Math.sin(elapsed * 1.8) * environmentGrade.decor.runePulse)
    this.puddleMaterial.opacity = reduced ? .75 : .72 + Math.sin(elapsed * .9) * .05
  }

  setVisible(visible: boolean) { this.meshes.forEach(mesh => { mesh.visible = visible }) }

  dispose() {
    this.meshes.forEach(mesh => { mesh.removeFromParent(); mesh.dispose() })
    this.materials.forEach(material => material.dispose())
  }

  private own<T extends Material>(material: T): T { this.materials.push(material); return material }
}
