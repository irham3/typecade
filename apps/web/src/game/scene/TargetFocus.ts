import { AdditiveBlending, DoubleSide, Group, Mesh, MeshBasicMaterial, OctahedronGeometry, RingGeometry, type BufferGeometry, type Material, type Scene } from "three"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"

const BRACKETS = 3
const RETICLE_COLOR = 0xffd36b
const SHADE_OUTER = 90
const FEATHER = 1.6

/**
 * Lock-on presentation: a rotating three-bracket reticle at the focused enemy's feet with a
 * bobbing marker above its head (Kingdom Hearts style), and floor shading beyond typing range
 * so it is obvious which foes can be typed. Owns and disposes all of its GPU resources.
 */
export class TargetFocus {
  private readonly reticle = new Group()
  private readonly brackets: Mesh
  private readonly pointer: Mesh
  private readonly shade: Mesh
  private readonly feather: Mesh
  private readonly geometries: BufferGeometry[] = []
  private readonly materials: Material[] = []
  private focusId: number | null = null
  private focusAt = -10

  constructor(scene: Scene, rangeRadius: number) {
    const arcs = Array.from({ length: BRACKETS }, (_, i) => new RingGeometry(.92, 1.08, 12, 1, i * Math.PI * 2 / BRACKETS, Math.PI * 2 / BRACKETS * .55))
    const bracketGeometry = this.keep(mergeGeometries(arcs)!)
    arcs.forEach(arc => arc.dispose())
    this.brackets = new Mesh(bracketGeometry, this.own(new MeshBasicMaterial({ color: RETICLE_COLOR, transparent: true, opacity: .9, blending: AdditiveBlending, depthWrite: false, side: DoubleSide })))
    this.brackets.rotation.x = -Math.PI / 2
    this.pointer = new Mesh(this.keep(new OctahedronGeometry(.16)), this.own(new MeshBasicMaterial({ color: RETICLE_COLOR })))
    this.pointer.scale.set(1, 1.6, 1)
    this.reticle.add(this.brackets, this.pointer)
    this.reticle.visible = false

    const shadeMaterial = this.own(new MeshBasicMaterial({ color: 0x02050a, transparent: true, opacity: .42, depthWrite: false }))
    const featherMaterial = this.own(new MeshBasicMaterial({ color: 0x02050a, transparent: true, opacity: .2, depthWrite: false }))
    this.shade = new Mesh(this.keep(new RingGeometry(rangeRadius, SHADE_OUTER, 64)), shadeMaterial)
    this.feather = new Mesh(this.keep(new RingGeometry(rangeRadius - FEATHER, rangeRadius, 64)), featherMaterial)
    for (const ring of [this.shade, this.feather]) { ring.rotation.x = -Math.PI / 2; ring.renderOrder = 2; ring.visible = false }
    scene.add(this.reticle, this.shade, this.feather)
  }

  /** Places the reticle on the focused enemy (or hides it). `size` is the enemy model scale. */
  update(target: { id: number; x: number; z: number; size: number; headHeight: number } | null, heroX: number, heroZ: number, elapsed: number, reduced: boolean, showRange: boolean) {
    for (const ring of [this.shade, this.feather]) { ring.visible = showRange; ring.position.set(heroX, .03, heroZ) }
    if (!target) { this.reticle.visible = false; this.focusId = null; return }
    if (target.id !== this.focusId) { this.focusId = target.id; this.focusAt = elapsed }
    // Snap-in: the reticle starts wide and closes onto a newly focused enemy.
    const snap = reduced ? 0 : Math.max(0, 1 - (elapsed - this.focusAt) / .18)
    this.reticle.visible = true
    this.reticle.position.set(target.x, .05, target.z)
    this.brackets.scale.setScalar(target.size * (.95 + snap * .9))
    this.brackets.rotation.z = reduced ? 0 : elapsed * 1.6
    this.pointer.position.set(0, target.headHeight + (reduced ? 0 : Math.sin(elapsed * 5) * .12), 0)
    this.pointer.rotation.y = reduced ? 0 : elapsed * 3
  }

  dispose() {
    for (const mesh of [this.reticle, this.shade, this.feather]) mesh.removeFromParent()
    this.geometries.forEach(geometry => geometry.dispose())
    this.materials.forEach(material => material.dispose())
  }

  private keep<T extends BufferGeometry>(geometry: T): T { this.geometries.push(geometry); return geometry }
  private own<T extends Material>(material: T): T { this.materials.push(material); return material }
}
