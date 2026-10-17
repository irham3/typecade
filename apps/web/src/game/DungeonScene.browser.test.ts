import { expect,it,vi } from "vitest"
import { DungeonScene } from "./DungeonScene"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { SurvivalRun } from "@typecade/game-rules"
import { createArenaCombat,createRacePlayer,defaultRaceConfig,type RaceRoomSnapshot } from "@typecade/race-rules"
import type { DungeonEvents, PartyWorld } from "@typecade/contracts"
import { partyWorld } from "../dungeon/party-world"
import type { DungeonVfx } from "./DungeonVfx"
import { Matrix4,type InstancedMesh,type MeshStandardMaterial,type ShaderMaterial } from "three"
import type { DamageSource } from "@typecade/contracts"
import { bestiary } from "@typecade/content"

it("marks actual player damage, level gain and acquired power with distinct visual feedback",async()=>{
 const host=document.createElement("div");host.style.cssText="width:1000px;height:700px";document.body.append(host)
 const bridge=new GameEventBridge(),game=new DungeonScene(host,bridge),run=new SurvivalRun("hit-and-level","en")
 const visual=game as unknown as {tick:(t:number)=>void;heroMaterial:MeshStandardMaterial;post:{grade:ShaderMaterial};vfx:DungeonVfx}
 try{
  await game.ready;game.renderer.setAnimationLoop(null);run.start();bridge.emit("screen","endless");bridge.emit("frame",run.state)
  let now=performance.now()+100;const frame=()=>{now+=50;bridge.emit("frame",run.state);visual.tick(now)}
  run.damage(1);frame();expect(visual.post.grade.uniforms.hurt.value).toBeGreaterThan(0);expect(visual.heroMaterial.emissiveIntensity).toBeGreaterThan(0)
  for(let i=0;i<20;i++)frame();expect(visual.post.grade.uniforms.hurt.value).toBe(0)
  run.gainXp(130);run.advance(.01);frame();expect(run.state.phase).toBe("draft");expect(visual.vfx.rings.count).toBeGreaterThan(0)
  run.chooseUpgrade(run.state.offers[0]!);frame();expect(visual.vfx.count).toBeGreaterThan(0)
  host.style.height="390px";await new Promise(resolve=>setTimeout(resolve,30));bridge.emit("screen","tutorial");run.spawn("skeleton",{x:3,z:0});frame();run.state.player.invincible=0;run.damage(1);frame();bridge.emit("settings",{reduced:true,volume:0});frame();expect(visual.heroMaterial.emissiveIntensity).toBeGreaterThan(0)
  run.state.enemies=[];run.state.queue=[];run.state.player.invincible=0;run.damage(1);frame();expect(visual.heroMaterial.emissiveIntensity).toBeGreaterThan(0)
 }finally{game.destroy();host.remove();bridge.clear()}
},20000)

it("renders real instanced actors, recycles chunks and releases WebGL resources across all modes",async()=>{
 const host=document.createElement("div");host.style.cssText="width:1000px;height:700px";document.body.append(host)
 const bridge=new GameEventBridge(),events:unknown[]=[],unsubscribe=bridge.on("renderer",event=>events.push(event))
 const game=new DungeonScene(host,bridge)
 // Drive presentation frames directly so the test never depends on monitor refresh rate.
 const rawTick=(game as unknown as {tick:(timestamp:number)=>void}).tick.bind(game)
 let epoch=0
 const tick=(timestamp:number)=>rawTick(epoch+timestamp)
 const run=new SurvivalRun("render","en"),s=run.state;run.start()
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
  s.biome=2;bridge.emit("frame",s);tick(6500);bridge.emit("frame",new SurvivalRun("new-run","en").state);tick(6600);window.dispatchEvent(new KeyboardEvent("keydown",{key:"Q"}));window.dispatchEvent(new PointerEvent("pointerdown"))
 }finally{game.destroy();game.destroy();unsubscribe();bridge.clear();host.remove()}
 expect(host.querySelector("canvas")).toBeNull()
},20000)

it("ignores pending readiness after immediate renderer disposal",async()=>{
 const host=document.createElement("div"),bridge=new GameEventBridge<DungeonEvents>(),ready=vi.fn();bridge.on("renderer",ready)
 const game=new DungeonScene(host,bridge);game.destroy();await game.ready;expect(ready).not.toHaveBeenCalled()
})

