import {expect,it} from "vitest"
import {SurvivalRun,restoreDungeonRun,dungeonWalkable} from "./survival"
import {dungeonBalance as B,dungeonObjects,dungeonSupplies} from "../../content/src/dungeon"
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
 const text=s.paragraph;r.input(text[0]!);const cursor=s.cursor;s.stagger=.01;boss.x=s.player.x+2;boss.z=s.player.z;boss.motion="windup";boss.motionTime=.01;boss.aim={x:s.player.x,z:s.player.z};s.player.invincible=0;r.advance(.1)
 expect(s.cursor).toBe(cursor);expect(s.paragraph).toBe(text);expect(s.phase).toBe("overdrive");expect(s.player.hp).toBe(5)
 s.stagger=.01;boss.motion="windup";boss.motionTime=.01;s.player.invincible=1;r.advance(.1);expect(s.player.hp).toBe(5);expect(s.effects.some(e=>e.kind==="block"&&e.value===0)).toBe(true)
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

it("moves the boss back on correct input, rushes after typos and sidesteps on completed words",()=>{
 const r=run(),s=r.state,boss=r.spawn("boss",{x:4,z:0})!;boss.words=["A"];r.refreshQueue();r.input("A");s.paragraph="tebas kini BLIZZARD";const gap=()=>Math.hypot(boss.x-s.player.x,boss.z-s.player.z)
 const before=gap();r.input("t");expect(gap()).toBeGreaterThan(before);const pushed=gap();r.input("?");expect(gap()).toBeLessThan(pushed);expect(s.bossArena!.rage).toBe(2);const rushed=gap();tick(r,.5);expect(gap()).toBeLessThan(rushed)
 const position={x:s.player.x,z:s.player.z};for(const c of "ebas ")r.input(c);expect({x:s.player.x,z:s.player.z}).not.toEqual(position);expect(s.cursor).toBe(6);expect(s.player.invincible).toBeGreaterThan(0)
 const cursor=s.cursor;r.pause();tick(r,2);expect(s.cursor).toBe(cursor);const frozen=r.serialize();tick(r,1);expect(r.serialize()).toBe(frozen);expect(restoreDungeonRun(frozen)).not.toBeNull()
})
it("lets the horde break its real barricade without ending the paragraph or opening a draft",()=>{
 const r=run(),s=r.state,boss=r.spawn("boss",{x:4,z:0})!;boss.words=["A"];r.refreshQueue();r.input("A");const text=s.paragraph;s.pendingDrafts=1;r.input(text[0]!);const cursor=s.cursor
 let elapsed=0;while(s.bossArena!.hp>0&&elapsed<30){r.advance(.1);elapsed+=.1}
 expect(Math.hypot(boss.x-s.player.x,boss.z-s.player.z)).toBeGreaterThanOrEqual(2.1);expect(elapsed).toBeGreaterThan(B.barrierHp*.8-1);expect(elapsed).toBeLessThan(B.barrierHp*.8+7);expect(s.bossArena!.hp).toBe(0);expect(s.effects.some(f=>f.kind==="barrier"&&f.value===0)).toBe(true);expect(s.cursor).toBe(cursor);expect(s.paragraph).toBe(text);expect(s.phase).toBe("overdrive");expect(s.offers).toHaveLength(0)
 const foe=s.enemies.find(e=>e.id!==boss.id)!;foe.x=s.player.x;foe.z=s.player.z;s.player.invincible=0;r.advance(.1);expect(s.player.hp).toBeLessThan(s.player.maxHp)
 boss.health=1;for(const c of text.slice(cursor,-1))r.input(c);expect(s.boss).toBe(boss.id);r.input(text.at(-1)!);expect(s.bossArena).toBeNull();expect(s.phase).toBe("draft")
})
it("blocks incoming shots at the barricade and validates compatible duel saves",()=>{
 const r=run(),s=r.state,boss=r.spawn("boss",{x:4,z:0})!;boss.words=["A"];r.refreshQueue();r.input("A");s.enemies=[boss];s.player.invincible=0
 const shot=()=>s.projectiles.push({id:s.nextId++,x:s.player.x,z:s.player.z,vx:0,vz:0,life:3})
 shot();r.advance(.1);expect(s.projectiles).toHaveLength(0);expect(s.bossArena!.hp).toBe(B.barrierHp-1);expect(s.player.hp).toBe(6)
 shot();r.advance(.1);expect(s.bossArena!.hp).toBe(B.barrierHp-1);s.bossArena!.hp=0;shot();r.advance(.1);expect(s.player.hp).toBe(5)
 s.stagger=0;expect(restoreDungeonRun(r.serialize())).not.toBeNull()
 const base=JSON.parse(r.serialize());for(const change of [(v:DungeonState)=>{v.bossArena!.hp=-1},(v:DungeonState)=>{v.bossArena!.hp=B.barrierHp+1},(v:DungeonState)=>{v.bossArena!.calm=-1},(v:DungeonState)=>{v.bossArena!.calm=B.duelCalmMax+1},(v:DungeonState)=>{v.bossArena!.calm=NaN},(v:DungeonState)=>{v.bossArena!.hp=.5},(v:DungeonState)=>{v.bossArena!.cooldown=1},(v:DungeonState)=>{v.bossArena!.rage=3},(v:DungeonState)=>{v.bossArena!.x=NaN},(v:DungeonState)=>{v.bossArena!.z=1e7},(v:DungeonState)=>{v.bossArena!.x=1e7},(v:DungeonState)=>{v.bossArena!.x=v.bossArena!.z=10},(v:DungeonState)=>{v.boss=null}]){const raw=structuredClone(base);change(raw);expect(restoreDungeonRun(JSON.stringify(raw))).toBeNull()}
 const legacy=structuredClone(base);delete legacy.bossArena.calm;expect(restoreDungeonRun(JSON.stringify(legacy))?.state.bossArena?.calm).toBe(0)
 delete base.bossArena;expect(restoreDungeonRun(JSON.stringify(base))?.state.bossArena).toBeNull()
})

