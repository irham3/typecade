import { AdditiveBlending, DoubleSide, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, RingGeometry, type Scene } from "three"
import type { DungeonState } from "@typecade/contracts"
import { weaponRules } from "@typecade/content"
import { orbitBladePositions } from "@typecade/game-rules"
import type { DungeonModels } from "../DungeonModels"
import type { Part } from "../models/blueprint"

const MAX_BLADES = 6
const TRAIL_STEPS = 3

const spiritBlade: Part[] = [
  [0x7fd6ff, 0, 0, 0, .12, .06, .9, "cone"],
  [0x98edfa, 0, 0, -.42, .3, .07, .1],
  [0xe8b966, 0, 0, -.55, .08, .08, .2],
]

/**
 * Presentation of automatic weapons: spinning spirit blades with afterimages, and
 * ground telegraphs that tighten as Nova and Frost Aura charge.
 */
export class WeaponVisuals {
  private readonly blades: InstancedMesh
  private readonly trails: InstancedMesh
  private readonly frostRing: Mesh<RingGeometry, MeshBasicMaterial>
  private readonly novaRing: Mesh<RingGeometry, MeshBasicMaterial>
  private readonly materials: MeshBasicMaterial[] = []
  private readonly dummy = new Object3D()

  constructor(scene: Scene, models: DungeonModels) {
    const bladeGeometry = models.geometry(spiritBlade)
    this.blades = new InstancedMesh(bladeGeometry, models.material, MAX_BLADES)
    const trailMaterial = this.own(new MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: .35, blending: AdditiveBlending, depthWrite: false }))
    this.trails = new InstancedMesh(bladeGeometry, trailMaterial, MAX_BLADES * TRAIL_STEPS)
    this.frostRing = new Mesh(models.keep(new RingGeometry(.96, 1, 6)), this.own(new MeshBasicMaterial({ color: weaponRules.frost.color, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide })))
    this.novaRing = new Mesh(models.keep(new RingGeometry(.9, 1, 48)), this.own(new MeshBasicMaterial({ color: weaponRules.nova.color, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide })))
    for (const ring of [this.frostRing, this.novaRing]) ring.rotation.x = -Math.PI / 2
    for (const mesh of [this.blades, this.trails]) { mesh.frustumCulled = false; mesh.count = 0 }
    scene.add(this.blades, this.trails, this.frostRing, this.novaRing)
  }

  update(state: DungeonState | null, heroX: number, heroZ: number, elapsed: number, reduced: boolean) {
    this.drawBlades(state, elapsed, reduced)
    this.drawCharge(this.frostRing, state, "frost", heroX, heroZ, elapsed, reduced)
    this.drawCharge(this.novaRing, state, "nova", heroX, heroZ, elapsed, reduced)
  }

  hide() { this.blades.count = this.trails.count = 0; this.frostRing.visible = this.novaRing.visible = false }

  dispose() {
    for (const mesh of [this.blades, this.trails]) { mesh.removeFromParent(); mesh.dispose() }
    this.frostRing.removeFromParent(); this.novaRing.removeFromParent()
    this.materials.forEach(material => material.dispose())
  }

  private drawBlades(state: DungeonState | null, elapsed: number, reduced: boolean) {
    const positions = state ? orbitBladePositions(state) : []
    const level = state?.weapons.orbit.level ?? 0
    this.blades.count = positions.length
    this.trails.count = reduced ? 0 : positions.length * TRAIL_STEPS
    positions.forEach((blade, index) => {
      const facing = Math.atan2(blade.x - state!.player.x, blade.z - state!.player.z) + Math.PI / 2
      const bob = reduced ? 0 : Math.sin(elapsed * 6 + index) * .08
      this.place(this.blades, index, blade.x, 1 + bob, blade.z, facing, .9 + level * .08)
      if (reduced) return
      for (let step = 1; step <= TRAIL_STEPS; step++) {
        const lag = step * .09
        const radius = Math.hypot(blade.x - state!.player.x, blade.z - state!.player.z)
        const angle = Math.atan2(blade.x - state!.player.x, blade.z - state!.player.z) - lag
        this.place(this.trails, index * TRAIL_STEPS + step - 1, state!.player.x + Math.sin(angle) * radius, 1 + bob, state!.player.z + Math.cos(angle) * radius, angle + Math.PI / 2, (.9 - step * .18) * (1 + level * .08))
      }
    })
    this.blades.instanceMatrix.needsUpdate = this.trails.instanceMatrix.needsUpdate = true
  }

  /** Ring that closes in on the hero as a timed weapon charges, then pops on release. */
  private drawCharge(ring: Mesh<RingGeometry, MeshBasicMaterial>, state: DungeonState | null, id: "frost" | "nova", x: number, z: number, elapsed: number, reduced: boolean) {
    const weapon = state?.weapons[id]
    ring.visible = !!weapon?.level
    if (!weapon?.level) return
    const rank = weapon.level - 1
    const charge = 1 - Math.max(0, Math.min(1, weapon.timer / weaponRules[id].interval[rank]!))
    const radius = weaponRules[id].radius[rank]! * (id === "nova" ? 1.25 - charge * .55 : 1)
    ring.position.set(x, .05 + (id === "nova" ? .01 : 0), z)
    ring.scale.setScalar(radius)
    ring.rotation.z = reduced ? 0 : elapsed * (id === "frost" ? .4 : -.8)
    ring.material.opacity = (id === "frost" ? .18 : .08) + charge * charge * .45
  }

  private place(mesh: InstancedMesh, index: number, x: number, y: number, z: number, yaw: number, scale: number) {
    this.dummy.position.set(x, y, z)
    this.dummy.rotation.set(0, yaw, 0)
    this.dummy.scale.setScalar(scale)
    this.dummy.updateMatrix()
    mesh.setMatrixAt(index, this.dummy.matrix)
  }

  private own(material: MeshBasicMaterial) { this.materials.push(material); return material }
}