it("reduces expensive lighting and duplicate outlines when a diverse horde exceeds the draw budget",async()=>{
 const host=document.createElement("div");host.style.cssText="width:960px;height:640px";document.body.append(host)
 const bridge=new GameEventBridge(),game=new DungeonScene(host,bridge),r=new SurvivalRun("dense-render"),s=r.state
 const v=game as unknown as {tick:(t:number)=>void;adaptive:boolean}
 try{
  await game.ready;game.renderer.setAnimationLoop(null);r.start();s.enemies=[];s.queue=[];bridge.emit("screen","endless")
  for(const entry of bestiary)r.spawn(entry.kind,{x:Math.sin(s.nextId)*3,z:Math.cos(s.nextId)*3})
  bridge.emit("frame",s);v.tick(performance.now()+100)
  expect(v.adaptive).toBe(true);expect(game.renderer.shadowMap.enabled).toBe(false)
  expect(game.renderer.info.render.calls).toBeLessThanOrEqual(120)
  bridge.emit("settings",{reduced:false,volume:0});expect(game.renderer.shadowMap.enabled).toBe(false)
 }finally{game.destroy();bridge.clear();host.remove()}
},20000)

it("presents new attack sources, heavy finishers, surge cues and overloads without changing combat state",async()=>{
 const host=document.createElement("div");host.style.cssText="width:960px;height:640px";document.body.append(host)
 const bridge=new GameEventBridge(),game=new DungeonScene(host,bridge),run=new SurvivalRun("spectacle-check","en"),s=run.state
 const v=game as unknown as {tick:(time:number)=>void;elapsed:number;focusAt:number;hitStopUntil:number;walls:InstancedMesh;terrain:(x:number,z:number)=>void;post:{render:(delta:number)=>void;composer:{readBuffer:{depthTexture:unknown};renderTarget1:{depthTexture:unknown}}}}
 try{
  await game.ready;game.renderer.setAnimationLoop(null);run.start();s.enemies=[];s.queue=[];bridge.emit("screen","endless")
  let now=performance.now()+100;const frame=()=>{now+=50;bridge.emit("frame",s);v.tick(now)}
  frame()
  for(const [i,kind]of (["gargoyle","mimic","sporeling","ghoul","deathknight"] as const).entries())run.spawn(kind,{x:i-2,z:2})
  frame()
  for(const source of ["blade","cleave","storm","lightning","vowels","sentry","explosion","orbit","nova","meteor","frost","whirl","finisher"] as DamageSource[]){s.effects=[{id:s.nextId++,kind:"shatter",source,x:0,z:2,life:1,value:1}];frame()}
  for(const kind of ["nova","frost","meteor","finisher","spore"] as const){s.player.dashAt+=1;s.effects=[{id:s.nextId++,kind,x:0,z:2,life:1,value:1}];frame()}
  expect(v.hitStopUntil).toBeGreaterThan(0)
  v.focusAt=v.elapsed+1;frame();v.focusAt=v.elapsed-.5;frame()
  for(const time of [85,98]){s.time=s.worldTime=time;frame()}
  s.phase="overdrive";s.cursor=1;s.effects=[{id:s.nextId++,kind:"slash",x:1,z:1,life:1,value:0}];frame()
  s.cursor=3;frame()
  s.phase="arena";s.queue=s.enemies.map(e=>e.id);s.enemies[0]!.maxHealth=3;s.enemies[0]!.health=3;frame();s.effects=[{id:s.nextId++,kind:"shatter",x:s.enemies[0]!.x,z:s.enemies[0]!.z,life:1,value:1}];s.enemies.shift();s.queue=s.enemies.map(e=>e.id);frame();s.player.dashAt+=1;s.effects=[{id:s.nextId++,kind:"slash",x:0,z:2,life:1,value:1},{id:s.nextId++,kind:"whirl",x:0,z:2,life:1,value:1}];frame();s.effects=[{id:s.nextId++,kind:"storm",x:0,z:0,life:1,value:1}];frame()
  const capacity=v.walls.instanceMatrix.count
  Object.defineProperty(v.walls.instanceMatrix,"count",{value:1,configurable:true});v.terrain(500,500);expect(v.walls.count).toBe(1)
  Object.defineProperty(v.walls.instanceMatrix,"count",{value:capacity,configurable:true});v.terrain(0,0)
  v.post.composer.readBuffer.depthTexture=null;v.post.render(1/60)
  expect(s.kills).toBe(0)
 }finally{game.destroy();bridge.clear();host.remove()}
},20000)

