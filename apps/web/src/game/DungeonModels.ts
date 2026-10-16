import { BoxGeometry, BufferAttribute, BufferGeometry, Color, ConeGeometry, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, SphereGeometry } from "three"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"
import type { EnemyKind } from "@typecade/contracts"

type Shape = "box" | "cone" | "round" | "cylinder"
type Part = [color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, shape?: Shape, rz?: number]
export interface ActorGeometry { body: BufferGeometry; leg: BufferGeometry | null; weapon: BufferGeometry | null; scale: number }

/** Vertex-colored shared meshes keep a whole actor part in one draw call. */
export class DungeonModels {
 readonly geometries = new Set<BufferGeometry>()
 readonly material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })
 private shapes = { box: this.keep(new BoxGeometry(1, 1, 1)), cone: this.keep(new ConeGeometry(1, 1, 4)), round: this.keep(new SphereGeometry(1, 5, 3)), cylinder: this.keep(new CylinderGeometry(1, 1, 1, 6)) }
 private cache = new Map<string, ActorGeometry>()
 keep<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry }
 geometry(parts: Part[]) {
  const color = new Color(), transform = new Matrix4(), scale = new Matrix4()
  const copies = parts.map(([hex, x, y, z, sx, sy, sz, shape = "box", rz = 0]) => {
   const copy = this.shapes[shape].clone(); color.setHex(hex)
   const colors = new Float32Array(copy.getAttribute("position").count * 3)
   for (let i = 0; i < colors.length; i += 3) { colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b }
   copy.setAttribute("color", new BufferAttribute(colors, 3))
   transform.makeRotationZ(rz).multiply(scale.makeScale(sx, sy, sz)).setPosition(x, y, z)
   return copy.applyMatrix4(transform)
  })
  const merged = this.keep(mergeGeometries(copies)!); copies.forEach(g => g.dispose()); return merged
 }
 actor(kind: EnemyKind | "knight" | "dummy" | "sensei", color = 0x4999d4): ActorGeometry {
  const key = `${kind}:${color}`; const cached = this.cache.get(key); if (cached) return cached
  const ink = 0x182332, bone = 0xd4c9a8, leather = 0x674330, steel = 0xadbcca, gold = 0xc99a4c
  let body: Part[], leg: Part[] | null = [[leather, 0, -.26, 0, .25, .52, .28], [ink, 0, -.54, .1, .30, .16, .48]], weapon: Part[] | null = [[leather, .46, .06, .04, .17, .46, .20], [gold, .48, -.12, .16, .48, .10, .12], [0xc8e6e7, .48, .40, .16, .12, .95, .09]], size = 1
  if (kind === "barrel" || kind === "chest") {
   body = kind === "barrel" ? [[0x845234, 0, .58, 0, .55, 1.1, .55, "cylinder"], [0x3f4048, 0, .28, 0, .59, .10, .59, "cylinder"], [0x3f4048, 0, .90, 0, .59, .10, .59, "cylinder"], [0xe45f3c, 0, 1.2, 0, .15, .16, .15]] : [[0x785130, 0, .43, 0, 1.1, .8, .75], [gold, 0, .86, 0, 1.14, .10, .78], [gold, 0, .45, .4, .18, .3, .08]]
   leg = weapon = null
  } else if (kind === "dummy") {
   body = [[0x9d7147, 0, .7, 0, .16, 1.4, .16], [0x785130, 0, .12, 0, .9, .2, .65], [0xae8352, 0, 1.1, 0, .85, .65, .45], [steel, 0, 1.12, .26, .65, .4, .05], [0xbe935e, 0, 1.75, 0, .55, .55, .5], [ink, -.12, 1.8, .27, .09, .1, .04], [ink, .12, 1.8, .27, .09, .1, .04], [0x795234, 0, 1.25, 0, 1.65, .18, .18]]; leg = weapon = null
  } else if (kind === "sensei" || kind === "mage") {
   const robe = kind === "sensei" ? 0x625ba0 : 0x4e386d
   body = [[robe, 0, .9, 0, .6, 1.2, .6, "cone"], [robe, 0, 1.3, 0, .65, .55, .45], [kind === "sensei" ? bone : ink, 0, 1.85, 0, .45, .46, .4], [robe, 0, 2.2, 0, .50, .60, .50, "cone"], [0xa9864f, 0, 1.98, 0, .55, .10, .55], [0xb497e9, 0, 1.85, .24, .23, .08, .03]]
   weapon = [[0x6c4834, .55, 0, 0, .10, 1.7, .10], [0xab7ad6, .55, .95, 0, .22, .34, .22, "round"]]
   leg = [[ink, 0, -.4, 0, .18, .7, .25]]
  } else if (kind === "skeleton" || kind === "bomber") {
   body = [[bone, 0, 1.15, 0, .14, .65, .14], [bone, 0, 1.35, 0, .7, .12, .22], [bone, 0, 1.1, 0, .60, .10, .25], [bone, 0, .89, 0, .46, .12, .25], [bone, 0, 1.85, 0, .53, .53, .45], [ink, -.13, 1.9, .24, .13, .13, .03], [ink, .13, 1.9, .24, .13, .13, .03], [ink, 0, 1.68, .24, .23, .07, .03], [bone, -.42, 1.1, 0, .13, .65, .13]]
   leg = [[bone, 0, -.30, 0, .13, .62, .13], [bone, 0, -.60, .10, .2, .12, .35]]
   weapon = kind === "bomber" ? [[0x312e39, .45, -.06, .16, .36, .45, .36, "round"], [0xe47840, .45, .45, .16, .08, .35, .08]] : [[bone, .43, -.04, 0, .14, .65, .14], [0x9a9d9b, .45, .30, .1, .09, .65, .07]]
  } else if (kind === "minotaur" || kind === "boss") {
   const armor = kind === "boss" ? 0x525969 : 0x7b858b
   body = [[0x594936, 0, 1.18, 0, .95, .85, .57], [armor, -.56, 1.45, 0, .42, .45, .60], [armor, .56, 1.45, 0, .42, .45, .6], [gold, 0, .87, .02, 1.0, .17, .63], [armor, 0, 1.98, 0, .75, .64, .61], [0xc3b89d, 0, 1.77, .4, .55, .30, .23], [0xeb805c, -.2, 2.04, .33, .1, .1, .04], [0xeb805c, .2, 2.04, .33, .1, .1, .04], [bone, -.50, 2.30, 0, .17, .6, .17, "cone", -.6], [bone, .5, 2.3, 0, .17, .6, .17, "cone", .6]]
   leg = [[leather, 0, -.3, 0, .34, .6, .35], [armor, 0, -.58, .12, .4, .2, .5]]
   weapon = [[0x6a4832, .62, .06, 0, .2, 1.4, .2], [armor, .62, .6, 0, .70, .58, .4], [gold, .62, .9, 0, .72, .10, .42]]
   size = kind === "boss" ? 2 : 1.35
  } else if (kind === "goblin") {
   body = [[0x755134, 0, 1.12, 0, .55, .56, .34], [0x81944c, 0, 1.68, 0, .52, .5, .43], [0x81944c, -.38, 1.72, 0, .28, .12, .2, "cone", 1.2], [0x81944c, .38, 1.72, 0, .28, .12, .2, "cone", -1.2], [0xf4cb65, -.13, 1.73, .24, .1, .08, .03], [0xf4cb65, .13, 1.73, .24, .1, .08, .03], [0x81944c, -.37, 1.14, 0, .2, .55, .2]]
   size = .88
  } else {
   body = [[color, 0, 1.12, 0, .66, .70, .45], [leather, 0, .83, 0, .70, .14, .48], [steel, -.43, 1.36, 0, .3, .35, .52], [steel, .43, 1.36, 0, .30, .35, .52], [color, 0, 1.90, 0, .64, .65, .57], [steel, 0, 2.23, 0, .66, .10, .59], [ink, 0, 1.94, .30, .50, .12, .04], [steel, 0, 1.83, .33, .08, .47, .05], [steel, -.39, 1.02, .13, .22, .38, .2]]
   if (kind === "guard") body.push([0x766040, -.5, 1.13, .31, .40, .70, .16], [gold, -.5, 1.13, .4, .08, .72, .02])
  }
  const result = { body: this.geometry(body), leg: leg ? this.geometry(leg) : null, weapon: weapon ? this.geometry(weapon) : null, scale: size }
  this.cache.set(key, result); return result
 }
 rig(kind: "knight" | "dummy" | "sensei", color?: number) {
  const model = this.actor(kind, color), root = new Group(), body = new Mesh(model.body, this.material), legs: Mesh[] = []
  root.add(body)
  if (model.leg) for (const x of [-.19, .19]) { const mesh = new Mesh(model.leg, this.material); mesh.position.set(x, .7, 0); legs.push(mesh); root.add(mesh) }
  const weapon = model.weapon ? new Mesh(model.weapon, this.material) : null
  if (weapon) { weapon.position.y = 1.16; root.add(weapon) }
  return { root, body, legs, weapon }
 }
 dispose() { this.geometries.forEach(g => g.dispose()); this.geometries.clear(); this.cache.clear(); this.material.dispose() }
}
