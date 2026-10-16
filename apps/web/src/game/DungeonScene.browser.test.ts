import { expect,it,vi } from "vitest"
import { DungeonScene } from "./DungeonScene"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { SurvivalRun } from "@typecade/game-rules"
import { createArenaCombat,createRacePlayer,defaultRaceConfig,type RaceRoomSnapshot } from "@typecade/race-rules"
import type { DungeonEvents } from "@typecade/contracts"
import { partyWorld } from "../dungeon/party-world"

it("renders real instanced actors, recycles chunks and releases WebGL resources across all modes",async()=>{
 const host=document.createElement("div");host.style.cssText="width:1000px;height:700px";document.body.append(host)
 const bridge=new GameEventBridge(),events:unknown[]=[],unsubscribe=bridge.on("renderer",event=>events.push(event))
 const game=new DungeonScene(host,bridge)
 // Drive presentation frames directly so the test never depends on monitor refresh rate.
 const rawTick=(game as unknown as {tick:(timestamp:number)=>void}).tick.bind(game)
 let epoch=0
 const tick=(timestamp:number)=>rawTick(epoch+timestamp)
 const run=new SurvivalRun("render"),s=run.state;run.start()
 try{
  await game.ready;await new Promise(requestAnimationFrame);game.renderer.setAnimationLoop(null);epoch=performance.now();expect(host.querySelectorAll("canvas")).toHaveLength(1)
  bridge.emit("settings",{reduced:false,volume:0});bridge.emit("frame",s);tick(100);tick(101);tick(120);tick(150)
  bridge.emit("screen","endless");s.enemies=[]
  for(const [i,kind] of (["skeleton","goblin","guard","mage","minotaur","boss","barrel","chest","bomber"] as const).entries())run.spawn(kind,{x:i%3*2,z:Math.floor(i/3)*2})
  s.enemies[0]!.frozen=5;s.target=s.enemies[1]!.id;run.refreshQueue();s.phase="skills";s.player.x=2;s.player.dashAt=s.worldTime;s.player.invincible=1
  s.loot=[{id:1000,x:0,z:0,xp:1,gold:1,mana:1},{id:1001,x:1,z:0,xp:25,gold:1,mana:0},{id:1002,x:2,z:0,xp:60,gold:1,mana:0}]
  s.projectiles=[{id:1010,x:1,z:1,vx:1,vz:1,life:1}]
  s.effects=(["slash","storm","magnet","heal","pickup","hit","shatter"] as const).map((kind,i)=>({id:1100+i,kind,x:0,z:0,life:.3,value:1}));s.nextId=1200;s.correct=1
  bridge.emit("frame",s);tick(200);tick(260)
  s.phase="overdrive";bridge.emit("frame",s);tick(320)
  for(const phase of ["paused","draft","dead"] as const){s.phase=phase;bridge.emit("frame",s);tick(400);tick(450)}
  bridge.emit("screen","dojo");bridge.emit("training",{correct:1,words:0,errors:0});tick(600);bridge.emit("training",{correct:0,words:0,errors:0});tick(650)
  host.style.cssText="width:390px;height:480px";window.dispatchEvent(new Event("resize"));await new Promise(resolve=>setTimeout(resolve,30));tick(700)
  const players=Array.from({length:6},(_,i)=>({...createRacePlayer(String(i),`Knight ${i}`,"classic"),cursor:i*5}))
  const room:RaceRoomSnapshot={code:"ABCDEFGH",hostId:"0",phase:"racing",config:{...defaultRaceConfig},text:"hit",players,startsAt:0,endsAt:10000,serverNow:800}
  bridge.emit("screen","multiplayer");bridge.emit("party",null);tick(800)
  let partyTick=900
  for(const mode of ["sprint","clash","raid"] as const){
   room.config.mode=mode;room.text="DODGE IGNITE hit";room.combat=createArenaCombat(mode,players,0);room.combat.players["3"]!.hp=0
   room.combat.actions=[{id:1,player:"0",target:mode==="raid"?"boss":"1",kind:"strike",value:12,at:800},{id:2,player:"1",target:"1",kind:"dodge",value:1,at:800}]
   bridge.emit("party",partyWorld(room,"0",true));tick(partyTick);tick(partyTick+60);partyTick+=150
  }
  room.phase="waiting";bridge.emit("party",partyWorld(room,null,false));tick(1400)
  room.phase="racing";bridge.emit("settings",{reduced:true,volume:0});bridge.emit("party",partyWorld(room,"0",false));tick(1450);bridge.emit("screen","dojo");tick(1500);tick(1600)
  bridge.emit("screen","endless");s.phase="arena";s.player.x=64;s.player.z=64;bridge.emit("frame",s);tick(1700)
  bridge.emit("settings",{reduced:false,volume:0});for(let timestamp=1800;timestamp<5000;timestamp+=60)tick(timestamp)
  const hidden=vi.spyOn(document,"hidden","get").mockReturnValue(true);document.dispatchEvent(new Event("visibilitychange"));tick(6000);hidden.mockReturnValue(false);document.dispatchEvent(new Event("visibilitychange"));tick(6100);hidden.mockRestore()
  s.queue=s.enemies.filter(e=>e.kind==="barrel"||e.kind==="chest").map(e=>e.id);bridge.emit("frame",s);tick(6150)
  const geometries=game.renderer.info.memory.geometries;s.player.x=-64;s.player.z=-64;bridge.emit("frame",s);tick(6200)
  expect(game.renderer.info.memory.geometries).toBe(geometries)
  expect(game.renderer.info.render.calls).toBeLessThanOrEqual(120)
  const canvas=host.querySelector("canvas")!;canvas.dispatchEvent(new Event("webglcontextlost",{cancelable:true}));tick(6300)
  expect(events).toContainEqual({status:"lost",calls:0,geometries:0,textures:0})
  host.style.width="800px";await new Promise(resolve=>setTimeout(resolve,40));canvas.dispatchEvent(new Event("webglcontextrestored"));tick(6400)
  s.biome=2;bridge.emit("frame",s);tick(6500);bridge.emit("frame",new SurvivalRun("new-run").state);tick(6600);window.dispatchEvent(new KeyboardEvent("keydown",{key:"Q"}));window.dispatchEvent(new PointerEvent("pointerdown"))
 }finally{game.destroy();game.destroy();unsubscribe();bridge.clear();host.remove()}
 expect(host.querySelector("canvas")).toBeNull()
},20000)

it("ignores pending readiness after immediate renderer disposal",async()=>{
 const host=document.createElement("div"),bridge=new GameEventBridge<DungeonEvents>(),ready=vi.fn();bridge.on("renderer",ready)
 const game=new DungeonScene(host,bridge);game.destroy();await game.ready;expect(ready).not.toHaveBeenCalled()
})