it("plays a cleave independently of dash, keeps death poses briefly and expires effects without changing rules",async()=>{
 const host=document.createElement("div");host.style.cssText="width:1440px;height:900px";document.body.append(host)
 const bridge=new GameEventBridge(),game=new DungeonScene(host,bridge),run=new SurvivalRun("visual-combat","en"),s=run.state
 const visual=game as unknown as {tick:(t:number)=>void;vfx:DungeonVfx;actors:Map<number,{deadAt:number;hitAt:number;angle:number}>}
 try{
  await game.ready;game.renderer.setAnimationLoop(null);run.start();bridge.emit("frame",s);bridge.emit("screen","endless")
  let now=performance.now()+100;const frame=(dt=40)=>{now+=dt;bridge.emit("frame",s);visual.tick(now)}
  run.input("Tab");for(const key of "CLEAVE")run.input(key);frame()
  expect(s.player.dashAt).toBe(-10);expect(visual.vfx.arcs.count).toBeGreaterThan(0)
  for(let i=0;i<10;i++)frame(100)
  expect(visual.vfx.count).toBe(0)
  s.enemies=[];const victim=run.spawn("skeleton",{x:2,z:0})!;run.refreshQueue();frame()
  const victimFacing=visual.actors.get(victim.id)!.angle
  for(const key of victim.words[0]!)run.input(key);frame()
  expect(s.enemies.some(e=>e.id===victim.id)).toBe(false)
  expect(visual.actors.get(victim.id)!.deadAt).toBeGreaterThanOrEqual(0)
  expect(visual.actors.get(victim.id)!.angle).toBe(victimFacing)
  const kills=s.kills,position={x:s.player.x,z:s.player.z}
  for(let i=0;i<10;i++)frame(100)
  expect(visual.actors.has(victim.id)).toBe(false);expect(s.kills).toBe(kills);expect({x:s.player.x,z:s.player.z}).toEqual(position)
  s.enemies=[];run.spawn("goblin",{x:3,z:0});run.refreshQueue();frame();s.player.mana=100;s.skills.storm.cooldown=0
  run.input("Tab");for(const key of "STORM")run.input(key);frame()
  expect(visual.vfx.bolts.count).toBeGreaterThan(0)
  for(let i=0;i<10;i++)frame(100)
  s.phase="arena";s.player.hp=2;s.player.mana=100;s.skills.heal.cooldown=0;frame()
  run.input("Tab");for(const key of "HEAL")run.input(key);frame()
  expect(s.player.hp).toBe(4);expect(visual.vfx.rings.count).toBeGreaterThan(0)
  bridge.emit("settings",{reduced:true,volume:0});frame();expect(visual.vfx.sparks.count).toBe(0)
  for(let i=0;i<10;i++)frame(100)
  expect(visual.vfx.count).toBe(0)
 }finally{game.destroy();bridge.clear();host.remove()}
},20000)