it("keeps frost meaningful during a boss duel and never moves a frozen boss on a typo",()=>{
 const r=run(),boss=r.spawn("boss",{x:4,z:0})!;boss.words=["A"];r.refreshQueue();r.input("A");boss.frozen=1;const at={x:boss.x,z:boss.z};r.input("?");tick(r,.5);expect({x:boss.x,z:boss.z}).toEqual(at);expect(boss.frozen).toBeLessThan(1);tick(r,.6);expect(boss.frozen).toBe(0);r.state.bossArena=null;r.input("?");expect(r.state.bossArena).toBeNull();r.advance(.1);expect(r.state.bossArena).not.toBeNull()
})

it("holds the boss outside hammer reach while typing stays steady, and lets hesitation invite a slam",()=>{
 const r=run(),s=r.state,boss=r.spawn("boss",{x:4,z:0})!;boss.words=["A"];r.refreshQueue();r.input("A");s.enemies=[boss];s.player.invincible=0
 s.paragraph="a".repeat(200)+" BLIZZARD";s.cursor=0;const gap=()=>Math.hypot(boss.x-s.player.x,boss.z-s.player.z)
 // A slow but steady 20 WPM rhythm: one correct letter every 0.6 s.
 let closest=99;for(let i=0;i<60;i++){r.input("a");for(let k=0;k<18;k++){r.advance(1/30);closest=Math.min(closest,gap())}}
 expect(closest).toBeGreaterThan(2.8);expect(boss.motion).toBeUndefined();expect(s.effects.some(e=>e.kind==="slam")).toBe(false);expect(s.player.hp).toBe(6)
 // Stopping drains the calm; the boss closes in, telegraphs and strikes.
 let slammed=false;for(let i=0;i<300&&!slammed;i++){r.advance(1/30);slammed=s.effects.some(e=>e.kind==="slam")}
 expect(slammed).toBe(true);expect(s.bossArena!.calm).toBe(0);expect(s.player.hp).toBe(5)
 // A typo removes the remaining calm immediately.
 r.input("a");expect(s.bossArena!.calm).toBeGreaterThan(0);r.input("?");expect(s.bossArena!.calm).toBe(0);expect(s.bossArena!.rage).toBe(2)
})

it("raises a fresh barricade around the hero for every armor break",()=>{
 const r=run(),s=r.state,boss=r.spawn("boss",{x:4,z:0})!;boss.words=["A"];r.refreshQueue();r.input("A")
 const first={x:s.bossArena!.x,z:s.bossArena!.z};expect(s.bossArena!.hp).toBe(B.barrierHp);s.bossArena!.hp=3
 for(const c of s.paragraph)r.input(c);expect(s.phase).toBe("arena");expect(s.boss).toBe(boss.id);expect(s.bossArena).toBeNull()
 s.enemies=[boss];boss.x=s.player.x+9;boss.z=s.player.z;boss.words=["A"];r.refreshQueue();r.input("A");expect(s.phase).toBe("overdrive")
 expect(s.bossArena!.hp).toBe(B.barrierHp);expect(Math.hypot(s.bossArena!.x-s.player.x,s.bossArena!.z-s.player.z)).toBe(0);expect(Math.hypot(s.bossArena!.x-first.x,s.bossArena!.z-first.z)).toBeGreaterThan(3)
})

