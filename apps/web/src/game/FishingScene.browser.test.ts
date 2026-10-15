import { afterEach, describe, expect, it, vi } from "vitest"
import { fishSpecies, getFish } from "@typecade/content"
import { startEncounter, resolveCatchResult } from "@typecade/game-rules"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { createFishingGame } from "./createFishingGame"
import type { Group, InstancedMesh } from "three"
interface Inspection { tick(time: number): void; resize(): void; updateWorld(delta: number): void; time: number; endTime: number; lastFrame: number; render(): void; splash(count: number): void; shoal: Array<{ body: Group; tail: Group }>; pool: Array<{ life: number; y: number; vy: number }>; particles: InstancedMesh; boat: { hull: Group; arm: Group } }
let game: ReturnType<typeof createFishingGame> | undefined
let host: HTMLDivElement | undefined
afterEach(() => { game?.destroy(); host?.remove() })
async function setup(live = false) {
 const bridge=new GameEventBridge();host=document.createElement("div");host.style.cssText="width:1366px;height:768px;position:fixed;inset:0";document.body.append(host)
 bridge.emit("screen:changed",{screen:"game"});bridge.emit("game:paused",{paused:false})
 game=createFishingGame(host,bridge);await game.ready;
 if (live) { await vi.waitFor(()=>expect((game as unknown as Inspection).time).toBeGreaterThan(0),{timeout:2000}) }
 game.renderer.setAnimationLoop(null)
 return {bridge,game,host,view:game as unknown as Inspection}
}
describe("isometric sunset renderer", () => {
 it("renders actual 3D scenery and six fish with a bounded pixel buffer",async()=>{
  const {game,view}=await setup(true);view.tick(100);view.tick(140)
  expect(game.scene.getObjectByName("lighthouse-island")).toBeDefined();expect(game.scene.getObjectByName("fisherman")).toBeDefined();expect(view.shoal).toHaveLength(6)
  expect(game.renderer.domElement.width).toBeLessThanOrEqual(640);expect(game.renderer.domElement.height).toBeLessThanOrEqual(480)
  const probe=document.createElement("canvas");probe.width=64;probe.height=64;const ctx=probe.getContext("2d")!;ctx.drawImage(game.renderer.domElement,0,0,64,64)
  expect(ctx.getImageData(0,0,64,64).data.some((v,i)=>i%4!==3&&v>100)).toBe(true)
  expect(view.pool).toHaveLength(64)
 })
 it("animates fish and reeling, freezes pause/reduced effects and releases the context",async()=>{
  const {bridge,game,view,host}=await setup()
  const fish=getFish("reef_minnow");bridge.emit("encounter:started",{fish,encounter:startEncounter(fish,"test",[]),targetText:"ombak"})
  const start=view.shoal[0]!.tail.rotation.y;view.tick(100);view.tick(140);view.tick(180)
  expect(view.shoal[0]!.tail.rotation.y).not.toBe(start)
  bridge.emit("character:correct",{key:"o",expected:"o",combo:1,progress:.1});view.tick(220);expect(view.boat.arm.rotation.x).not.toBe(0)
  bridge.emit("game:paused",{paused:true});const t=view.time;view.tick(260);expect(view.time).toBe(t)
  bridge.emit("settings:effects",{reducedMotion:true});bridge.emit("game:paused",{paused:false});const reduced=view.shoal[0]!.body.position.clone();view.tick(300);expect(view.shoal[0]!.body.position).toEqual(reduced)
  for(const fish of fishSpecies) { bridge.emit("encounter:started",{fish,encounter:startEncounter(fish,"test",[]),targetText:"ombak"});expect(view.shoal.filter(item=>item.body.visible)).toHaveLength(6) }
  const fail=()=>host.dataset.failed="yes";host.addEventListener("renderer:error",fail);game.renderer.domElement.dispatchEvent(new Event("webglcontextlost",{cancelable:true}));expect(host.dataset.failed).toBe("yes")
  game.destroy();game.destroy();expect(host.querySelector("canvas")).toBeNull();expect(game.renderer.info.memory.geometries).toBe(0)
 })
 it("does not grow GPU allocations across repeated catches and resizes",async()=>{
  const {bridge,game,view,host}=await setup();view.tick(100);
  for(let i=0;i<fishSpecies.length;i++) { const fish=fishSpecies[i]!;bridge.emit("encounter:started",{fish,encounter:startEncounter(fish,"warmup",[]),targetText:"ombak"});view.tick(140+i*40) }
  const baseline=game.renderer.info.memory.geometries
  for(let i=0;i<30;i++) { const fish=fishSpecies[i%fishSpecies.length]!;bridge.emit("encounter:started",{fish,encounter:startEncounter(fish,"reuse",[]),targetText:"ombak"});bridge.emit("word:completed",{word:"ombak",perfect:true,combo:i});view.tick(600+i*40) }
  expect(game.renderer.info.memory.geometries).toBe(baseline);expect(view.pool).toHaveLength(64)
  for(const [w,h] of [[390,844],[320,640],[800,360],[3840,2160]]) { host.style.width=`${w}px`;host.style.height=`${h}px`;view.resize();expect(game.renderer.domElement.width).toBeLessThanOrEqual(640);expect(game.renderer.domElement.height).toBeLessThanOrEqual(480) }
 })
 it("responds to domain feedback, terminal outcomes and inactive browser state",async()=>{
  const {bridge,game,view,host}=await setup();
  await new Promise(resolve=>setTimeout(resolve,40));window.dispatchEvent(new Event("keydown"));
  const fish=fishSpecies[0]!;const encounter=startEncounter(fish,"terminal",[])
  window.dispatchEvent(new Event("pointerdown"));window.dispatchEvent(new Event("keydown"));document.dispatchEvent(new Event("visibilitychange"))
  bridge.emit("settings:volumes",{music:0,typing:0,gameplay:0,environment:0})
  bridge.emit("fish:hooked",{fish});bridge.emit("typo:occurred",{key:"x",expected:"o",ignoredBySteelLine:false})
  bridge.emit("phase:changed",{phase:2});bridge.emit("boss:guard-broken",{tensionRelief:6});bridge.emit("boss:final-pull",{tensionRelief:8})
  bridge.emit("skill:used",{skillId:"cast_net",label:"Cast Net"});bridge.emit("level:up",{fromLevel:1,toLevel:2,xp:30});bridge.emit("audio:play",{key:"sfx_splash_a",category:"gameplay"})
  for(const [tension,durability] of [[90,100],[28,20],[28,100]]) { bridge.emit("line:changed",{tension,durability,progress:.4,timeRemainingMs:5000});view.updateWorld(.02) }
  view.pool[0]!.life=1;view.pool[0]!.y=.05;view.pool[0]!.vy=-2;view.updateWorld(.1);expect(view.pool[0]!.life).toBe(0)
  for(const reducedMotion of [false,true])for(const caught of [false,true]) {
   bridge.emit("settings:effects",{reducedMotion});bridge.emit("encounter:started",{fish,encounter,targetText:"ombak"})
   bridge.emit("catch:resolved",{result:resolveCatchResult({...encounter,status:caught?"caught":"escaped"},fish,{wpm:40,rawWpm:40,accuracy:100,combo:1,maxCombo:1,consistency:100,correctKeystrokes:5,incorrectKeystrokes:0,progress:1,elapsedMs:1000})})
   view.time+=.4;view.updateWorld(.04);view.time+=1;view.updateWorld(.04);expect(view.shoal[0]!.body.visible).toBe(false)
  }
  bridge.emit("settings:effects",{reducedMotion:false});bridge.emit("screen:changed",{screen:"menu"});bridge.emit("screen:changed",{screen:"practice"});bridge.emit("screen:changed",{screen:"race"})
  vi.spyOn(document,"hidden","get").mockReturnValue(true);view.tick(1000);vi.restoreAllMocks();view.tick(1100);view.tick(1101)
  bridge.emit("settings:effects",{reducedMotion:true});bridge.emit("line:changed",{tension:90,durability:100,progress:.5,timeRemainingMs:1000});view.tick(1140)
  host.style.width="0px";host.style.height="0px";view.resize();expect(game.renderer.domElement.width).toBe(1)
  game.renderer.domElement.dispatchEvent(new Event("webglcontextlost",{cancelable:true}));view.tick(1200);view.render();game.destroy();view.tick(1300)
 })

})