it("bounds death afterimages, reacts to damage and armor, and presents authoritative party skills and boss attacks",async()=>{
 const host=document.createElement("div");host.style.cssText="width:1440px;height:900px";document.body.append(host)
 const bridge=new GameEventBridge(),game=new DungeonScene(host,bridge),run=new SurvivalRun("horde-feedback","en"),s=run.state
 const visual=game as unknown as {tick:(t:number)=>void;vfx:DungeonVfx;actors:Map<number,{deadAt:number;hitAt:number;strikeAt:number}>;cameraTrauma:number}
 try{
  await game.ready;game.renderer.setAnimationLoop(null);run.start();bridge.emit("frame",s);bridge.emit("screen","endless")
  let now=performance.now()+100;const frame=(dt=40)=>{now+=dt;bridge.emit("frame",s);visual.tick(now)}
  s.enemies=[];const guard=run.spawn("guard",{x:2,z:0})!;run.refreshQueue();frame()
  run.input(guard.words[0]![0]!);frame();for(const key of guard.words[0]!.slice(1))run.input(key);frame()
  expect(visual.actors.get(guard.id)!.hitAt).toBeGreaterThan(0)
  run.spawn("goblin",{x:5,z:0});frame();s.player.invincible=0;run.damage(1);frame();expect(visual.actors.get(guard.id)!.strikeAt).toBeGreaterThan(0)
  s.enemies=[];s.queue=[];frame();expect(visual.actors.has(guard.id)).toBe(false)
  const kinds=["skeleton","goblin","guard","barrel","boss"] as const
  for(let i=0;i<24;i++)run.spawn(kinds[i%5]!,{x:i%4,z:Math.floor(i/4)})
  frame();const victims=[...s.enemies];s.enemies=[];s.queue=[];s.effects=victims.map(e=>({id:s.nextId++,kind:"shatter",x:e.x,z:e.z,life:.55,value:1}));frame()
  expect([...visual.actors.values()].filter(a=>a.deadAt>=0)).toHaveLength(16)
  for(let i=0;i<10;i++)frame(100)
  expect(visual.actors.size).toBe(0)
  s.boss=null;const boss=run.spawn("boss",{x:2,z:2})!;s.boss=boss.id;frame();s.phase="overdrive";frame()
  expect(visual.vfx.bolts.count).toBeGreaterThan(0)
  s.effects=[{id:s.nextId++,kind:"slash",x:2,z:2,life:.55,value:2}];frame();s.cursor=1;s.effects=[{id:s.nextId++,kind:"slash",x:2,z:2,life:.55,value:2}];frame();s.cursor=3;s.effects=[{id:s.nextId++,kind:"slash",x:2,z:2,life:.55,value:2}];frame();s.phase="arena";frame()
  s.enemies=[];s.queue=[];s.boss=null;s.phase="overdrive";frame();s.phase="arena";frame()
  bridge.emit("screen","multiplayer")
  const party:PartyWorld={mode:"raid",phase:"racing",casting:false,ownId:"a",now:1000,focus:{x:0,z:0},obstacles:[],boss:{hp:100,maxHp:100,nextAttack:1500,attackAt:-1000,target:null},players:[{id:"a",name:"Knight",x:0,z:0,color:0x4999d4,hp:100,action:"idle",actionAt:0,target:null,role:"dps"},{id:"b",name:"Tank",x:2,z:0,color:0xd06b62,hp:100,action:"idle",actionAt:0,target:null,role:"tank"}]}
  const partyFrame=()=>{bridge.emit("party",structuredClone(party));now+=40;visual.tick(now)}
  party.players[0]!.shield=20;partyFrame()
  for(const [i,action]of ["heal","revive","storm","block","dodge","ignite","cleave","strike"].entries()){
   party.now+=100;Object.assign(party.players[0]!,{action,actionAt:party.now,target:action==="strike"?"boss":i%2?null:"b"});partyFrame()
  }
  party.boss!.hp=80;party.boss!.attackAt=party.now;party.boss!.target="b";partyFrame();partyFrame()
  party.players[1]!.hp=50;partyFrame();party.players[1]!.hp=0;partyFrame()
  expect(visual.vfx.count).toBeGreaterThan(0)
  party.now+=100;party.boss!.attackAt=party.now;party.boss!.target="missing";partyFrame()
  party.boss!.hp=0;partyFrame()
  party.boss!.attackAt=party.now-1000;partyFrame()
  party.players=party.players.slice(0,1);party.players[0]!.actionAt=-10000;partyFrame()
  party.players[0]!.hp=50;party.mode="clash";partyFrame();party.players[0]!.hp=0;partyFrame();party.mode="clash";party.players[0]!.hp=90;partyFrame();bridge.emit("party",null)
  expect(game.renderer.info.render.calls).toBeLessThanOrEqual(120)
 }finally{game.destroy();bridge.clear();host.remove()}
},20000)