it("keeps duel sidesteps inside the barricade and lets the hero escape telegraphed hammers",()=>{
 const r=run(),s=r.state,boss=r.spawn("boss",{x:4,z:0})!;boss.words=["A"];r.refreshQueue();r.input("A");s.enemies=[boss];s.player.invincible=0
 s.paragraph="a a a BLIZZARD";s.cursor=0;const dir=Math.atan2(boss.x-s.player.x,boss.z-s.player.z);s.bossArena!.x=s.player.x-Math.sin(dir)*(B.barrierRadius-2.04);s.bossArena!.z=s.player.z-Math.cos(dir)*(B.barrierRadius-2.04)
 const before={x:s.player.x,z:s.player.z};r.input("a");r.input(" ");expect({x:s.player.x,z:s.player.z}).toEqual(before)
 // A wound-up hammer that lands after the hero has moved out of reach only shakes the floor.
 s.bossArena!.calm=0;s.stagger=0;boss.motion="windup";boss.motionTime=.01;boss.aim={x:boss.x,z:boss.z};boss.x=s.player.x+3.5;boss.z=s.player.z;s.player.invincible=0
 r.advance(.05);expect(s.effects.some(e=>e.kind==="slam")).toBe(true);expect(s.player.hp).toBe(6);expect(boss.motion).toBe("recover")
 // Outside the duel, a planted slam misses a hero standing beyond its radius.
 const a=run(),t=a.state,m=a.spawn("minotaur",{x:4,z:0})!;t.player.invincible=0;m.motion="windup";m.motionTime=.01;m.aim={x:m.x,z:m.z}
 a.advance(.05);expect(m.motion).toBe("slam");expect(t.player.hp).toBe(6)
})

it("gives the expanded bestiary real wards, summons, blinks, regeneration, ranged shots and packs",()=>{
 const r=run(),s=r.state;s.player.invincible=0
 // Shaman wards the nearest unlocked ally with an extra armor word, never the locked target.
 const shaman=r.spawn("shaman",{x:6,z:0})!,ally=r.spawn("skeleton",{x:5,z:1})!;shaman.attack=0;r.advance(.05)
 expect(ally.words).toHaveLength(2);expect(s.effects.some(e=>e.kind==="ward")).toBe(true);expect(shaman.attack).toBeGreaterThan(5)
 // Necromancer raises a skeleton while under the threat cap, and fails quietly at the entity cap.
 s.enemies=[];const necro=r.spawn("necromancer",{x:6,z:0})!;necro.attack=0;r.advance(.05);expect(s.enemies.filter(e=>e.kind==="skeleton")).toHaveLength(1);expect(s.effects.some(e=>e.kind==="summon")).toBe(true)
 necro.attack=0;const before=s.enemies.length;const spawn=r.spawn.bind(r);r.spawn=(()=>undefined) as typeof r.spawn;r.advance(.05);r.spawn=spawn;expect(s.enemies.length).toBe(before)
 // Wraith blinks closer on a walkable path.
 s.enemies=[];const wraith=r.spawn("wraith",{x:7,z:0})!;wraith.attack=0;const gap=Math.hypot(wraith.x-s.player.x,wraith.z-s.player.z);r.advance(.05);expect(Math.hypot(wraith.x-s.player.x,wraith.z-s.player.z)).toBeLessThan(gap-2);expect(s.effects.some(e=>e.kind==="blink")).toBe(true)
 // Troll regrows an armor word when left alone; a hit resets the timer.
 s.enemies=[];const troll=r.spawn("troll",{x:7,z:0})!;expect(troll.words).toHaveLength(2);troll.words=["Club"];troll.attack=0;r.advance(.05);expect(troll.words).toHaveLength(2)
 // Archer and imp loose real projectiles at different speeds.
 for(const kind of ["archer","imp"] as const){s.enemies=[];s.projectiles=[];const e=r.spawn(kind,{x:5,z:0})!;e.attack=0;r.advance(.05);expect(s.projectiles).toHaveLength(1);expect(Math.hypot(s.projectiles[0]!.vx,s.projectiles[0]!.vz)).toBeCloseTo(kind==="archer"?4.5:3.2)}
 // Wolves, serpents, beetles, assassins and wisps commit to a telegraphed lunge; golems plant a slam.
 for(const kind of ["wolf","serpent","beetle","assassin","wisp","golem"] as const){s.enemies=[];const e=r.spawn(kind,{x:kind==="golem"?2:2.5,z:0})!;e.attack=0;r.advance(.05);expect(e.motion).toBe("windup");if(kind==="golem")expect(e.aim).toEqual({x:e.x,z:e.z})}
 // New armored kinds and XP values come from their profiles.
 s.enemies=[];expect(r.spawn("golem",{x:4,z:0})!.words).toHaveLength(3);expect(r.spawn("beetle",{x:-4,z:0})!.words).toHaveLength(2)
})

