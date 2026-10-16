import { BufferAttribute, BufferGeometry, Color, ConeGeometry, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, SphereGeometry } from "three"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import type { EnemyKind } from "@typecade/contracts"

type Shape = "box" | "cone" | "round" | "cylinder"
type Part = [color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, shape?: Shape, rz?: number]
export interface ActorGeometry { body: BufferGeometry; leg: BufferGeometry | null; arm: BufferGeometry | null; weapon: BufferGeometry | null; scale: number }

/** Vertex-colored shared meshes keep a whole actor part in one draw call. */
export class DungeonModels {
 readonly geometries = new Set<BufferGeometry>()
 readonly material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })
 private shapes = { box: this.keep(new RoundedBoxGeometry(1, 1, 1, 1, .07)), cone: this.keep(new ConeGeometry(1, 1, 4)), round: this.keep(new SphereGeometry(1, 7, 4)), cylinder: this.keep(new CylinderGeometry(1, 1, 1, 8)) }
 private cache = new Map<string, ActorGeometry>()
 keep<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry }
 geometry(parts: Part[]) {
  const color = new Color(), transform = new Matrix4(), scale = new Matrix4()
  const copies = parts.map(([hex, x, y, z, sx, sy, sz, shape = "box", rz = 0]) => {
   const source=this.shapes[shape],copy=source.index?source.toNonIndexed():source.clone(); color.setHex(hex)
   const colors = new Float32Array(copy.getAttribute("position").count * 3)
   for (let i = 0; i < colors.length; i += 3) { colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b }
   copy.setAttribute("color", new BufferAttribute(colors, 3))
   transform.makeRotationZ(rz).multiply(scale.makeScale(sx, sy, sz)).setPosition(x, y, z)
   return copy.applyMatrix4(transform)
  })
  const merged = this.keep(mergeGeometries(copies)!); copies.forEach(g => g.dispose()); return merged
 }
 actor(kind: EnemyKind | "knight" | "dummy" | "sensei", color = kind==="guard"?0x92634f:0x4999d4): ActorGeometry {
  const key = `${kind}:${color}`; const cached = this.cache.get(key); if (cached) return cached
  const ink = 0x111b2b, bone = 0xeadbb2, leather = 0x543c36, steel = 0xbed4df, gold = 0xe8b966
  let body: Part[], leg: Part[] | null = [[ink, 0, -.23, 0, .32, .50, .35], [steel, 0, -.47, .05, .38, .22, .43], [ink, 0, -.59, .14, .43, .18, .63]], arm: Part[] | null = [[steel, 0, -.12, 0, .40, .40, .46], [leather, 0, -.40, .02, .28, .40, .31], [steel, 0, -.63, .08, .36, .27, .39]], weapon: Part[] | null = [[steel, 0, -.12, 0, .40, .40, .46], [leather, 0, -.42, .04, .28, .43, .31], [steel, 0, -.65, .10, .35, .25, .37], [gold, 0, -.35, .22, .66, .12, .18], [0x83bed6, 0, .36, .22, .22, 1.35, .12], [0xf1f9e7, -.08, .36, .23, .06, 1.30, .13], [gold, 0, -.80, .22, .19, .20, .18]], size = 1
  if(kind==="shield"||kind==="potion"||kind==="mana"||kind==="sentry"){
   if(kind==="shield")body=[[0x284b70,0,1.0,0,.95,.98,.20],[0x75def3,0,1.05,.12,.73,.73,.08],[gold,0,1.05,.18,.12,.68,.05],[gold,0,1.05,.18,.61,.12,.05],[0x284b70,0,.4,0,.65,.55,.22,"cone",Math.PI]]
   else if(kind==="potion")body=[[0xf5787d,0,.65,0,.42,.46,.42,"round"],[0xffc6a2,-.1,.78,.3,.11,.2,.08],[0xa9ccd4,0,1.13,0,.22,.3,.22,"cylinder"],[leather,0,1.32,0,.26,.13,.26,"cylinder"],[0xfef1d0,0,.64,.4,.36,.1,.04],[0xfef1d0,0,.64,.4,.10,.36,.04]]
   else if(kind==="mana")body=[[0x7688ef,0,.70,0,.48,1.1,.48,"cone"],[0xb7f0ff,0,1.16,0,.48,.55,.48,"cone",Math.PI],[gold,0,.19,0,.72,.14,.72,"cylinder"],[0x9ff5fa,-.11,.77,.2,.10,.5,.07]]
   else body=[[0x404f65,0,.18,0,1.1,.3,1.1],[gold,0,.4,0,.8,.2,.8],[0x607a93,0,.78,0,.48,.65,.48],[0x334257,0,1.24,0,.88,.4,.7],[0x85cde1,0,1.24,.48,.22,.22,.70],[gold,-.31,1.5,0,.12,.24,.5],[gold,.31,1.5,0,.12,.24,.5],[0x98edfa,0,1.58,0,.14,.28,.14,"round"]]
   leg=arm=weapon=null
  }else if(kind==="bat"){
   body=[[0x41364f,0,1.1,0,.46,.65,.44],[0x77608f,0,1.53,.08,.60,.47,.43],[0xff986c,-.14,1.56,.31,.13,.10,.04],[0xff986c,.14,1.56,.31,.13,.10,.04],[0x77608f,-.21,1.92,0,.24,.5,.25,"cone"],[0x77608f,.21,1.92,0,.24,.5,.25,"cone"],[bone,-.11,1.33,.28,.07,.16,.07,"cone",Math.PI],[bone,.11,1.33,.28,.07,.16,.07,"cone",Math.PI]]
   leg=[[0x675078,0,-.1,0,1.6,.12,.8],[0x8d679e,0,-.18,.08,1.25,.12,.48],[0xb69bc3,0,0,0,1.7,.08,.10]];arm=weapon=null;size=.8
  }else if (kind === "barrel" || kind === "chest") {
   body = kind === "barrel" ? [[0x845234, 0, .58, 0, .55, 1.1, .55, "cylinder"], [0x3f4048, 0, .28, 0, .59, .10, .59, "cylinder"], [0x3f4048, 0, .90, 0, .59, .10, .59, "cylinder"], [0xe45f3c, 0, 1.2, 0, .15, .16, .15]] : [[0x785130, 0, .43, 0, 1.1, .8, .75], [gold, 0, .86, 0, 1.14, .10, .78], [gold, 0, .45, .4, .18, .3, .08]]
   leg = arm = weapon = null
  } else if (kind === "dummy") {
   body = [[0x9d7147, 0, .7, 0, .16, 1.4, .16], [0x785130, 0, .12, 0, .9, .2, .65], [0xae8352, 0, 1.1, 0, .95, .75, .55], [steel, 0, 1.12, .31, .75, .5, .05], [0xbe935e, 0, 1.85, 0, .70, .65, .6], [ink, -.16, 1.9, .32, .10, .12, .04], [ink, .16, 1.9, .32, .10, .12, .04], [0x795234, 0, 1.25, 0, 1.85, .22, .22]]; leg = arm = weapon = null
  } else if (kind === "sensei" || kind === "mage") {
   const robe = kind === "sensei" ? 0x625ba0 : 0x4e386d
   body = [[robe, 0, .80, 0, 1.1, 1.4, .90, "cone"], [robe, 0, 1.32, 0, .85, .60, .63], [gold, 0, 1.02, .35, .14, .8, .1], [kind === "sensei" ? bone : ink, 0, 1.94, .08, .64, .59, .57], [robe, -.12, 2.40, 0, .90, .94, .80, "cone", .16], [gold, 0, 2.04, 0, 1.02, .13, .87], [0xd8a7ff, -.15, 1.96, .39, .12, .10, .04], [0xd8a7ff, .15, 1.96, .39, .12, .10, .04]]
   arm = [[robe, 0, -.3, 0, .33, .65, .4], [bone, 0, -.63, .06, .22, .18, .25]]
   weapon = [[robe, 0, -.23, 0, .32, .55, .35], [0x76553c, 0, -.2, .20, .13, 1.85, .13], [gold, 0, .60, .20, .32, .14, .32], [0xbca1ff, 0, .86, .20, .35, .45, .35, "round"]]
   leg = kind==="mage"?null:[[ink, 0, -.4, 0, .22, .7, .33]]
  } else if (kind === "skeleton" || kind === "bomber") {
   body = [[bone, 0, 1.13, 0, .20, .74, .23], [bone, 0, 1.42, 0, .86, .16, .35], [bone, 0, 1.20, .03, .76, .13, .36], [bone, 0, .99, 0, .62, .13, .35], [bone, 0, .78, 0, .60, .19, .35], [bone, 0, 1.98, .04, .83, .73, .70], [ink, -.21, 2.04, .40, .22, .23, .04], [ink, .21, 2.04, .40, .22, .23, .04], [0xed895e, -.21, 2.04, .43, .08, .08, .03], [0xed895e, .21, 2.04, .43, .08, .08, .03], [bone, 0, 1.61, .18, .52, .18, .50], [ink, 0, 1.69, .41, .39, .08, .04]]
   leg = [[bone, 0, -.26, 0, .19, .57, .20], [bone, 0, -.59, .11, .25, .16, .42]]
   arm = [[bone, 0, -.27, 0, .19, .57, .20], [bone, 0, -.60, .08, .24, .17, .30]]
   weapon = kind === "bomber" ? [[bone, 0, -.25, 0, .19, .56, .20], [0x312e39, 0, -.48, .23, .50, .53, .50, "round"], [0xffa83f, 0, -.03, .23, .09, .35, .09]] : [[bone, 0, -.27, 0, .19, .57, .20], [leather, 0, -.58, .20, .15, .3, .15], [steel, 0, -.02, .20, .18, .85, .10]]
  } else if (kind === "minotaur" || kind === "boss") {
   const armor = kind === "boss" ? 0x525969 : 0x7b858b
   body = [[0x594936, 0, 1.20, 0, 1.17, .92, .77], [armor, 0, 1.40, .42, .90, .59, .15], [gold, 0, .84, .02, 1.18, .20, .82], [armor, 0, 2.03, .08, .96, .80, .78], [0xc3b89d, 0, 1.82, .56, .68, .37, .32], [ink, -.25, 2.10, .49, .18, .16, .04], [ink, .25, 2.10, .49, .18, .16, .04], [0xff8352, -.25, 2.10, .52, .12, .10, .04], [0xff8352, .25, 2.10, .52, .12, .10, .04], [bone, -.63, 2.39, 0, .25, .79, .25, "cone", -.7], [bone, .63, 2.39, 0, .25, .79, .25, "cone", .7]]
   leg = [[leather, 0, -.3, 0, .34, .6, .35], [armor, 0, -.58, .12, .4, .2, .5]]
   arm = [[armor, 0, -.02, 0, .56, .54, .68], [leather, 0, -.43, 0, .37, .66, .42], [gold, 0, -.73, .05, .44, .22, .49]]
   weapon = [[armor, 0, -.02, 0, .56, .54, .68], [leather, 0, -.4, 0, .38, .65, .42], [0x6a4832, 0, -.15, .26, .2, 1.8, .2], [armor, 0, .67, .26, .95, .68, .56], [gold, 0, 1.0, .26, .98, .12, .60]]
   size = kind === "boss" ? 2 : 1.35
  } else if (kind === "goblin") {
   body = [[0x755134, 0, 1.05, 0, .76, .67, .55], [0x96b657, 0, 1.77, .12, .82, .72, .68], [0x96b657, -.55, 1.87, .04, .59, .22, .28, "cone", 1.1], [0x96b657, .55, 1.87, .04, .59, .22, .28, "cone", -1.1], [ink, -.20, 1.88, .48, .24, .15, .04], [ink, .20, 1.88, .48, .24, .15, .04], [0xffd76a, -.20, 1.88, .51, .12, .08, .03], [0xffd76a, .20, 1.88, .51, .12, .08, .03], [0x729343, 0, 1.64, .51, .28, .24, .27], [bone, -.18, 1.48, .48, .12, .23, .12, "cone"], [bone, .18, 1.48, .48, .12, .23, .12, "cone"]]
   leg = [[0x73904b, 0, -.24, 0, .25, .50, .28], [leather, 0, -.55, .13, .35, .22, .51]]
   arm = [[0x96b657, 0, -.25, 0, .26, .55, .29], [0x96b657, 0, -.58, .09, .32, .21, .34]]
   weapon = [[0x96b657, 0, -.27, 0, .27, .58, .30], [leather, 0, -.54, .16, .18, .30, .18], [steel, 0, -.02, .17, .28, .75, .14]]
   size = .92
  } else {
   body = [[ink, 0, 1.16, 0, .94, .82, .68], [color, 0, 1.22, .05, .84, .73, .68], [steel, 0, 1.48, .39, .72, .19, .12], [gold, 0, .82, .02, .98, .16, .76], [leather, 0, .68, .01, .81, .25, .58], [color, 0, 2.0, 0, 1.0, .86, .87], [steel, 0, 2.45, 0, 1.02, .11, .91], [ink, 0, 2.04, .45, .84, .20, .06], [0x81d9eb, -.24, 2.06, .49, .22, .06, .04], [0x81d9eb, .24, 2.06, .49, .22, .06, .04], [steel, 0, 1.94, .49, .12, .69, .10], [steel, 0, 1.68, .37, .88, .13, .18], [gold, 0, 2.46, -.02, .12, .15, .9], [0x263e63, 0, 1.15, -.44, .82, 1.18, .14], [color, 0, .66, -.49, .91, .25, .16]]
   arm.push([color, 0, -.52, .28, .46, .65, .13], [gold, 0, -.52, .37, .11, .52, .05])
   if (kind === "guard") arm.push([0x766040, 0, -.44, .37, .72, 1.08, .16], [gold, 0, -.44, .47, .12, .98, .04])
  }
  const result = { body: this.geometry(body), leg: leg ? this.geometry(leg) : null, arm: arm ? this.geometry(arm) : null, weapon: weapon ? this.geometry(weapon) : null, scale: size }
  this.cache.set(key, result); return result
 }
 rig(kind: "knight" | "dummy" | "sensei", color?: number) {
  const model = this.actor(kind, color), root = new Group(), body = new Mesh(model.body, this.material), legs: Mesh[] = []
  root.add(body)
  if (model.leg) for (const x of [-.25, .25]) { const mesh = new Mesh(model.leg, this.material); mesh.position.set(x, .7, 0); legs.push(mesh); root.add(mesh) }
  const weapon = model.weapon ? new Mesh(model.weapon, this.material) : null
  if (weapon) { weapon.position.set(.62, 1.52, 0); root.add(weapon) }
  const arm = model.arm ? new Mesh(model.arm, this.material) : null
  if (arm) { arm.position.set(-.62, 1.52, 0); root.add(arm) }
  return { root, body, legs, weapon, arm }
 }
 dispose() { this.geometries.forEach(g => g.dispose()); this.geometries.clear(); this.cache.clear(); this.material.dispose() }
}