it("renders flying enemies, supply silhouettes, shield gear, sentry beams and charge telegraphs from actual state",async()=>{
 const host=document.createElement("div");host.style.cssText="width:1280px;height:800px";document.body.append(host)
 const bridge=new GameEventBridge(),game=new DungeonScene(host,bridge),r=new SurvivalRun("equipment-visual"),s=r.state
 const visual=game as unknown as {tick:(t:number)=>void;heroShield:{visible:boolean};sentryMesh:{visible:boolean};orbitals:{count:number};telegraphs:{count:number};batches:Map<string,{body:InstancedMesh}>}
 try{
  await game.ready;game.renderer.setAnimationLoop(null);bridge.emit("screen","endless");r.start();s.enemies=[];s.queue=[];let now=performance.now();const frame=()=>{now+=50;bridge.emit("frame",s);visual.tick(now)};frame()
  for(const [i,kind]of (["shield","potion","mana","sentry","bat","mage","minotaur"] as const).entries())r.spawn(kind,{x:(i%3)*2,z:Math.floor(i/3)*2})
  const mage=s.enemies.find(e=>e.kind==="mage")!;mage.attack=.5
  const minotaur=s.enemies.find(e=>e.kind==="minotaur")!;minotaur.motion="windup";minotaur.motionTime=1;minotaur.aim={x:0,z:0};s.player.shield=2;s.relics.lightning=s.relics.vowels=1;s.sentry={x:0,z:0,life:18,cooldown:1};frame()
  const button=document.createElement("button");host.append(button);button.click();host.click();window.dispatchEvent(new Event("click"));button.remove()
  s.queue=[s.enemies.find(e=>e.kind==="bat")!.id];frame();bridge.emit("settings",{reduced:true,volume:0});frame()
  const transform=new Matrix4();visual.batches.get("bat")!.body.getMatrixAt(0,transform);expect(transform.elements[13]).toBeGreaterThanOrEqual(1.25);visual.batches.get("mage")!.body.getMatrixAt(0,transform);expect(transform.elements[13]).toBeGreaterThanOrEqual(1);bridge.emit("settings",{reduced:false,volume:0});frame()
  expect(visual.heroShield.visible).toBe(true);expect(visual.sentryMesh.visible).toBe(true);expect(visual.orbitals.count).toBe(2);expect(visual.telegraphs.count).toBe(2)
  s.effects=[{id:s.nextId++,kind:"sentry",x:0,z:0,life:.55,value:1,to:{x:2,z:2}},{id:s.nextId++,kind:"block",x:0,z:0,life:.55,value:1}];frame()
  for(const words of [2,3,4]){s.words=words;s.player.dashAt+=1;s.effects=[{id:s.nextId++,kind:"slash",x:0,z:0,life:.55,value:1}];frame()}
  minotaur.aim={x:minotaur.x,z:minotaur.z};frame();minotaur.aim={x:0,z:0}
  for(const time of [360,480]){s.time=time;frame()}
  s.effects=[{id:s.nextId++,kind:"lightning",x:0,z:0,life:.55,value:1}];frame()
  s.procs.lightning=2;s.procs.vowels=1
  for(const kind of ["lightning","firebolt","blast","treasure","slam","level","upgrade"] as const){s.effects=[{id:s.nextId++,kind,x:0,z:0,life:.55,value:2,to:{x:2,z:2}}];frame()}
  const boss=r.spawn("boss",{x:3,z:0})!;s.phase="overdrive";s.bossArena={x:0,z:0,hp:24,cooldown:0,rage:0,calm:0};s.stagger=1.5;boss.motion="windup";boss.motionTime=.6;boss.aim={x:0,z:0};frame();s.bossArena.hp=6;s.bossArena.cooldown=.7;frame();s.bossArena.cooldown=0;frame();boss.motion="recover";frame();boss.motion="windup";boss.motionTime=undefined;frame();s.bossArena.hp=0;frame();s.effects=[{id:s.nextId++,kind:"barrier",x:5,z:0,life:.55,value:0,to:{x:2,z:0}}];frame();s.effects=[{id:s.nextId++,kind:"barrier",x:5,z:0,life:.55,value:23}];frame();s.effects=[{id:s.nextId++,kind:"slam",x:3,z:0,life:.55,value:3}];frame();bridge.emit("settings",{reduced:true,volume:0});frame();s.phase="arena";s.boss=null;s.enemies=s.enemies.filter(e=>e!==boss);bridge.emit("settings",{reduced:false,volume:0})
  minotaur.motion="slam";frame();minotaur.motion="charge";frame();s.enemies=[];s.queue=[];frame()
  for(const kind of ["shield","potion","mana","sentry","chest"] as const){s.enemies=[];s.queue=[];const item=r.spawn(kind,{x:1,z:0})!;frame();s.enemies=[];s.effects=[{id:s.nextId++,kind:"hit",x:item.x,z:item.z,life:.55,value:0}];frame()}
  s.relics.lightning=s.relics.vowels=0;s.sentry=null;bridge.emit("settings",{reduced:true,volume:0});frame();expect(visual.orbitals.count).toBe(0);expect(visual.sentryMesh.visible).toBe(false)
 }finally{game.destroy();bridge.clear();host.remove()}
},20000)

