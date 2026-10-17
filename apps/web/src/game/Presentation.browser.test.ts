import { expect, it } from "vitest"
import { Scene, type Mesh } from "three"
import { bestiary, enemyLunges } from "@typecade/content"
import { SurvivalRun, createSeededRng, ruinsInChunk } from "@typecade/game-rules"
import { DungeonModels } from "./DungeonModels"
import { WeaponVisuals } from "./scene/WeaponVisuals"
import { enemyMotionPose } from "./scene/EnemyMotion"
import { heroPose, moveDuration, selectMove } from "./scene/HeroMoves"
import { buildRuin } from "./scene/RuinBuilder"
import { signaturePainters } from "./vfx/signatureEffects"
import { DungeonVfx } from "./DungeonVfx"
import { renderPortraits } from "./portraits"

it("renders every signature with finite bounded geometry, including reduced effects and zero-distance arcs",()=>{
 const scene=new Scene(),vfx=new DungeonVfx(scene)
 try{
  for(const kind of Object.keys(signaturePainters) as Array<keyof typeof signaturePainters>)for(const reduced of [false,true])for(const power of [0,1,5])for(const t of [.01,.2,.4,.7,.99]){
   const draws:number[][]=[]
   signaturePainters[kind]((_,...args)=>{expect(args.every(Number.isFinite)).toBe(true);draws.push(args)}, {x:0,z:0,power,angle:.5},t,1-t,reduced)
   signaturePainters[kind]((_,...args)=>expect(args.every(Number.isFinite)).toBe(true), {x:0,z:0,power,angle:0,end:{x:0,z:0},tint:0xff0000},t,1-t,reduced)
   vfx.clear();vfx.emit(kind,0,0,0,power,{x:4,z:3},0xff0000);vfx.update(t*.5,reduced)
   for(const batch of [vfx.sparks,vfx.arcs,vfx.rings,vfx.bolts,vfx.glows])expect(batch.count).toBeLessThanOrEqual(batch.instanceMatrix.count)
  }
 }finally{vfx.dispose()}
})

it("keeps weapon telegraphs aligned with simulation positions and releases their resources",()=>{
 const scene=new Scene(),models=new DungeonModels(),visual=new WeaponVisuals(scene,models),s=new SurvivalRun("visual-weapons").state
 try{
  visual.update(null,0,0,0,false)
  for(const level of [1,5])for(const reduced of [false,true]){
   s.weapons.orbit.level=s.weapons.nova.level=s.weapons.frost.level=level
   for(const timer of [0,2,20]){s.weapons.nova.timer=s.weapons.frost.timer=timer;visual.update(s,1,2,3,reduced)}
   const rings=scene.children.filter(x=>(x as Mesh).geometry?.type==="RingGeometry")
   expect(rings.every(x=>x.visible)).toBe(true)
  }
  visual.hide();expect(scene.children.filter(x=>x.visible)).toHaveLength(2)
 }finally{visual.dispose();models.dispose()}
 expect(scene.children).toHaveLength(0)
})

it("gives attacks anticipation, airborne commitment and recovery without moving the simulation",()=>{
 for(const [move,duration] of Object.entries(moveDuration)){
  expect(duration).toBeGreaterThan(0)
  for(const t of [0,.25,.6,1])expect(Object.values(heroPose(move as keyof typeof moveDuration,t,-1)).every(Number.isFinite)).toBe(true)
 }
 for(const [context,expected] of [[{finisher:true,whirl:true,targetLayers:3,wordsCompleted:0},"finisher"],[{finisher:false,whirl:true,targetLayers:3,wordsCompleted:0},"whirl"],[{finisher:false,whirl:false,targetLayers:2,wordsCompleted:0},"leap"],[{finisher:false,whirl:false,targetLayers:1,wordsCompleted:3},"twin"]] as const)expect(selectMove(context)).toBe(expected)
 for(const kind of bestiary.map(entry=>entry.kind))for(const motion of [undefined,"windup","charge","slam","recover"] as const)for(const reduced of [false,true]){
  const actor={kind,id:1,motion,motionTime:.1};expect(Object.values(enemyMotionPose(actor,2,reduced)).every(Number.isFinite)).toBe(true)
 }
 expect(enemyMotionPose({kind:"goblin",id:1,motion:"charge"},0,false).lift).toBeGreaterThanOrEqual(0)
 expect(enemyMotionPose({kind:"golem",id:1,motion:"charge",motionTime:.1},0,false).squash).toBeLessThan(0)
 expect(Object.keys(enemyLunges).length).toBeGreaterThan(10)
})

it("builds all ruin archetypes reproducibly with finite geometry and usable light anchors",()=>{
 const kinds=new Set<string>()
 for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)for(const ruin of ruinsInChunk(x,z)){
  const make=()=>buildRuin(ruin,createSeededRng(String(ruin.seed)).nextFloat)
  const a=make();expect(a).toEqual(make());expect(a.blocks.length).toBeGreaterThan(0)
  expect(a.blocks.every(block=>Object.values(block).every(Number.isFinite))).toBe(true);kinds.add(ruin.archetype)
 }
 expect(kinds.size).toBe(6)
})

it("memoizes in-engine portraits of every enemy and disposes the temporary WebGL context",async()=>{
 const all=bestiary.map(entry=>entry.kind),pending=renderPortraits(all)
 expect(renderPortraits(all)).toBe(pending)
 const result=await pending;expect(Object.keys(result)).toHaveLength(all.length)
 expect(Object.values(result).every(value=>value?.startsWith("data:image/png"))).toBe(true)
 expect(document.querySelectorAll("canvas")).toHaveLength(0)
},20000)
