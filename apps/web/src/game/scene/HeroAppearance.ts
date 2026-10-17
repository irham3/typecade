import type { BufferGeometry, InstancedMesh, Mesh } from "three"
import type { HeroLoadout } from "@typecade/contracts"
import type { DungeonModels } from "../DungeonModels"
import { heroBlueprint } from "../models/heroParts"

/** The hero rig meshes whose geometry follows the equipped loadout. */
export interface HeroRigMeshes {
  body: Mesh
  outline: Mesh
  legs: Mesh[]
  arm: Mesh
  weapon: Mesh
  afterimages: InstancedMesh
}

/**
 * Rebuilds the hero's geometry when the loadout changes and releases the previous build,
 * so trying on outfits never accumulates GPU buffers. Identical loadouts are a no-op.
 */
export class HeroAppearance {
  private built: BufferGeometry[] = []
  private key = ""

  constructor(private readonly models: DungeonModels, private readonly rig: HeroRigMeshes) {}

  apply(loadout: HeroLoadout) {
    const key = Object.values(loadout).join("|")
    if (key === this.key) return
    this.key = key
    const blueprint = heroBlueprint(loadout)
    const body = this.models.geometry(blueprint.body)
    const leg = this.models.geometry(blueprint.leg)
    const arm = blueprint.arm ? this.models.geometry(blueprint.arm) : null
    const weapon = blueprint.weapon ? this.models.geometry(blueprint.weapon) : null
    this.rig.body.geometry = body
    this.rig.outline.geometry = body
    this.rig.afterimages.geometry = body
    for (const mesh of this.rig.legs) mesh.geometry = leg
    if (arm) this.rig.arm.geometry = arm
    if (weapon) this.rig.weapon.geometry = weapon
    this.models.release(this.built)
    this.built = [body, leg, ...(arm ? [arm] : []), ...(weapon ? [weapon] : [])]
  }

  dispose() {
    this.models.release(this.built)
    this.built = []
  }
}
