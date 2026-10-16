import {expect,it} from "vitest"
import {SurvivalRun,restoreDungeonRun,dungeonWalkable} from "./survival"
import {dungeonObjects,dungeonSupplies} from "../../content/src/dungeon"
import type {DungeonState,SupplyKind} from "../../contracts/src/survival"
const tick=(r:SurvivalRun,t:number)=>{for(let i=0;i<Math.ceil(t*30);i++)r.advance(1/30)}
function run(){const r=new SurvivalRun("encounters");r.start();r.state.enemies=[];r.state.queue=[];r.state.spawnAt=3600;r.state.nextBoss=3600;r.state.player.invincible=3600;return r}
function collect(r:SurvivalRun,kind:SupplyKind){r.cancel();const item=r.spawn(kind,{x:r.state.player.x+1,z:r.state.player.z})!;r.refreshQueue();for(const key of item.words[0]!)r.input(key);return item}
it("starts Indonesian, varies seeded speed and per-kind steering while keeping targets walkable",()=>{
 expect(new SurvivalRun("default").state.language).toBe("id")
 const play=()=>{const r=run();for(const kind of ["skeleton","goblin","guard","bat","mage","minotaur","boss","bomber"] as const){r.state.enemies=[];r.state.boss=null;const e=r.spawn(kind,{x:5,z:0})!;if(kind==="bomber")e.attack=1.8;tick(r,3);expect(dungeonWalkable(e)).toBe(true)}return r.serialize()}
 expect(play()).toBe(play())
 const r=run(),a=r.spawn("goblin",{x:4,z:0})!,b=r.spawn("guard",{x:4,z:2})!,c=r.spawn("goblin",{x:4,z:-2})!;expect(a.speed).toBeGreaterThan(b.speed);expect(a.speed).not.toBe(c.speed)
 r.state.target=a.id;r.state.prefix=a.words[0]![0]!;tick(r,.3);expect(a.z).not.toBe(0);expect(r.state.prefix).toBe(a.words[0]![0])
 const mage=r.spawn("mage",{x:2,z:0})!,before= Math.hypot(mage.x,mage.z);mage.attack=.1;tick(r,.5);expect(Math.hypot(mage.x,mage.z)).toBeGreaterThan(before);expect(r.state.projectiles.length).toBeGreaterThan(0)
 mage.x=8;mage.z=0;tick(r,.3);mage.x=5.5;tick(r,.3)
 const brute=r.spawn("minotaur",{x:5,z:0})!;brute.attack=0;tick(r,.05);expect(brute.motion).toBe("windup");expect(brute.aim).toEqual({x:0,z:0})
 tick(r,1.2);expect(brute.motion).toBe("charge");r.state.player.x=-2;tick(r,3);expect(brute.motion).toBeUndefined();expect(brute.attack).toBeGreaterThan(0)
 brute.motion="charge";brute.motionTime=.5;brute.aim={x:brute.x,z:brute.z};tick(r,.05);expect(brute.motion).toBe("recover")
 brute.motion="windup";delete brute.motionTime;delete brute.aim;tick(r,.1);expect(brute.motion).toBe("charge");tick(r,.1)
 const blocked=run(),shooter=blocked.spawn("mage",{x:4,z:10})!;shooter.attack=0;shooter.speed=0;blocked.state.player.x=16;blocked.state.player.z=10;tick(blocked,.1);expect(blocked.state.projectiles).toHaveLength(0)
 blocked.state.projectiles=[{id:blocked.state.nextId++,x:10,z:10,vx:0,vz:0,life:1}];tick(blocked,.1);expect(blocked.state.projectiles).toHaveLength(0)
})
it("collects readable supplies, absorbs real damage and deploys one timed sentry without consuming locked words",()=>{
 const r=run(),s=r.state;s.player.hp=2;s.player.mana=0
 for(const kind of ["potion","mana","shield","sentry"] as const){collect(r,kind);expect(s.supplies[kind]).toBe(1)}
 expect(s.player.hp).toBe(4);expect(s.player.mana).toBeGreaterThanOrEqual(40);expect(s.player.shield).toBe(2);expect(s.sentry?.life).toBe(18)
 collect(r,"shield");collect(r,"shield");expect(s.player.shield).toBe(4)
 s.player.invincible=0;r.damage(1);expect(s.player.hp).toBe(4);expect(s.player.shield).toBe(3)
 s.player.invincible=0;r.damage(3);expect(s.player.shield).toBe(0);expect(s.player.hp).toBe(4);expect(s.notice).toContain("broken")
 collect(r,"shield");s.player.invincible=0;r.damage(3);expect(s.player.hp).toBe(3);expect(s.player.shield).toBe(0)
 expect(s.kills).toBe(0)
 s.player.invincible=3600
 const locked=r.spawn("guard",{x:s.player.x+1,z:1})!;r.refreshQueue();r.input(locked.words[0]![0]!);const word=locked.words[0],prefix=s.prefix
 const other=r.spawn("skeleton",{x:s.player.x+2,z:1})!;tick(r,.4);expect(s.effects.some(e=>e.kind==="sentry")).toBe(true);expect(locked.words[0]).toBe(word);expect(s.prefix).toBe(prefix)
 tick(r,2);expect(s.enemies).not.toContain(other);expect(locked.words[0]).toBe(word)
 const raw=r.serialize();expect(restoreDungeonRun(raw)?.state.sentry).toEqual(s.sentry)
 tick(r,20);expect(s.sentry).toBeNull()
 const untouched=r.spawn("potion",{x:s.player.x+1,z:s.player.z})!;r.cancel();s.player.mana=100;r.input("Tab");r.cast("storm");expect(s.enemies).toContain(untouched)
 expect(r.spawn("potion",{x:s.player.x+2,z:s.player.z})).toBeUndefined()
 s.relics.vowels=1;r.cancel();for(const key of untouched.words[0]!)r.input(key);expect(s.supplies.potion).toBe(2)
 expect(dungeonObjects).toContain("shield");expect(Object.keys(dungeonSupplies)).toHaveLength(4)
})
it("restores old saves safely and rejects malformed shield, equipment, tower, telegraph and beam data",()=>{
 const source=new SurvivalRun("save").serialize(),legacy=JSON.parse(source);delete legacy.player.shield;delete legacy.supplies;delete legacy.sentry
 expect(restoreDungeonRun(JSON.stringify(legacy))?.state.player.shield).toBe(0)
 const bad:Array<(s:DungeonState)=>void>=[s=>{s.player.shield=5},s=>{s.player.shield=-1},s=>{s.player.shield=.5},s=>{s.supplies=null!},s=>{s.supplies.shield=-1},s=>{s.supplies.mana=1000001},s=>{s.sentry={x:NaN,z:0,life:2,cooldown:0}},s=>{s.sentry={x:1e7,z:0,life:2,cooldown:0}},s=>{s.sentry={x:0,z:1e7,life:2,cooldown:0}},s=>{s.sentry={x:10,z:10,life:2,cooldown:0}},s=>{s.sentry={x:0,z:0,life:0,cooldown:0}},s=>{s.sentry={x:0,z:0,life:19,cooldown:0}},s=>{s.sentry={x:0,z:0,life:2,cooldown:-1}},s=>{s.sentry={x:0,z:0,life:2,cooldown:2}}]
 for(const change of bad){const s=JSON.parse(source);change(s);expect(restoreDungeonRun(JSON.stringify(s))).toBeNull()}
 const r=run(),e=r.spawn("minotaur",{x:5,z:0})!;e.attack=0;tick(r,.05);const armed=r.serialize();expect(restoreDungeonRun(armed)).not.toBeNull()
 for(const field of ["motion","motionTime","aim","kind"] as const){for(const value of [null,"bad",-1,3,{x:NaN,z:0},{x:10,z:10},{x:1e7,z:0},{x:0,z:1e7}]){const s=JSON.parse(armed);s.enemies[0][field]=value;expect(restoreDungeonRun(JSON.stringify(s))).toBeNull()}}
 const orphan=JSON.parse(armed);delete orphan.enemies[0].motion;expect(restoreDungeonRun(JSON.stringify(orphan))).toBeNull();delete orphan.enemies[0].aim;expect(restoreDungeonRun(JSON.stringify(orphan))).toBeNull()
 for(const to of [{x:NaN,z:0},{x:1e7,z:0},{x:0,z:1e7}]){const s=JSON.parse(source);s.effects=[{id:s.nextId++,x:0,z:0,kind:"sentry",life:.3,value:1,to}];expect(restoreDungeonRun(JSON.stringify(s))).toBeNull()}
})

