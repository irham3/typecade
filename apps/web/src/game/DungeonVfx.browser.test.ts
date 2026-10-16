import { expect, it, vi } from "vitest"
import { Scene } from "three"
import { DungeonVfx, type VisualEffect } from "./DungeonVfx"

it("gives slash, lightning and healing different geometry and bounds simultaneous bursts",()=>{
 const scene=new Scene(),vfx=new DungeonVfx(scene)
 try{
  vfx.emit("cleave",0,0);vfx.update(.08,false)
  expect(vfx.arcs.count).toBe(2);expect(vfx.rings.count).toBe(1);expect(vfx.bolts.count).toBe(0)
  vfx.clear();vfx.emit("storm",0,0);vfx.update(.08,false)
  expect(vfx.bolts.count).toBe(4);expect(vfx.arcs.count).toBe(0)
  vfx.clear();vfx.emit("heal",0,0);vfx.update(.08,false)
  expect(vfx.rings.count).toBe(1);expect(vfx.sparks.count).toBe(10);expect(vfx.bolts.count).toBe(0)
  vfx.clear();vfx.emit("spawn",0,0);vfx.emit("hit",0,0);vfx.emit("shatter",0,0);vfx.update(.03,false);expect(vfx.sparks.count).toBe(24);expect(vfx.rings.count).toBe(2)
  vfx.clear();for(const kind of ["hurt","level","upgrade"] as const)vfx.emit(kind,0,0);vfx.update(.03,false);expect(vfx.rings.count).toBe(3);expect(vfx.sparks.count).toBe(24)
  const kinds:VisualEffect[]=["slash","cleave","hit","storm","lightning","heal","pickup","shatter","magnet","death","dust","block","dash","spawn","hurt","level","upgrade"]
  vfx.clear()
  for(let i=0;i<96;i++)vfx.emit(kinds[i%kinds.length]!,i%4,i%3,.5,1,{x:5,z:5})
  vfx.update(.12,false);expect(vfx.count).toBe(24);expect(vfx.sparks.count).toBe(128)
  for(let i=0;i<32;i++)vfx.groundLight(i,0,0xffa34b,.2)
  expect(vfx.glows.count).toBe(24)
  for(const mesh of [vfx.sparks,vfx.arcs,vfx.rings,vfx.bolts,vfx.glows])expect(mesh.count).toBeLessThanOrEqual(mesh.instanceMatrix.count)
  vfx.update(.12,true);expect(vfx.sparks.count).toBe(0);expect(vfx.bolts.count).toBe(0);expect(vfx.rings.count).toBeGreaterThan(0)
  vfx.update(1,false);expect(vfx.count).toBe(0)
  vfx.clear();vfx.update(0,false);expect(vfx.sparks.count).toBe(0)
  vfx.emit("dash",0,0,0,1,{x:3,z:3});vfx.update(.04,false);expect(vfx.sparks.count).toBe(4);vfx.update(.04,true);expect(vfx.sparks.count).toBe(0)
  vfx.clear();vfx.emit("sentry",0,0,0,1,{x:3,z:3});vfx.update(.04,false);expect(vfx.sparks.count).toBe(1);vfx.update(.04,true);expect(vfx.sparks.count).toBe(1)
  vfx.clear();for(let i=0;i<24;i++)vfx.emit("storm",0,0);vfx.emit("dust",0,0);expect(vfx.count).toBe(24)
  for(const kind of ["storm","slash","heal"] as const){for(let i=0;i<24;i++)vfx.emit(kind,0,0);vfx.update(.01,false)}
  expect(vfx.bolts.count).toBeLessThanOrEqual(32);expect(vfx.arcs.count).toBeLessThanOrEqual(24)
  for(const kind of ["firebolt","lightning","blast","treasure","slam","thrust","uppercut"] as const){
   vfx.clear();vfx.emit(kind,0,0,.4,1,{x:4,z:3});vfx.update(.08,false)
   expect(vfx.sparks.count+vfx.bolts.count+vfx.rings.count+vfx.arcs.count).toBeGreaterThan(0)
   vfx.update(.08,true)
   expect(vfx.sparks.count).toBeLessThanOrEqual(128)
  }
  const geometryDisposals=[vfx.sparks,vfx.arcs,vfx.rings,vfx.bolts,vfx.glows].map(m=>vi.spyOn(m.geometry,"dispose"))
  vfx.dispose();for(const spy of geometryDisposals)expect(spy).toHaveBeenCalledOnce()
  expect(scene.children).toHaveLength(0)
 }finally{vfx.dispose()}
})
