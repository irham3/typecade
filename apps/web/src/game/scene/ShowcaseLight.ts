import { CircleGeometry, Mesh, MeshBasicMaterial, AdditiveBlending, PointLight, SpotLight, type Scene } from "three"

/** Peak intensities for the Armory showcase; they fade in and out with the screen. */
const KEY = 46
const FILL = 9
const POOL_OPACITY = .09

/**
 * Armory lighting: a warm key spot from in front of the camera, a cool fill near the face and a soft
 * light pool on the floor, so the customised hero reads clearly in the dark keep. Two lights
 * and one quad; all three sit at zero (and invisible) outside the Armory.
 */
export class ShowcaseLight {
  private readonly key = new SpotLight(0xffe2b8, 0, 14, .5, .6, 1.2)
  private readonly fill = new PointLight(0x9cc8ff, 0, 6, 1.4)
  private readonly pool: Mesh<CircleGeometry, MeshBasicMaterial>
  private level = 0

  constructor(private readonly scene: Scene) {
    this.pool = new Mesh(new CircleGeometry(1.7, 24), new MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }))
    this.pool.rotation.x = -Math.PI / 2
    for (const node of [this.key, this.key.target, this.fill, this.pool]) { node.visible = false; scene.add(node) }
  }

  /** Eases toward on/off and follows the hero at (x, z). */
  update(on: boolean, x: number, z: number, delta: number) {
    this.level += ((on ? 1 : 0) - this.level) * Math.min(1, delta * 4 || 1)
    if (!on && this.level < .01) this.level = 0
    const visible = this.level > 0
    this.key.visible = this.key.target.visible = this.fill.visible = this.pool.visible = visible
    if (!visible) return
    this.key.intensity = KEY * this.level
    this.key.position.set(x + 5, 6, z + 2)
    this.key.target.position.set(x, 1.2, z)
    this.fill.intensity = FILL * this.level
    this.fill.position.set(x + 1.8, 2.2, z + 1.8)
    this.pool.position.set(x, .08, z)
    this.pool.material.opacity = POOL_OPACITY * this.level
  }

  dispose() {
    for (const node of [this.key, this.key.target, this.fill, this.pool]) this.scene.remove(node)
    this.key.dispose(); this.fill.dispose()
    this.pool.geometry.dispose(); this.pool.material.dispose()
  }
}
