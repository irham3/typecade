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
 const target=r.spawn("skeleton",{x:1,z:0})!,near=r.spawn("guard",{x:2,z:0})!,zero=r.spawn("guard",{x:0,z:0})!;r.spawn("guard",{x:8,z:0});target.words=["go"];near.words=["Near","Guard"];zero.words=["Zero","Guard"];r.refreshQueue();for(const key of "go")r.input(key);expect(near.x).toBe(3);expect(zero.x).toBe(0)
 s.enemies=[];s.queue=[];s.player.x=3;s.player.z=6;const edge=r.spawn("skeleton",{x:4.5,z:7.3})!,blocked=r.spawn("guard",{x:5.4,z:7.6})!;edge.words=["go"];blocked.words=["Safe","Guard"];r.refreshQueue();for(const key of "go")r.input(key);expect(blocked.x).toBe(5.4)
 blocked.x=10;blocked.z=10;const before={x:blocked.x,z:blocked.z};(r as unknown as {moveEnemy:(e:typeof blocked,dt:number)=>void}).moveEnemy(blocked,.1);expect({x:blocked.x,z:blocked.z}).toEqual(before)
 const t=run();t.state.sentry={x:0,z:0,life:18,cooldown:0};const first=t.spawn("guard",{x:2,z:0})!,second=t.spawn("guard",{x:-2,z:0})!;first.speed=second.speed=0;tick(t,.04);expect(first.words).toHaveLength(1);expect(second.words).toHaveLength(2)
})

it("keeps supplies stationary under knockback and reserves lightning hits for eligible targets",()=>{
 const r=run(),s=r.state;s.relics.switch=s.relics.lightning=1
 const supply=r.spawn("shield",{x:2,z:0})!,health=r.spawn("potion",{x:3,z:0})!,a=r.spawn("guard",{x:3,z:1})!,b=r.spawn("guard",{x:3,z:-1})!,target=r.spawn("skeleton",{x:1,z:0})!;target.words=["go"];s.correct=9;s.streak=s.bestStreak=9;r.refreshQueue();r.input("g");expect(a.words).toHaveLength(1);expect(b.words).toHaveLength(1);r.input("o");expect(supply.x).toBe(2);expect(health.x).toBe(3)
 const barrel=r.spawn("barrel",{x:3,z:0})!;r.cancel();r.refreshQueue();for(const key of barrel.words[0]!)r.input(key);expect(s.enemies).toContain(supply);expect(s.enemies).toContain(health)
})

it("telegraphs boss hammer slams and protects a typed target from automatic relic shots",()=>{
 const r=run(),s=r.state;s.player.invincible=0
 const boss=r.spawn("boss",{x:2.5,z:0})!;boss.attack=0;s.worldTime=0;r.advance(.1);expect(boss.motion).toBe("windup");expect(boss.aim).toEqual({x:boss.x,z:boss.z})
 for(let i=0;i<12;i++)r.advance(.1)
 expect(s.effects.some(f=>f.kind==="slam")).toBe(true);expect(s.player.hp).toBeLessThan(s.player.maxHp)
 for(let i=0;i<20;i++)r.advance(.1);expect(boss.motion).toBeUndefined()
 s.enemies=[];s.boss=null;s.queue=[];s.relics.vowels=s.relics.lightning=1
 const locked=r.spawn("skeleton",{x:2,z:0})!,other=r.spawn("goblin",{x:3,z:0})!;locked.words=["aeon"];other.words=["cut"];r.refreshQueue();s.correct=9;r.input("a")
 expect(s.target).toBe(locked.id);expect(s.prefix).toBe("a");expect(s.enemies).toContain(locked);expect(s.enemies).not.toContain(other);expect(s.effects.some(f=>f.kind==="lightning"&&f.to)).toBe(true);expect(s.procs.lightning).toBe(4)
 const next=r.spawn("goblin",{x:3,z:0})!;r.input("e");expect(s.effects.some(f=>f.kind==="firebolt")).toBe(true);expect(s.enemies).not.toContain(next);expect(s.procs.vowels).toBe(2.4)
 r.advance(.1);expect(s.procs.vowels).toBeLessThan(2.4)
 const loaded=restoreDungeonRun(r.serialize());expect(loaded?.state.procs).toEqual(s.procs)
 for(const field of ["lightning","vowels"] as const){for(const bad of [-1,5,"bad",null]){const raw=JSON.parse(r.serialize());raw.procs[field]=bad;expect(restoreDungeonRun(JSON.stringify(raw))).toBeNull()}}
 const raw=JSON.parse(r.serialize());raw.effects=[{id:1,kind:"shatter",source:"invalid",x:0,z:0,life:.5,value:1}];expect(restoreDungeonRun(JSON.stringify(raw))).toBeNull()
})

