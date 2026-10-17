import { AmbientLight, Box3, DirectionalLight, Group, Mesh, OrthographicCamera, Scene, SRGBColorSpace, Vector3, WebGLRenderer } from "three"
import type { EnemyKind } from "@typecade/contracts"
import { DungeonModels } from "./DungeonModels"
import { wingedKinds } from "./models/monsters"

const SIZE = 192

/** Assembles a posed actor from its blueprint at the same limb sockets the scene uses. */
function buildActor(models: DungeonModels, kind: EnemyKind) {
  const model = models.actor(kind)
  const root = new Group()
  root.add(new Mesh(model.body, models.material))
  if (model.leg) for (const side of [-1, 1]) {
    const limb = new Mesh(model.leg, models.material)
    if (wingedKinds.has(kind)) { limb.position.set(.6 * side, 1.13, 0); limb.rotation.z = side * .45 }
    else { limb.position.set(.25 * side, .7, 0); limb.rotation.x = side * .18 }
    root.add(limb)
  }
  if (model.arm) { const arm = new Mesh(model.arm, models.material); arm.position.set(-.62, 1.52, 0); arm.rotation.x = -.25; root.add(arm) }
  if (model.weapon) { const weapon = new Mesh(model.weapon, models.material); weapon.position.set(.62, 1.52, 0); weapon.rotation.x = -.5; root.add(weapon) }
  root.scale.setScalar(model.scale)
  return root
}

/** Frames the actor's bounding box so small rats and towering knights both fill the card. */
function frame(camera: OrthographicCamera, actor: Group) {
  const box = new Box3().setFromObject(actor), size = box.getSize(new Vector3()), center = box.getCenter(new Vector3())
  const half = Math.max(size.x, size.y, size.z) * .62
  Object.assign(camera, { left: -half, right: half, top: half, bottom: -half })
  camera.position.set(center.x + 6, center.y + 4, center.z + 7)
  camera.lookAt(center)
  camera.updateProjectionMatrix()
}

let cache: Promise<Partial<Record<EnemyKind, string>>> | null = null

/**
 * Renders a transparent PNG portrait per kind using the in-game models, then releases the
 * temporary WebGL context. Results are memoised for the session.
 */
export function renderPortraits(kinds: readonly EnemyKind[]): Promise<Partial<Record<EnemyKind, string>>> {
  cache ??= new Promise(resolve => {
    const renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
    const models = new DungeonModels()
    try {
      renderer.setSize(SIZE, SIZE, false)
      renderer.outputColorSpace = SRGBColorSpace
      const scene = new Scene()
      const key = new DirectionalLight(0xffe2b8, 2.6); key.position.set(4, 8, 6)
      const rim = new DirectionalLight(0xb48cff, 1.6); rim.position.set(-6, 4, -6)
      scene.add(new AmbientLight(0x9fb4d8, 1.1), key, rim)
      const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 50)
      const portraits: Partial<Record<EnemyKind, string>> = {}
      for (const kind of kinds) {
        const actor = buildActor(models, kind)
        actor.rotation.y = -.35
        scene.add(actor)
        frame(camera, actor)
        renderer.render(scene, camera)
        portraits[kind] = renderer.domElement.toDataURL("image/png")
        scene.remove(actor)
      }
      resolve(portraits)
    } catch {
      resolve({})
    } finally {
      models.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  })
  return cache
}