it("pushes only safe nearby targets with the switch and resolves equidistant tower shots stably",()=>{
 const r=run(),s=r.state;s.relics.switch=1
 const target=r.spawn("skeleton",{x:1,z:0})!,near=r.spawn("guard",{x:2,z:0})!,zero=r.spawn("guard",{x:1,z:0})!;r.spawn("guard",{x:8,z:0});target.words=["go"];near.words=["Near","Guard"];zero.words=["Zero","Guard"];r.refreshQueue();for(const key of "go")r.input(key);expect(near.x).toBe(3);expect(zero.x).toBe(1)
 s.enemies=[];s.queue=[];s.player.x=3;s.player.z=6;const edge=r.spawn("skeleton",{x:4.5,z:7.3})!,blocked=r.spawn("guard",{x:5.4,z:7.6})!;edge.words=["go"];blocked.words=["Safe","Guard"];r.refreshQueue();for(const key of "go")r.input(key);expect(blocked.x).toBe(5.4)
 blocked.x=10;blocked.z=10;const before={x:blocked.x,z:blocked.z};(r as unknown as {moveEnemy:(e:typeof blocked,dt:number)=>void}).moveEnemy(blocked,.1);expect({x:blocked.x,z:blocked.z}).toEqual(before)
 const t=run();t.state.sentry={x:0,z:0,life:18,cooldown:0};const first=t.spawn("guard",{x:2,z:0})!,second=t.spawn("guard",{x:-2,z:0})!;first.speed=second.speed=0;tick(t,.04);expect(first.words).toHaveLength(1);expect(second.words).toHaveLength(2)
})