it("unlocks the bestiary over time, favours each depth's residents and spawns rats in packs",()=>{
 const roster=(time:number,biome=0)=>{const r=new SurvivalRun("roster");r.state.time=time;r.state.biome=biome;return (r as unknown as {roster:(o:boolean)=>string[]}).roster(time<90)}
 expect(roster(10)).not.toContain("slime");expect(roster(50)).toContain("slime");expect(roster(70)).toContain("rat")
 expect(roster(100)).toContain("wolf");expect(roster(100)).not.toContain("archer");expect(roster(130)).toContain("archer")
 expect(roster(200)).toContain("shaman");expect(roster(200)).not.toContain("golem");expect(roster(320)).toContain("necromancer")
 expect(roster(320,1).filter(k=>k==="wraith").length).toBe(2);expect(roster(320,3).filter(k=>k==="wolf").length).toBe(3)
 const r=new SurvivalRun("rat-pack");r.start();const s=r.state;s.enemies=[];s.queue=[];s.time=200;s.spawnAt=0;s.player.invincible=99
 let packs=0;for(let i=0;i<400&&!packs;i++){s.enemies=s.enemies.filter(e=>e.kind==="rat");r.advance(.1);s.spawnAt=0;if(s.enemies.filter(e=>e.kind==="rat").length>=2)packs++}
 expect(packs).toBe(1)
})

it("stages boss duels on open floor away from ruins, clears loose items and keeps the horde outside the fence",()=>{
 const r=run(),s=r.state;s.player.x=10;s.player.z=4;expect(dungeonWalkable(s.player)).toBe(true);expect(dungeonWalkable({x:10,z:8})).toBe(false)
 const boss=r.spawn("boss",{x:13,z:3})!,barrel=r.spawn("barrel",{x:9,z:3})!,chest=r.spawn("chest",{x:11,z:5})!,inside=r.spawn("skeleton",{x:10.5,z:4.5})!
 s.projectiles.push({id:s.nextId++,x:10,z:5,vx:0,vz:-1,life:3});boss.words=["A"];r.refreshQueue();r.input("A");expect(s.phase).toBe("overdrive")
 const wall=s.bossArena!
 for(let a=0;a<24;a++)for(const radius of [B.barrierRadius,B.barrierRadius+1])expect(dungeonWalkable({x:wall.x+Math.sin(a*Math.PI/12)*radius,z:wall.z+Math.cos(a*Math.PI/12)*radius})).toBe(true)
 expect({x:s.player.x,z:s.player.z}).toEqual({x:wall.x,z:wall.z});expect(s.enemies.some(e=>e===barrel||e===chest)).toBe(false);expect(s.projectiles).toHaveLength(0)
 expect(s.enemies.filter(e=>e.id!==boss.id).every(e=>Math.hypot(e.x-wall.x,e.z-wall.z)>B.barrierRadius+.4)).toBe(true);expect(s.enemies.includes(inside)).toBe(true);expect(s.notice).toContain("BOSS DUEL")
 // A foe that appears inside the intact fence is pushed out before it can act; the hero takes no horde damage.
 const sneak=r.spawn("goblin",{x:wall.x+1,z:wall.z})!;s.player.invincible=0;s.bossArena!.calm=99;boss.frozen=99
 for(let i=0;i<150;i++){r.advance(1/30);s.bossArena!.calm=1.5;s.bossArena!.hp=B.barrierHp}
 expect(Math.hypot(sneak.x-wall.x,sneak.z-wall.z)).toBeGreaterThan(B.barrierRadius-.3);expect(s.player.hp).toBe(6)
 // With no open point outside, a trapped foe is removed rather than left inside.
 const trapped=r.spawn("rat",{x:wall.x,z:wall.z+1})!;const strike=(r as unknown as {strikePosition:(e:unknown,n:number,f:unknown)=>unknown});const original=strike.strikePosition;strike.strikePosition=()=>({x:wall.x,z:wall.z});r.advance(.05);strike.strikePosition=original
 expect(s.enemies.includes(trapped)).toBe(false)
})

it("drops foes it cannot place outside the duel fence and holds reinforcements until there is room",()=>{
 const r=run(),s=r.state,boss=r.spawn("boss",{x:4,z:0})!,inside=r.spawn("skeleton",{x:1,z:0})!;boss.words=["A"];r.refreshQueue()
 const hooks=r as unknown as {outsideRing:()=>null;arenaCenter:()=>{x:number;z:number}};hooks.outsideRing=()=>null
 r.input("A");expect(s.phase).toBe("overdrive");expect(s.enemies.includes(inside)).toBe(false);expect(s.enemies.filter(e=>e.id!==boss.id)).toHaveLength(0)
 s.spawnAt=0;r.advance(.05);expect(s.enemies.filter(e=>e.id!==boss.id)).toHaveLength(0)
 // Without any open floor the duel stays where the hero stands.
 s.player.x=Number.NaN;const at=hooks.arenaCenter();expect(Number.isNaN(at.x)).toBe(true)
})