it("keeps a boss combo through retaliation, allows word guards and restores old proc-free checkpoints",()=>{
 const r=run(),s=r.state;const boss=r.spawn("boss",{x:4,z:0})!;boss.words=["A"];r.refreshQueue();r.input("A");expect(s.phase).toBe("overdrive");expect(Math.hypot(s.player.x-boss.x,s.player.z-boss.z)).toBeGreaterThan(3)
 const text=s.paragraph;r.input(text[0]!);const cursor=s.cursor;s.stagger=.01;s.player.invincible=0;r.advance(.1)
 expect(s.cursor).toBe(cursor);expect(s.paragraph).toBe(text);expect(s.phase).toBe("overdrive");expect(s.player.hp).toBe(5)
 s.stagger=.01;s.player.invincible=1;r.advance(.1);expect(s.player.hp).toBe(5);expect(s.effects.some(e=>e.kind==="block"&&e.value===0)).toBe(true)
 const legacy=JSON.parse(r.serialize());delete legacy.procs;expect(restoreDungeonRun(JSON.stringify(legacy))?.state.procs).toEqual({lightning:0,vowels:0})
 // A malformed in-memory boss location must not move the hero into blocked terrain.
 s.phase="arena";boss.x=10;boss.z=10;s.player.x=10;s.player.z=10;boss.words=["A"];s.target=boss.id;s.prefix="";r.input("A");expect(s.player.x).toBe(10)
 const far=run();const distant=far.spawn("boss",{x:7,z:0})!;distant.words=["A"];far.input("Tab");far.cast("storm");expect(far.state.phase).toBe("overdrive");expect(far.state.player.x).toBe(0)
})

it("settles overlapping barrel chain reactions once without duplicate rewards",()=>{
 const r=run(),s=r.state,first=r.spawn("barrel",{x:1,z:0})!,second=r.spawn("barrel",{x:2,z:0})!,foe=r.spawn("skeleton",{x:2,z:1})!
 r.refreshQueue();for(const key of first.words[0]!)r.input(key)
 expect(s.enemies).not.toContain(first);expect(s.enemies).not.toContain(second);expect(s.enemies).not.toContain(foe);expect(s.kills).toBe(1);expect(s.totalXp).toBe(50);expect(s.loot.reduce((sum,drop)=>sum+drop.xp,0)).toBe(25)
 expect(s.effects.filter(e=>e.kind==="blast")).toHaveLength(2)
})

it("never starts a boss combo from passive lightning or tower fire during another word",()=>{
 const r=run(),s=r.state,boss=r.spawn("boss",{x:2,z:0})!,locked=r.spawn("skeleton",{x:1,z:0})!;boss.words=["BREAK"];locked.words=["aeon"];s.relics.lightning=1;s.correct=9;s.streak=s.bestStreak=9;s.sentry={x:0,z:0,life:18,cooldown:0};r.refreshQueue();r.input("a");r.advance(.1)
 expect(s.phase).toBe("arena");expect(s.target).toBe(locked.id);expect(s.prefix).toBe("a");expect(boss.words).toEqual(["BREAK"])
})

it("lands outside contact range and interrupts heavy retaliation after a clean armor hit",()=>{
 for(const kind of ["guard","minotaur","boss"] as const){
  const r=run(),s=r.state,e=r.spawn(kind,{x:4,z:0})!;s.player.invincible=0;e.words=["A","B"];r.refreshQueue()
  r.input("A");expect(e.words).toEqual(["B"]);expect(Math.hypot(s.player.x-e.x,s.player.z-e.z)).toBeCloseTo(kind==="boss"?3.5:2.2)
  expect(dungeonWalkable(s.player)).toBe(true);if(kind!=="guard")expect(e.motion).toBe("recover")
  tick(r,.9);expect(s.player.hp).toBe(s.player.maxHp)
  r.input("B");expect(kind==="boss"?s.phase:s.kills).toBe(kind==="boss"?"overdrive":1)
 }
 // A strike from within an overlapping actor uses the previous approach direction.
 const r=run(),e=r.spawn("guard",{x:0,z:0})!;e.words=["A","B"];r.refreshQueue();r.input("A");expect(Math.hypot(r.state.player.x,r.state.player.z)).toBeCloseTo(2.2)
})