it("starts with Reduced Effects already saved and still projects the live party",async()=>{
 const host=document.createElement("div");host.style.cssText="width:800px;height:600px";document.body.append(host);const bridge=new GameEventBridge<DungeonEvents>();bridge.emit("settings",{reduced:true,volume:0});bridge.emit("screen","multiplayer")
 const game=new DungeonScene(host,bridge),visual=game as unknown as {tick:(t:number)=>void;weather:{count:number}};let names=0;const stop=bridge.on("partyProjected",p=>{names=p.length})
 try{
  await game.ready;game.renderer.setAnimationLoop(null)
  const party:PartyWorld={mode:"clash",phase:"racing",casting:false,ownId:"a",now:1000,focus:{x:0,z:0},obstacles:[],boss:null,players:[{id:"a",name:"Blue",x:0,z:4,color:0x4999d4,hp:100,action:"idle",actionAt:0,target:null,role:"dps"}]}
  bridge.emit("party",party);visual.tick(performance.now()+100);expect(visual.weather.count).toBe(0);expect(names).toBe(1);expect(game.renderer.info.render.calls).toBeGreaterThan(0)
 }finally{stop();game.destroy();bridge.clear();host.remove()}
},20000)

it("animates the expanded bestiary, keeps tinted loot visible and binds weather to the current depth",async()=>{
 const host=document.createElement("div");host.style.cssText="width:1280px;height:800px";document.body.append(host)
 const bridge=new GameEventBridge(),game=new DungeonScene(host,bridge),r=new SurvivalRun("bestiary-visual","en"),s=r.state
 const visual=game as unknown as {tick:(t:number)=>void;weather:InstancedMesh;gems:InstancedMesh;embers:InstancedMesh;projectiles:InstancedMesh;telegraphs:InstancedMesh;batches:Map<string,{body:InstancedMesh}>}
 try{
  await game.ready;game.renderer.setAnimationLoop(null);bridge.emit("screen","endless");r.start();s.enemies=[];s.queue=[];let now=performance.now();const frame=()=>{now+=50;bridge.emit("frame",s);visual.tick(now)}
  // Vertex-coloured primitives must carry a white base, otherwise WebGL renders them black.
  for(const mesh of [visual.gems,visual.embers,visual.projectiles,visual.telegraphs])expect(mesh.geometry.getAttribute("color")?.getX(0)).toBe(1)
  const kinds=["wolf","slime","spider","wraith","archer","shaman","golem","imp","rat","necromancer","serpent","beetle","assassin","troll","wisp"] as const
  for(const [i,kind]of kinds.entries())r.spawn(kind,{x:(i%5)*2-4,z:Math.floor(i/5)*2-2})
  for(const e of s.enemies)if(["archer","imp","shaman","necromancer"].includes(e.kind))e.attack=.5
  s.queue=s.enemies.filter(e=>["golem","rat","wolf","imp","archer"].includes(e.kind)).map(e=>e.id)
  frame();for(let i=0;i<8;i++){for(const e of s.enemies)e.x+=.05;frame()}
  for(const kind of kinds)expect(visual.batches.get(kind)!.body.count).toBe(1)
  const transform=new Matrix4();visual.batches.get("wisp")!.body.getMatrixAt(0,transform);expect(transform.elements[13]).toBeGreaterThan(.5)
  expect(visual.telegraphs.count).toBeGreaterThanOrEqual(4)
  for(const kind of ["ward","summon","blink"] as const){s.effects=[{id:s.nextId++,kind,x:1,z:1,life:.55,value:1,to:{x:2,z:2}}];frame()}
  const counts:number[]=[];for(let biome=0;biome<6;biome++){s.biome=biome;frame();counts.push(visual.weather.count)}
  expect(counts).toEqual([20,16,24,32,14,20])
  bridge.emit("settings",{reduced:true,volume:0});frame();expect(visual.weather.count).toBe(0);bridge.emit("settings",{reduced:false,volume:0});frame()
  for(const e of s.enemies)e.frozen=1;frame()
  s.enemies=[];s.queue=[];frame()
 }finally{game.destroy();bridge.clear();host.remove()}
},20000)
