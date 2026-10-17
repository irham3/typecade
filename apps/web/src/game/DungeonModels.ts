import { BufferAttribute, BufferGeometry, Color, ConeGeometry, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, SphereGeometry } from "three"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import type { EnemyKind } from "@typecade/contracts"
import type { Part } from "./models/blueprint"
import { monsterBlueprints } from "./models/monsters"
import { GLOW_ATTRIBUTE, glowColors, withVertexGlow } from "./render/vertexGlow"
export interface ActorGeometry { body: BufferGeometry; leg: BufferGeometry | null; arm: BufferGeometry | null; weapon: BufferGeometry | null; scale: number }

/** Vertex-colored shared meshes keep a whole actor part in one draw call. */
export class DungeonModels {
 readonly geometries = new Set<BufferGeometry>()
 readonly material = withVertexGlow(new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .85, metalness: .05 }))
 private shapes = { box: this.keep(new RoundedBoxGeometry(1, 1, 1, 1, .07)), cone: this.keep(new ConeGeometry(1, 1, 4)), round: this.keep(new SphereGeometry(1, 7, 4)), cylinder: this.keep(new CylinderGeometry(1, 1, 1, 8)) }
 private cache = new Map<string, ActorGeometry>()
 keep<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry }
 /** Vertex-colored materials read a `color` attribute; without one WebGL feeds black, so plain primitives get a white base for instance tints. */
 tinted<T extends BufferGeometry>(geometry: T): T { geometry.setAttribute("color", new BufferAttribute(new Float32Array(geometry.getAttribute("position").count * 3).fill(1), 3)); return this.keep(geometry) }
 geometry(parts: Part[]) {
  const color = new Color(), transform = new Matrix4(), scale = new Matrix4()
  const copies = parts.map(([hex, x, y, z, sx, sy, sz, shape = "box", rz = 0]) => {
   const source=this.shapes[shape],copy=source.index?source.toNonIndexed():source.clone(); color.setHex(hex)
   const colors = new Float32Array(copy.getAttribute("position").count * 3)
   for (let i = 0; i < colors.length; i += 3) { colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b }
   copy.setAttribute("color", new BufferAttribute(colors, 3))
   copy.setAttribute(GLOW_ATTRIBUTE, new BufferAttribute(new Float32Array(copy.getAttribute("position").count).fill(glowColors.has(hex) ? 1 : 0), 1))
   transform.makeRotationZ(rz).multiply(scale.makeScale(sx, sy, sz)).setPosition(x, y, z)
   return copy.applyMatrix4(transform)
  })
  const merged = this.keep(mergeGeometries(copies)!); copies.forEach(g => g.dispose()); return merged
 }
 actor(kind: EnemyKind | "knight" | "dummy" | "sensei", color = kind==="guard"?0x92634f:0x4999d4): ActorGeometry {
  const key = `${kind}:${color}`; const cached = this.cache.get(key); if (cached) return cached
  const blueprint = monsterBlueprints[kind as EnemyKind]?.()
  if (blueprint) {
   const built = { body: this.geometry(blueprint.body), leg: blueprint.leg ? this.geometry(blueprint.leg) : null, arm: blueprint.arm ? this.geometry(blueprint.arm) : null, weapon: blueprint.weapon ? this.geometry(blueprint.weapon) : null, scale: blueprint.scale }
   this.cache.set(key, built); return built
  }
  const ink = 0x111b2b, bone = 0xeadbb2, leather = 0x543c36, steel = 0xbed4df, gold = 0xe8b966
  let body: Part[], leg: Part[] | null = [[ink, 0, -.23, 0, .32, .50, .35], [steel, 0, -.47, .05, .38, .22, .43], [ink, 0, -.59, .14, .43, .18, .63]], arm: Part[] | null = [[steel, 0, -.12, 0, .40, .40, .46], [leather, 0, -.40, .02, .28, .40, .31], [steel, 0, -.63, .08, .36, .27, .39]], weapon: Part[] | null = [[steel, 0, -.12, 0, .40, .40, .46], [leather, 0, -.42, .04, .28, .43, .31], [steel, 0, -.65, .10, .35, .25, .37], [gold, 0, -.35, .22, .66, .12, .18], [0x83bed6, 0, .36, .22, .22, 1.35, .12], [0xf1f9e7, -.08, .36, .23, .06, 1.30, .13], [gold, 0, -.80, .22, .19, .20, .18]], size = 1
  if(kind==="shield"||kind==="potion"||kind==="mana"||kind==="sentry"){
   if(kind==="shield")body=[[0x284b70,0,1.0,0,.95,.98,.20],[0x75def3,0,1.05,.12,.73,.73,.08],[gold,0,1.05,.17,.3,.3,.06,"round"],[0xfff0c0,0,1.05,.21,.13,.13,.05,"round"],[gold,0,1.5,.14,.6,.08,.06],[gold,0,.62,.14,.4,.08,.06],[0x284b70,0,.4,0,.65,.55,.22,"cone",Math.PI]]
   else if(kind==="potion")body=[[0xf5787d,0,.65,0,.42,.46,.42,"round"],[0xffc6a2,-.1,.78,.3,.11,.2,.08],[0xa9ccd4,0,1.13,0,.22,.3,.22,"cylinder"],[leather,0,1.32,0,.26,.13,.26,"cylinder"],[0xfef1d0,0,.64,.4,.3,.3,.04,"round"],[0xff5a6a,-.06,.68,.43,.1,.1,.03,"round"],[0xff5a6a,.06,.68,.43,.1,.1,.03,"round"],[0xff5a6a,0,.6,.43,.1,.1,.03,"cone",Math.PI]]
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
   body = [[0x9d7147, 0, .7, 0, .16, 1.4, .16], [0x785130, 0, .12, 0, .9, .2, .65], [0xae8352, 0, 1.1, 0, .95, .75, .55], [steel, 0, 1.12, .31, .75, .5, .05], [0xbe935e, 0, 1.85, 0, .70, .65, .6], [ink, -.16, 1.9, .32, .10, .12, .04], [ink, .16, 1.9, .32, .10, .12, .04], [0x795234, -.55, 1.18, 0, .9, .2, .2, "box", -.45], [0x795234, .55, 1.18, 0, .9, .2, .2, "box", .45]]; leg = arm = weapon = null
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
  } else if (kind === "wolf") {
   const fur=0x6f7a86,pale=0x9aa4ae,dark=0x3e4652,eye=0xffd25a
   body=[[fur,0,.95,0,.62,.55,1.25],[pale,0,.88,.5,.55,.5,.42],[fur,0,1.25,.92,.5,.45,.5],[pale,0,1.12,1.25,.28,.22,.38],[ink,0,1.2,1.46,.11,.08,.06],[fur,-.16,1.55,.86,.12,.28,.12,"cone"],[fur,.16,1.55,.86,.12,.28,.12,"cone"],[eye,-.13,1.32,1.17,.08,.06,.03],[eye,.13,1.32,1.17,.08,.06,.03],[dark,0,1.12,-.82,.16,.16,.62],[pale,0,1.12,-1.14,.14,.14,.12],[dark,0,1.24,0,.5,.12,1.0]]
   leg=[[fur,0,-.32,.42,.16,.62,.18],[fur,0,-.32,-.42,.16,.62,.18],[dark,0,-.62,.48,.2,.1,.24],[dark,0,-.62,-.38,.2,.1,.24]];arm=weapon=null;size=.95
  } else if (kind === "rat") {
   body=[[0x7a6a5e,0,.42,0,.46,.38,.78],[0x8a7a6d,0,.48,.5,.34,.3,.36],[0xe8a0a0,-.13,.7,.45,.11,.11,.04,"round"],[0xe8a0a0,.13,.7,.45,.11,.11,.04,"round"],[0xff5a5a,-.08,.55,.68,.05,.05,.03],[0xff5a5a,.08,.55,.68,.05,.05,.03],[0xff9a9a,0,.46,.72,.07,.06,.05],[0xd29a8f,0,.36,-.75,.06,.06,.72],[0x5f5147,0,.62,-.05,.36,.08,.55],[0x6a5a4e,-.2,.12,.25,.1,.16,.12],[0x6a5a4e,.2,.12,.25,.1,.16,.12],[0x6a5a4e,-.2,.12,-.25,.1,.16,.12],[0x6a5a4e,.2,.12,-.25,.1,.16,.12]]
   leg=arm=weapon=null;size=.85
  } else if (kind === "slime") {
   body=[[0x6fd38a,0,.55,0,.78,.55,.78,"round"],[0x3f9a5c,0,.48,0,.38,.3,.38,"round"],[0xc8ffd6,-.24,.82,.36,.16,.1,.05],[ink,-.18,.7,.64,.09,.13,.04],[ink,.18,.7,.64,.09,.13,.04],[0xffffff,-.16,.74,.67,.03,.04,.02],[0xffffff,.2,.74,.67,.03,.04,.02],[0x58b874,0,.12,0,.9,.1,.9,"cylinder"]]
   leg=arm=weapon=null
  } else if (kind === "spider" || kind === "beetle") {
   const spider=kind==="spider",legColor=spider?0x2c2433:0x1f3540
   body=spider?[[0x3d3346,0,.72,-.38,.62,.52,.72,"round"],[0x52445d,0,.62,.3,.4,.32,.4,"round"],[0xff5a5a,-.09,.74,.63,.06,.06,.03],[0xff5a5a,.09,.74,.63,.06,.06,.03],[0xff5a5a,-.18,.7,.58,.05,.05,.03],[0xff5a5a,.18,.7,.58,.05,.05,.03],[bone,-.07,.48,.62,.04,.13,.04,"cone",Math.PI],[bone,.07,.48,.62,.04,.13,.04,"cone",Math.PI],[0xff8c4a,0,1.0,-.42,.22,.08,.28]]
    :[[0x2f5f73,0,.75,-.05,.9,.55,1.1,"round"],[ink,0,1.05,-.05,.04,.22,1.05],[0x4a8aa3,-.22,.98,.15,.16,.08,.4],[0x22313a,0,.66,.62,.52,.38,.4],[0xd8c27a,0,1.02,.82,.13,.5,.13,"cone"],[bone,-.16,.55,.88,.06,.06,.28],[bone,.16,.55,.88,.06,.06,.28],[0xffe27a,-.18,.78,.82,.07,.06,.03],[0xffe27a,.18,.78,.82,.07,.06,.03]]
   const legs=(sign:number):Part[]=>(spider?[.35,.12,-.12,-.36]:[.3,0,-.3]).flatMap(z=>[[legColor,sign*.22,-.88,z,spider?.62:.42,.07,.07,"box",sign*-.55] as Part,[legColor,sign*.52,-1.2,z+(spider?.06:0),.07,spider?.42:.3,.07] as Part])
   arm=legs(-1);weapon=legs(1);leg=null;size=spider?1:1.05
  } else if (kind === "serpent") {
   const green=0x5f8f3e,light=0x6fa64a
   body=[[green,0,.22,-1.2,.22,.2,.4,"round"],[green,0,.3,-.85,.34,.3,.45],[light,0,.33,-.42,.4,.34,.5],[green,0,.36,0,.42,.36,.5],[light,0,.62,.32,.38,.55,.32],[green,0,1.0,.45,.34,.42,.3],[0x7cb556,0,1.26,.62,.44,.3,.52],[0xffe05a,-.14,1.34,.84,.07,.05,.03],[0xffe05a,.14,1.34,.84,.07,.05,.03],[0xff5a6a,0,1.18,.95,.05,.03,.2],[0xd9cf8a,0,.95,.61,.24,.5,.05],[0x3f6a2a,0,.55,-.42,.2,.06,.4]]
   leg=arm=weapon=null;size=1.05
  } else if (kind === "wraith") {
   const cloak=0x2b3550,hood=0x39456a,glow=0x8ff5ff
   body=[[cloak,0,1.0,0,.95,1.75,.85,"cone"],[hood,0,1.85,0,.62,.62,.56,"round"],[0x0b0f1a,0,1.82,.3,.4,.4,.05],[glow,-.11,1.88,.33,.08,.05,.03],[glow,.11,1.88,.33,.08,.05,.03],[0x1f2740,-.32,.25,.2,.18,.4,.12,"cone",Math.PI],[0x1f2740,.3,.22,-.2,.18,.45,.12,"cone",Math.PI],[0x4a5a86,0,1.45,.38,.5,.08,.06]]
   arm=[[hood,0,-.3,0,.22,.62,.25],[0xa9e9ff,0,-.68,.05,.15,.15,.15,"round"]]
   weapon=[[hood,0,-.3,0,.22,.62,.25],[0x5a4a3a,0,-.1,.2,.08,1.85,.08],[0xc9d8e0,0,.78,.48,.06,.16,.62],[glow,0,.7,.7,.04,.06,.2]];leg=null
  } else if (kind === "imp") {
   const red=0xc8463c
   body=[[red,0,1.0,0,.55,.6,.45],[0xd8574a,0,1.5,.05,.5,.45,.45],[0xf1e2b5,-.17,1.84,0,.09,.26,.09,"cone",.4],[0xf1e2b5,.17,1.84,0,.09,.26,.09,"cone",-.4],[0xffe46a,-.11,1.55,.28,.08,.06,.03],[0xffe46a,.11,1.55,.28,.08,.06,.03],[ink,0,1.38,.28,.18,.04,.03],[0x6b2c3a,-.48,1.28,-.2,.36,.58,.08,"cone",1.2],[0x6b2c3a,.48,1.28,-.2,.36,.58,.08,"cone",-1.2],[0x9c3530,0,.72,-.4,.08,.08,.48],[0x9c3530,0,.72,-.68,.12,.16,.06,"cone",Math.PI/2]]
   arm=[[red,0,-.25,0,.18,.45,.2]];weapon=[[red,0,-.25,0,.18,.45,.2],[0xffa040,0,-.55,.15,.22,.22,.22,"round"],[0xfff0a0,0,-.55,.15,.12,.12,.12,"round"]];leg=null;size=.8
  } else if (kind === "archer") {
   body=[[bone,0,1.13,0,.20,.74,.23],[bone,0,1.42,0,.86,.16,.35],[bone,0,1.20,.03,.76,.13,.36],[bone,0,.99,0,.62,.13,.35],[bone,0,1.98,.04,.83,.73,.70],[ink,-.21,2.04,.40,.22,.23,.04],[ink,.21,2.04,.40,.22,.23,.04],[0x7dffb0,-.21,2.04,.43,.08,.08,.03],[0x7dffb0,.21,2.04,.43,.08,.08,.03],[0x3f5a36,0,2.28,-.05,.98,.5,.82],[0x3f5a36,0,2.2,-.3,.9,.9,.3],[leather,0,1.45,-.36,.26,.75,.26,"cylinder"],[0xe6e0cc,0,1.92,-.36,.04,.3,.04],[0xe6e0cc,.08,1.92,-.36,.04,.3,.04]]
   leg=[[bone,0,-.26,0,.19,.57,.20],[bone,0,-.59,.11,.25,.16,.42]];arm=[[bone,0,-.27,0,.19,.57,.20],[bone,0,-.60,.08,.24,.17,.30]]
   weapon=[[bone,0,-.27,0,.19,.57,.20],[0x7a5a3a,0,-.3,.28,.08,1.45,.08],[0x7a5a3a,0,.38,.36,.06,.3,.06,"box",.4],[0x7a5a3a,0,-.98,.36,.06,.3,.06,"box",-.4],[0xe6e0cc,0,-.3,.4,.02,1.35,.02]]
  } else if (kind === "shaman" || kind === "necromancer") {
   const shaman=kind==="shaman",robe=shaman?0x7b5a3a:0x2a2233
   body=shaman?[[robe,0,.9,0,.85,1.2,.7,"cone"],[0x96b657,0,1.75,.08,.72,.62,.6],[0x96b657,-.52,1.85,.04,.5,.2,.26,"cone",1.1],[0x96b657,.52,1.85,.04,.5,.2,.26,"cone",-1.1],[0xe6d7b0,0,1.75,.4,.5,.5,.06],[0xd04a3a,0,1.7,.44,.06,.36,.02],[0x2a1a10,-.12,1.82,.44,.1,.06,.02],[0x2a1a10,.12,1.82,.44,.1,.06,.02],[0x4fa3d9,-.2,2.22,0,.08,.46,.08,"cone",.3],[0xe8b966,.2,2.22,0,.08,.46,.08,"cone",-.3],[gold,0,1.3,.33,.52,.08,.1]]
    :[[robe,0,.85,0,1.0,1.5,.85,"cone"],[0x3a2d48,0,1.4,0,.75,.55,.55],[bone,0,1.95,.1,.55,.52,.5],[robe,0,2.18,-.05,.78,.78,.72,"cone"],[0x7dff9a,-.13,1.98,.36,.09,.07,.03],[0x7dff9a,.13,1.98,.36,.09,.07,.03],[ink,0,1.82,.36,.22,.05,.03],[bone,-.36,1.66,0,.1,.32,.1,"cone",.6],[bone,.36,1.66,0,.1,.32,.1,"cone",-.6],[0x5d2f7a,0,1.12,.42,.18,.5,.04]]
   arm=[[shaman?0x96b657:0x3a2d48,0,-.25,0,.26,.55,.28],[shaman?0x96b657:bone,0,-.6,.06,.2,.18,.22]]
   weapon=shaman?[[0x96b657,0,-.25,0,.24,.5,.27],[0x6a4a2e,0,-.1,.2,.12,1.7,.12],[0xe6d7b0,0,.8,.2,.3,.3,.3],[0x7fe0a0,0,.8,.38,.1,.1,.05],[0x4fa3d9,.18,.95,.2,.05,.3,.05]]
    :[[0x3a2d48,0,-.25,0,.28,.55,.3],[0x4a3a2a,0,-.15,.2,.1,1.9,.1],[bone,0,.88,.2,.3,.3,.3,"round"],[0x7dff9a,0,.88,.38,.1,.07,.03],[0x7dff9a,0,1.1,.2,.06,.06,.06,"round"]]
   leg=shaman?[[0x73904b,0,-.3,0,.22,.5,.26],[leather,0,-.55,.1,.3,.16,.4]]:null;size=shaman?.95:1.05
  } else if (kind === "golem" || kind === "troll") {
   const golem=kind==="golem",skin=golem?0x7d7a72:0x6f8f6a,dark=golem?0x6a675f:0x5c7a58
   body=golem?[[skin,0,1.3,0,1.3,1.1,.95],[0x7fd6ff,0,1.35,.48,.3,.3,.05],[0x8f8b82,0,2.15,.1,.65,.5,.6],[0x7fd6ff,-.15,2.18,.4,.12,.06,.03],[0x7fd6ff,.15,2.18,.4,.12,.06,.03],[dark,-.75,1.75,0,.55,.45,.6],[dark,.75,1.75,0,.55,.45,.6],[0x5f7a45,-.3,1.9,.3,.4,.12,.3],[0x5f7a45,.45,2.4,.1,.25,.1,.25],[dark,0,.75,0,1.0,.3,.75]]
    :[[skin,0,1.15,0,1.1,1.0,.85],[0x9fb88a,0,1.0,.4,.75,.6,.1],[0x7fa078,0,1.95,.25,.65,.55,.6],[0x8fb088,0,1.9,.6,.2,.32,.2,"cone"],[bone,-.16,1.75,.55,.07,.2,.07,"cone"],[bone,.16,1.75,.55,.07,.2,.07,"cone"],[0xffcf4a,-.16,2.04,.52,.08,.06,.03],[0xffcf4a,.16,2.04,.52,.08,.06,.03],[0x4a3a2a,0,2.3,.15,.5,.15,.45],[leather,0,.62,.3,.8,.35,.1],[0x4f6a4c,-.3,1.4,.42,.15,.15,.05,"round"]]
   leg=[[dark,0,-.3,0,golem?.45:.38,.65,golem?.5:.42],[golem?0x5a574f:leather,0,-.62,.08,golem?.5:.42,.2,golem?.6:.5]]
   arm=[[dark,0,-.2,0,.5,.6,.55],[skin,0,-.7,.05,.58,.5,.58]]
   weapon=golem?[[dark,0,-.2,0,.5,.6,.55],[skin,0,-.7,.05,.62,.55,.62],[0x7fd6ff,0,-.7,.38,.15,.15,.04]]:[[skin,0,-.25,0,.32,.6,.35],[0x6a4a2e,0,-.3,.25,.25,1.3,.25,"cylinder"],[0x5a3a22,0,.35,.25,.44,.5,.44,"round"],[bone,.2,.45,.25,.08,.16,.08,"cone",-1]]
   size=golem?1.45:1.3
  } else if (kind === "assassin") {
   const dark=0x2a2f3a,crimson=0x7a2f3a
   body=[[dark,0,1.15,0,.75,.85,.55],[0x1d2230,0,1.05,-.32,.85,1.25,.12],[dark,0,1.95,0,.62,.6,.6],[0x111520,0,1.88,.3,.46,.2,.04],[0xff4a5a,-.12,1.98,.31,.08,.04,.03],[0xff4a5a,.12,1.98,.31,.08,.04,.03],[crimson,0,.78,0,.78,.12,.58],[crimson,0,1.58,.2,.62,.12,.42],[crimson,.2,1.3,-.38,.12,.6,.04],[steel,-.25,.8,.3,.06,.3,.06]]
   leg=[[dark,0,-.26,0,.2,.56,.22],[0x111520,0,-.58,.1,.24,.16,.36]]
   arm=[[dark,0,-.27,0,.22,.55,.25],[0xcfd8e0,0,-.45,.25,.06,.5,.08]];weapon=[[dark,0,-.27,0,.22,.55,.25],[0xcfd8e0,0,-.45,.25,.06,.55,.08],[crimson,0,-.62,.12,.1,.1,.1]];size=.95
  } else if (kind === "wisp") {
   body=[[0xffd27a,0,1.1,0,.52,.52,.52,"round"],[0xffffff,0,1.1,0,.3,.3,.3,"round"],[0xffa64a,0,1.55,0,.36,.62,.36,"cone"],[0xffe9a8,0,1.85,0,.16,.3,.16,"cone"],[ink,-.11,1.15,.44,.07,.09,.03],[ink,.11,1.15,.44,.07,.09,.03],[0xffb85a,-.4,.9,0,.12,.12,.12,"round"],[0xffb85a,.36,1.3,-.2,.1,.1,.1,"round"]]
   leg=arm=weapon=null;size=.9
  } else if (kind === "goblin") {
   body = [[0x755134, 0, 1.05, 0, .76, .67, .55], [0x96b657, 0, 1.77, .12, .82, .72, .68], [0x96b657, -.55, 1.87, .04, .59, .22, .28, "cone", 1.1], [0x96b657, .55, 1.87, .04, .59, .22, .28, "cone", -1.1], [ink, -.20, 1.88, .48, .24, .15, .04], [ink, .20, 1.88, .48, .24, .15, .04], [0xffd76a, -.20, 1.88, .51, .12, .08, .03], [0xffd76a, .20, 1.88, .51, .12, .08, .03], [0x729343, 0, 1.64, .51, .28, .24, .27], [bone, -.18, 1.48, .48, .12, .23, .12, "cone"], [bone, .18, 1.48, .48, .12, .23, .12, "cone"]]
   leg = [[0x73904b, 0, -.24, 0, .25, .50, .28], [leather, 0, -.55, .13, .35, .22, .51]]
   arm = [[0x96b657, 0, -.25, 0, .26, .55, .29], [0x96b657, 0, -.58, .09, .32, .21, .34]]
   weapon = [[0x96b657, 0, -.27, 0, .27, .58, .30], [leather, 0, -.54, .16, .18, .30, .18], [steel, 0, -.02, .17, .28, .75, .14]]
   size = .92
  } else {
   body = [[ink, 0, 1.16, 0, .94, .82, .68], [color, 0, 1.22, .05, .84, .73, .68], [steel, 0, 1.48, .39, .72, .19, .12], [gold, 0, .82, .02, .98, .16, .76], [leather, 0, .68, .01, .81, .25, .58], [color, 0, 2.0, 0, 1.0, .86, .87], [steel, 0, 2.45, 0, 1.02, .11, .91], [ink, 0, 2.04, .45, .84, .20, .06], [0x81d9eb, -.24, 2.06, .49, .22, .06, .04], [0x81d9eb, .24, 2.06, .49, .22, .06, .04], [steel, 0, 1.68, .37, .88, .13, .18], [0xff5c4d, 0, 2.62, -.18, .18, .5, .55, "round"], [gold, 0, 2.46, -.02, .12, .15, .9], [0x263e63, 0, 1.15, -.44, .82, 1.18, .14], [color, 0, .66, -.49, .91, .25, .16]]
   arm.push([color, 0, -.52, .28, .46, .65, .13], [gold, 0, -.52, .37, .16, .16, .05, "round"])
   }
  if(kind==="knight")body.push([gold,-.43,2.46,0,.12,.14,.85],[gold,.43,2.46,0,.12,.14,.85],[0x6cabc3,0,2.76,-.14,.22,.52,.35,"cone"],[leather,-.32,.95,.38,.18,.27,.15],[gold,0,1.25,.43,.16,.25,.04])
  if(kind==="boss"||kind==="minotaur")body.push([bone,-.91,2.61,0,.21,1.12,.21,"cone",-.95],[bone,.91,2.61,0,.21,1.12,.21,"cone",.95],[gold,-.68,1.55,.02,.30,.22,.78],[gold,.68,1.55,.02,.30,.22,.78],[0xff9b55,0,1.4,.52,.24,.30,.07],[0x363b4e,0,1.15,-.5,.96,1.1,.2])
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
