import { describe, expect, it } from "vitest"
import { SurvivalRun, createDungeonState, dungeonWalkable, restoreDungeonRun, runAccuracy, runWpm, xpThreshold } from "./survival"
import { commonWords, commonWordStyle, dungeonBalance as B, dungeonUpgrades, dungeonWords, dungeonLongWords, dungeonObjects, skillRules } from "../../content/src/dungeon"
import type { DungeonState, EnemyKind, SkillId, UpgradeId } from "../../contracts/src/survival"

const type = (run: SurvivalRun, word: string) => { for (const key of word) run.input(key) }
function arena() { const run = new SurvivalRun("test","en"); run.start(); run.state.enemies = []; run.state.queue = []; run.state.spawnAt = 100; return run }
function tick(run: SurvivalRun, seconds: number) { for (let i = 0; i < Math.ceil(seconds * 30); i++) run.advance(1 / 30) }
function defeat(run: SurvivalRun, kind: EnemyKind = "skeleton") { const e = run.spawn(kind, { x: run.state.player.x + 2, z: run.state.player.z })!; run.refreshQueue(); while (e.words.length && run.state.enemies.includes(e)) type(run, e.words[0]!); return e }

describe("real-time typing survival", () => {
 it("varies words without weakening enemy-specific case, symbols or armor",()=>{
  for(const language of ["en","id"] as const){
   const r=new SurvivalRun("lexicon",language);r.state.enemies=[]
   for(const kind of Object.keys(dungeonWords[language]) as EnemyKind[]){
    const pool=dungeonWords[language][kind];expect(new Set(pool).size).toBe(pool.length);expect(pool.length).toBeGreaterThanOrEqual(dungeonObjects.includes(kind)?8:(["gargoyle","mimic","sporeling","ghoul","deathknight"] as EnemyKind[]).includes(kind)?16:40)
    const seen:string[]=[]
    const style=commonWordStyle[kind],borrowed=style?commonWords[language].filter(w=>w.length>=3&&w.length<=style.max).map(w=>style.style==="lower"?w:style.style==="upper"?w.toUpperCase():w[0]!.toUpperCase()+w.slice(1)):[]
    let mixed=0
    for(let i=0;i<30;i++){r.state.enemies=[];r.state.boss=null;const e=r.spawn(kind,{x:2,z:0})!;expect([...pool,...borrowed]).toContain(e.words[0]);if(!pool.includes(e.words[0]!))mixed++;seen.push(...e.words)}
    if(style){expect(mixed).toBeGreaterThan(3);expect(mixed).toBeLessThan(27)}else expect(mixed).toBe(0)
    if(kind==="skeleton"||kind==="goblin")expect(seen.every(w=>/^[a-z]{3,7}$/.test(w))).toBe(true)
    if(kind==="guard")expect(seen.every(w=>/^[A-Z][a-z]+$/.test(w))).toBe(true)
    expect(new Set(seen).size).toBeGreaterThanOrEqual(Math.min(pool.length,20))
    if(kind==="skeleton"||kind==="goblin")expect(pool.every(w=>/^[a-z]{3,7}$/.test(w))).toBe(true)
    if(kind==="guard")expect(pool.every(w=>/^[A-Z][a-z]+$/.test(w))).toBe(true)
    if(kind==="boss"||kind==="minotaur")expect(pool.every(w=>/^[A-Z]+$/.test(w))).toBe(true)
    if(kind==="bomber")expect(pool.every(w=>/^[a-z]+-\d+$/.test(w))).toBe(true)
    if(kind==="mage")expect(pool.every(w=>/[!_]/.test(w))).toBe(true)
   }
   r.state.enemies=[];r.state.recentWords=[];const recent:string[]=[]
   for(let i=0;i<80;i++){const e=r.spawn("skeleton",{x:2,z:0})!;expect(recent.slice(-24)).not.toContain(e.words[0]);recent.push(e.words[0]!);r.state.enemies=[]}
   expect(r.state.recentWords).toHaveLength(24)
   r.state.time=901;const late=Array.from({length:12},()=>{r.state.enemies=[];return r.spawn("goblin")!.words[0]!});expect(late.some(w=>dungeonLongWords[language].includes(w))).toBe(true)
   r.refreshQueue();const original=r.serialize(),loaded=restoreDungeonRun(original)!
   expect(loaded.state.recentWords).toEqual(r.state.recentWords);expect(loaded.spawn("guard")?.words).toEqual(r.spawn("guard")?.words)
   const legacy=JSON.parse(original);delete legacy.recentWords;expect(restoreDungeonRun(JSON.stringify(legacy))?.state.recentWords).toEqual([])
   for(const bad of [null,[7],[""],["x".repeat(41)],Array(25).fill("cut")]){const s=JSON.parse(original);s.recentWords=bad;expect(restoreDungeonRun(JSON.stringify(s))).toBeNull()}
  }
 })
 it("refills reachable combat targets promptly after a dash and bounds their approach",()=>{
  for(const time of [0,100,160])for(const position of [{x:0,z:0},{x:14,z:4},{x:-12,z:-3}]){
   const r=arena();r.state.player.x=position.x;r.state.player.z=position.z;r.state.time=time;r.state.nextBoss=1000;r.state.spawnAt=2
   tick(r,.4)
   const targets=r.targets().filter(e=>!dungeonObjects.includes(e.kind))
   expect(targets.length).toBeGreaterThanOrEqual(time<60?2:3)
   expect(new Set(targets.map(e=>e.words[0]![0])).size).toBe(targets.length)
   for(const e of targets){const d=Math.hypot(e.x-position.x,e.z-position.z);expect(d).toBeGreaterThan(5.5);expect(d).toBeLessThan(8.6);for(let t=0;t<=1;t+=.05)expect(dungeonWalkable({x:position.x+(e.x-position.x)*t,z:position.z+(e.z-position.z)*t})).toBe(true)}
   expect(targets.some((a,i)=>targets.slice(i+1).some(b=>Math.hypot(a.x-b.x,a.z-b.z)<.9))).toBe(false)
   r.state.enemies=[];r.state.queue=[];r.state.player.x+=4;tick(r,.8);expect(r.targets().length).toBeGreaterThanOrEqual(4)
  }
  const r=arena();tick(r,.4);expect(r.state.enemies).toHaveLength(0)
 })
 it("opens gently and bounds each learning stage before regular horde pressure",()=>{
  const r=new SurvivalRun("gentle-start","en");r.start();expect(r.state.queue).toHaveLength(4)
  expect(r.state.enemies.map(e=>e.kind)).toEqual(["skeleton","goblin","chest","shield"])
  expect(r.state.enemies[0]!.speed).toBeLessThan(B.speed)
  r.state.player.invincible=1000
  for(let i=0;i<179*30;i++){r.advance(1/30);expect(r.state.enemies.filter(e=>!dungeonObjects.includes(e.kind)).length).toBeLessThanOrEqual((r.state.time<B.openingSeconds?B.openingThreats:B.learningThreats)+6)}
  r.state.enemies=[];r.state.queue=[];r.state.time=B.learningSeconds+1;r.state.spawnAt=0;tick(r,1);expect(r.targets().filter(e=>!dungeonObjects.includes(e.kind)).length).toBeGreaterThanOrEqual(4);tick(r,45);expect(r.state.enemies.filter(e=>!dungeonObjects.includes(e.kind)).length).toBeLessThanOrEqual(B.preBossThreats+6)
 })
 it("applies the mana benefit shown on active upgrades and increases the actual cleave reach",()=>{
  for(const id of ["cleave","storm","heal"] as const){
   const r=arena(),cost=r.skillCost(id);r.state.phase="draft";r.state.pendingDrafts=1;r.state.offers=[id];r.state.player.hp=3;r.state.player.mana=50
   expect(r.chooseUpgrade(id)).toBe(true);expect(r.state.skills[id].level).toBe(2);expect(r.skillCost(id)).toBe(cost-5);expect(r.state.player.hp).toBe(4);expect(r.state.player.mana).toBe(65)
   expect(r.state.notice).toContain("Rank 2")
   if(id==="cleave"){const victim=r.spawn("skeleton",{x:5,z:0})!;r.input("Tab");r.cast("cleave");expect(r.state.enemies).not.toContain(victim)}
  }
 })
 it("preserves a storm cue when a full horde fills the bounded effect history",()=>{
  const r=arena()
  for(let i=0;i<B.enemies;i++)r.spawn("guard",{x:Math.sin(i)*5,z:Math.cos(i)*5})
  r.input("Tab");expect(r.cast("storm")).toBe(true)
  expect(r.state.enemies).toHaveLength(128);expect(r.state.enemies.every(e=>e.words.length===1)).toBe(true)
  expect(r.state.effects).toHaveLength(B.effects);expect(r.state.effects.some(fx=>fx.kind==="storm")).toBe(true)
  r.state.effects=Array.from({length:B.effects},()=>({id:r.state.nextId++,kind:"slash" as const,x:0,z:0,life:.5,value:1}))
  r.state.player.mana=100;r.state.skills.storm.cooldown=0;r.input("Tab");r.cast("storm")
  expect(r.state.enemies).toHaveLength(0);expect(r.state.effects).toHaveLength(B.effects);expect(r.state.effects.some(fx=>fx.kind==="storm")).toBe(true)
 })
 it("handles pressure caps, interrupted targets and armor breaks caused by skills",()=>{
  const r=arena();r.resume();const enemy=r.spawn("minotaur",{x:2,z:0})!;r.refreshQueue();r.input(enemy.words[0]![0]!);enemy.words=[enemy.words[0]!];r.state.skills.storm.level=3;r.input("Tab");r.cast("storm");expect(r.state.prefix).toHaveLength(1);expect(enemy.words[0]!.length).toBeGreaterThan(1)
  r.state.target=999;r.input("x");expect(r.state.target).toBeNull()
  r.state.player.hp=2;r.state.skills.heal.level=1;r.input("Tab");r.cast("heal");expect(r.state.player.hp).toBe(4);expect(r.state.player.invincible).toBe(0)
  r.state.enemies=[];r.state.boss=null;const boss=r.spawn("boss",{x:2,z:0})!;boss.words=["BREAK"];r.input("Tab");r.state.skills.cleave.cooldown=0;r.state.player.mana=100;r.cast("cleave");expect(r.state.phase).toBe("overdrive")
  r.state.phase="arena";r.state.effects=Array.from({length:B.effects},(_,i)=>({id:i,kind:"hit" as const,x:0,z:0,life:.1,value:0}));boss.words=["B"];r.refreshQueue();r.input("B");expect(r.state.effects.length).toBeLessThanOrEqual(B.effects)
  const capped=arena();capped.state.time=300;capped.state.nextBoss=300;for(let i=0;i<B.enemies;i++)capped.spawn("mage",{x:0,z:3});capped.state.projectiles=Array.from({length:B.projectiles},(_,i)=>({id:i,x:20,z:20,vx:0,vz:0,life:8}));capped.state.enemies.forEach(e=>{e.attack=0});tick(capped,.1);expect(capped.state.projectiles.length).toBeLessThanOrEqual(B.projectiles);expect(capped.state.boss).toBeNull()
  const delayed=arena();delayed.input("Tab");delayed.state.time=300;tick(delayed,.1);expect(delayed.state.phase).toBe("arena");expect(delayed.state.boss).not.toBeNull()
  delayed.state.player.x=NaN;delayed.state.player.z=NaN;expect(delayed.spawn("skeleton",{x:NaN,z:NaN})).toBeUndefined()
 })
 it("rejects malformed counters, entity pools and positions before restoring them",()=>{
  const original=new SurvivalRun("malformed","en").serialize(),cases:Array<(s:DungeonState)=>void>=[
   s=>{s.level=0},s=>{s.level=1.1},s=>{s.pendingDrafts=1001},s=>{s.worldTime=2},s=>{s.xp=125},s=>{s.xp=1},s=>{s.streak=1},s=>{s.bestStreak=1},s=>{s.player.x=1e8},s=>{s.player.x=26;s.player.z=26},s=>{s.player.maxHp=0},
   s=>{s.enemies=Array(B.enemies+1).fill(s.enemies[0])},s=>{s.loot=Array(B.loot+1).fill({})},s=>{s.projectiles=Array(B.projectiles+1).fill({})},s=>{s.effects=Array(B.effects+1).fill({})},
   s=>{s.enemies[0]!.id=s.nextId},s=>{s.enemies[0]!.speed=11},s=>{s.enemies[0]!.words=[]},s=>{s.enemies[0]!.health=0},s=>{s.enemies[0]!.waypoint={x:26,z:26}},
   s=>{s.loot=[{id:1,x:0,z:0,xp:1e9,gold:0,mana:0}]},s=>{s.loot=[{id:1,x:1e7,z:0,xp:0,gold:0,mana:0}]},s=>{s.projectiles=[{id:1,x:0,z:0,vx:NaN,vz:0,life:1}]},s=>{s.effects=[{id:1,x:0,z:0,life:1,kind:"bad" as "hit",value:0}]},
   s=>{s.queue=[s.queue[0]!,s.queue[0]!]},s=>{s.offers=["storm","storm"]},s=>{s.target=s.enemies[0]!.id;s.prefix=s.enemies[0]!.words[0]!},
  ]
  for(const change of cases){const s=JSON.parse(original);change(s);expect(restoreDungeonRun(JSON.stringify(s))).toBeNull()}
  const armed=new SurvivalRun("armed","en");armed.start();const target=armed.targets()[0]!;armed.input(target.words[0]![0]!);expect(restoreDungeonRun(armed.serialize())).not.toBeNull()
  const legacy=JSON.parse(original);delete legacy.legendaryDrafts;expect(restoreDungeonRun(JSON.stringify(legacy))?.state.legendaryDrafts).toBe(0)
 })
 it("replays a seed and physical input deterministically, independently of renderer", () => {
  const play = () => { const r = new SurvivalRun("replay", "id"); r.start(); for (let i = 0; i < 12; i++) { const target = r.targets()[0]; if (target) type(r, target.words[0]!); tick(r, .5); if (r.state.phase === "draft") r.chooseUpgrade(r.state.offers[0]!) }; return r.serialize() }
  expect(play()).toBe(play()); expect(new SurvivalRun("other","en").serialize()).not.toBe(new SurvivalRun("replay","en").serialize())
 })
 it("locks exact-case words, rejects typos, dashes on completion and grants drops once", () => {
  const r = arena(), e = r.spawn("guard", { x: 2, z: 0 })!; r.refreshQueue(); const word = e.words[0]!
  r.input(word[0]!.toLowerCase()); expect(r.state.errors).toBe(1); expect(r.state.target).toBeNull()
  r.input(word[0]!); expect(r.state.target).toBe(e.id); r.input("~"); expect(r.state.prefix).toBe(word[0]); type(r, word.slice(1))
  expect(e.words).toHaveLength(1); expect(Math.hypot(r.state.player.x-e.x,r.state.player.z-e.z)).toBeCloseTo(2.2); expect(r.state.kills).toBe(0)
  type(r, e.words[0]!); expect(r.state.kills).toBe(1); expect(r.state.totalXp).toBe(25); expect(r.state.loot).toHaveLength(0)
  expect(runAccuracy(r.state)).toBeLessThan(100); expect(runWpm(r.state)).toBeGreaterThan(0)
 })
 it("preserves locked prefix under skill layer stripping, cooldown and insufficient mana", () => {
  const r = arena(), elite = r.spawn("minotaur", { x: 2, z: 0 })!; r.refreshQueue(); const word = elite.words[0]!
  r.input(word[0]!); r.input("Tab"); expect(r.state.phase).toBe("skills"); type(r, "CLEAVE")
  expect(r.state.phase).toBe("arena"); expect(elite.words).toHaveLength(2); expect(r.state.prefix).toBe(word[0]); expect(elite.words[0]).toBe(word)
  r.input("Tab"); type(r, "CLEAVE"); expect(r.state.notice).toContain("words"); expect(r.state.phase).toBe("skills")
  r.state.player.mana = 0; type(r, "STORM"); expect(r.state.notice).toContain("mana")
  r.input("Tab"); type(r, word.slice(1)); expect(r.state.skills.cleave.cooldown).toBe(2)
  r.input("Tab"); r.input("?"); expect(r.state.command).toBe(""); r.input("Backspace"); r.input("Tab"); r.input("Backspace"); expect(r.state.target).toBeNull()
 })
 it("requires the displayed capitals for skill and upgrade keywords", () => {
  for (const language of ["en", "id"] as const) {
   const r = new SurvivalRun("exact-case", language); r.start(); r.state.player.mana = 100
   const target = r.targets()[0]!, prefix = target.words[0]![0]!, keyword = skillRules.cleave[language]
   r.input(prefix); r.input("Tab"); type(r, keyword.toLowerCase())
   expect(r.state.phase).toBe("skills"); expect(r.state.command).toBe(""); expect(r.state.skills.cleave.cooldown).toBe(0); expect(r.state.player.mana).toBe(100); expect(r.state.notice).toContain("case")
   type(r, keyword[0]! + keyword.slice(1).toLowerCase()); expect(r.state.command).toBe("")
   type(r, keyword); expect(r.state.phase).toBe("arena"); expect(r.state.skills.cleave.cooldown).toBeGreaterThan(0); expect(r.state.prefix).toBe(prefix)
   r.state.phase = "draft"; r.state.pendingDrafts = 1; r.state.offers = ["magnet"]
   const upgrade = dungeonUpgrades.magnet[language], time = r.state.time
   type(r, upgrade.toLowerCase()); r.advance(1)
   expect(r.state.phase).toBe("draft"); expect(r.state.relics.magnet).toBe(0); expect(r.state.time).toBe(time)
   type(r, upgrade); expect(r.state.relics.magnet).toBe(1)
  }
 })
 it("never consumes a single partially typed layer with AoE", () => {
  const r = arena(), e = r.spawn("skeleton", { x: 1, z: 0 })!; r.refreshQueue(); r.input(e.words[0]![0]!); r.input("Tab"); r.cast("storm")
  expect(e.words).toHaveLength(1); expect(r.state.prefix).toHaveLength(1)
 })
 it("uses half world time for skills while the survival clock stays real", () => {
  const r = arena(); r.input("Tab"); tick(r, 2); expect(r.state.time).toBeCloseTo(2); expect(r.state.worldTime).toBeCloseTo(1)
  r.pause(); const saved = r.serialize(); tick(r, 2); expect(r.serialize()).toBe(saved); r.pause(); r.input("Escape"); expect(r.state.phase).toBe("skills"); r.input("Tab")
  r.input("Shift"); expect(r.state.correct).toBe(0); r.state.phase = "ready"; r.pause(); r.start(); r.start(); r.advance(NaN); r.advance(-1)
 })
 it("heals, evolves freeze and aegis, and limits skill use to skill mode", () => {
  const r = arena(); expect(r.cast("heal")).toBe(false); r.input("Tab"); expect(r.cast("heal")).toBe(false); expect(r.state.notice).toContain("full")
  r.state.player.hp = 1; r.state.skills.heal.level = 3; expect(r.cast("heal")).toBe(true); expect(r.state.player.hp).toBe(3); expect(r.state.player.invincible).toBe(4)
  const e = r.spawn("minotaur", { x: 4, z: 0 })!,shortened=e.words.slice(1).map(w=>w.slice(0,Math.ceil(w.length/2))); r.state.player.mana = 100; r.state.skills.storm.level = 3; r.input("Tab"); r.cast("storm"); expect(e.frozen).toBe(5); expect(e.words).toEqual(shortened); tick(r, .1); expect(e.frozen).toBeLessThan(5)
  r.state.player.mana = 100; r.state.skills.cleave.level = 3; r.input("Tab"); r.cast("cleave"); expect(r.state.enemies).not.toContain(e)
 })
 it("collects XP on dash, carries overflow and freezes for distinct typed upgrade choices", () => {
  const r = arena(); r.gainXp(500); tick(r, .1); expect(r.state.phase).toBe("draft"); expect(r.state.level).toBeGreaterThan(2); expect(new Set(r.state.offers).size).toBe(3)
  const time = r.state.time; tick(r, 3); expect(r.state.time).toBe(time); expect(r.chooseUpgrade("not-an-offer" as UpgradeId)).toBe(false)
  while (r.state.pendingDrafts) { const id = r.state.offers[0]!; type(r, dungeonUpgrades[id].en); }
  expect(r.state.phase).toBe("arena"); expect(r.state.xp).toBeLessThan(xpThreshold(r.state.level)); expect(xpThreshold(500)).toBe(100000)
 })
 it("triggers streak magnet only after 50 clean combat characters", () => {
  const r = arena(); r.state.loot.push({ id: 999, x: 20, z: 20, xp: 10, gold: 5, mana: 5 }); r.state.streak = 49
  const e = r.spawn("skeleton", { x: 4, z: 0 })!; r.refreshQueue(); r.input(e.words[0]![0]!); expect(r.state.loot).toHaveLength(0); expect(r.state.totalXp).toBe(10); expect(r.state.effects.some(e => e.kind === "magnet")).toBe(true)
  r.input("?"); expect(r.state.streak).toBe(0)
 })
 it("runs digit bombers, mage projectiles and environmental chain explosions", () => {
  const far=arena(),unlocked=far.spawn("bomber",{x:7,z:0})!;unlocked.attack=0;tick(far,.1);expect(far.state.player.hp).toBe(6);expect(far.state.enemies).not.toContain(unlocked)
  const r = arena(); const mage = r.spawn("mage", { x: 2, z: 0 })!; mage.attack = .01; tick(r, .1); expect(r.state.projectiles.length).toBeGreaterThan(0)
  r.state.player.invincible = 0; const hp = r.state.player.hp; tick(r, 1); expect(r.state.player.hp).toBeLessThanOrEqual(hp)
  const bomb = r.spawn("bomber", { x: r.state.player.x + 1, z: r.state.player.z })!; bomb.attack = .01; r.refreshQueue(); r.input(bomb.words[0]![0]!); tick(r, .1); expect(r.state.target).toBeNull(); expect(r.state.enemies).not.toContain(bomb)
  r.state.player.invincible = 100; r.state.enemies = []; defeat(r, "barrel"); defeat(r, "chest"); expect(r.state.gold).toBeGreaterThan(20)
  r.state.enemies = []; defeat(r, "bomber"); defeat(r, "mage"); expect(r.state.player.mana).toBeLessThanOrEqual(100)
 })
 it("does not step into a wall when an oversized movement step overshoots its corner waypoint",()=>{
  const r=arena();r.state.player={...r.state.player,x:32,z:26}
  const e=r.spawn("skeleton",{x:22,z:23})!;e.speed=10;e.waypoint={x:22.5,z:23.5}
  const before={x:e.x,z:e.z};(r as unknown as {moveEnemy:(enemy:typeof e,dt:number)=>void}).moveEnemy(e,.3)
  expect(dungeonWalkable(e)).toBe(true);expect(Number.isFinite(e.x)).toBe(true);expect(Math.hypot(e.x-before.x,e.z-before.z)).toBeLessThanOrEqual(e.speed*.3);expect(e.x).toBeCloseTo(22.5);expect(e.z).toBeCloseTo(23.5)
 })
 it("enforces finite pools and returns to endless after a recurring boss", () => {
  const r = arena(); r.state.time = 299.99; tick(r, .1); expect(r.state.boss).not.toBeNull()
  const boss = r.state.enemies.find(e => e.id === r.state.boss)!; expect(r.spawn("boss")).toBeUndefined()
  while (boss.words.length) { r.refreshQueue(); type(r, boss.words[0]!) }
  expect(r.state.phase).toBe("overdrive"); expect(r.state.stagger).toBe(3.2)
  r.input("?"); type(r, r.state.paragraph.slice(0,4)); expect(boss.health).toBeLessThan(boss.maxHealth)
  r.state.pendingDrafts=1;const cursor=r.state.cursor;let slammed=false;for(let i=0;i<303;i++){r.advance(1/30);slammed||=r.state.effects.some(e=>e.kind==="slam")}expect(r.state.phase).toBe("overdrive");expect(r.state.cursor).toBe(cursor);expect(r.state.offers).toHaveLength(0);expect(slammed).toBe(true)
  r.state.paragraph=r.state.paragraph.slice(r.state.cursor);r.state.cursor=0
  const first=r.state.paragraph;type(r,first);expect(r.state.phase).toBe("arena");expect(r.state.paragraph).toBe("");expect(boss.words).toHaveLength(3)
  while(boss.words.length){r.refreshQueue();type(r,boss.words[0]!)}
  boss.health=1;const final=r.state.paragraph
  type(r,final.slice(0,-1));expect(boss.health).toBe(1);expect(r.state.boss).toBe(boss.id);expect(r.state.phase).toBe("overdrive");expect(r.state.offers).toHaveLength(0)
  r.input(final.at(-1)!);expect(r.state.boss).toBeNull();expect(r.state.biome).toBe(1);expect(r.state.phase).toBe("draft")
  while (r.state.pendingDrafts) r.chooseUpgrade(r.state.offers[0]!); expect(r.state.phase).toBe("arena")
  r.state.time = 600; tick(r, .1); expect(r.state.boss).not.toBeNull()
 })
 it("bounds crowded scenes and merges rewards instead of losing overflow loot", () => {
  const r = arena(); for (let i = 0; i < B.enemies + 10; i++) r.spawn("skeleton", { x: 8, z: 8 }); expect(r.state.enemies).toHaveLength(B.enemies)
  r.setLabelLimit(4); expect(r.state.queue.length).toBeLessThanOrEqual(4); r.setLabelLimit(6)
  r.state.loot = Array.from({ length: B.loot }, (_, i) => ({ id: 1000 + i, x: 25, z: 25, xp: 1, gold: 0, mana: 0 }))
  r.state.enemies = []; defeat(r); expect(r.state.loot.length).toBeLessThanOrEqual(B.loot); expect(r.state.loot.reduce((n,e) => n + e.xp,0) + r.state.totalXp).toBe(B.loot + 25)
  r.state.enemies = []; const far = r.spawn("skeleton", { x: 100, z: 100 })!;far.waypoint={x:98,z:100}; tick(r, .1); expect(r.state.enemies).not.toContain(far)
 })
 it("applies letter, lexicon and speed relics and exhausts offers safely", () => {
  const r = arena(); for (const id of Object.keys(r.state.relics) as (keyof DungeonState["relics"])[]) r.state.relics[id] = dungeonUpgrades[id].max
  for (const id of Object.keys(skillRules) as SkillId[]) r.state.skills[id].level = 3
  r.state.time = 20; r.state.correct = 200; expect(runWpm(r.state)).toBeGreaterThan(100)
  const mage = r.spawn("mage", { x: 2, z: 0 })!; expect(mage.words[0]).not.toMatch(/[!_-]/)
  const elite = r.spawn("minotaur", { x: 2, z: 1 })!; expect(elite.words.at(-1)!.length).toBeLessThanOrEqual(3)
  r.state.enemies = []; const target = r.spawn("skeleton", { x: 2, z: 0 })!; r.state.correct = 209; r.refreshQueue(); type(r, target.words[0]!); expect(r.state.kills).toBe(1)
  r.gainXp(1000); tick(r, .1); expect(r.state.offers).toHaveLength(3); while(r.state.pendingDrafts) r.chooseUpgrade(r.state.offers[0]!)
  r.state.time = 901; const lateWords:string[]=[]; for(let i=0;i<50;i++){r.state.enemies=[];lateWords.push(r.spawn("skeleton")!.words[0]!)}; expect(lateWords.filter(word=>word.length>=8).length).toBeGreaterThan(15); expect(lateWords.every(word=>word.length>=3)).toBe(true)
 })
 it("ends on HP death, ignores repeat pause and preserves a saved paused run", () => {
  const r = arena(); r.damage(99); expect(r.state.phase).toBe("dead"); r.damage(1); r.pause(); r.input("a"); const before = r.serialize(); tick(r, 1); expect(r.serialize()).toBe(before)
  expect(restoreDungeonRun(r.serialize())?.state.phase).toBe("dead")
  const live = new SurvivalRun("saved", "id"); live.start(); const enemy = live.targets()[0]!; live.input(enemy.words[0]![0]!); live.input("Tab")
  const restored = restoreDungeonRun(live.serialize())!; expect(restored.state.phase).toBe("paused"); restored.resume(); expect(restored.state.phase).toBe("skills"); expect(restored.state.prefix).toBe(live.state.prefix)
  const loaded = restoreDungeonRun(new SurvivalRun("ready","en").serialize()); expect(loaded?.state.phase).toBe("ready")
 })
 it("rejects corrupt and incompatible checkpoints without mutating the original", () => {
  expect(restoreDungeonRun(null)).toBeNull(); expect(restoreDungeonRun("{" )).toBeNull(); expect(restoreDungeonRun("x".repeat(500001))).toBeNull()
  const original = new SurvivalRun("validation","en").serialize()
  const mutations: Array<(s: DungeonState) => void> = [
   s=>{s.version=2 as 1},s=>{s.language="xx" as "en"},s=>{s.seed="x".repeat(201)},s=>{s.phase="no" as "ready"},s=>{s.time=-1},s=>{s.player.hp=100},s=>{s.player.mana=-1},s=>{s.player.maxHp=101},
   s=>{s.enemies[0]!.words=[""]},s=>{s.enemies[0]!.kind="dragon" as EnemyKind},s=>{s.enemies.push(s.enemies[0]!)},s=>{s.loot=[{id:1,x:0,z:0,xp:-1,gold:0,mana:0}]},
   s=>{s.skills.cleave.level=4},s=>{s.skills.storm.cooldown=-1},s=>{s.relics.vowels=2},s=>{s.command="a".repeat(41)},s=>{s.cursor=2},s=>{s.offers=["unknown" as UpgradeId]},s=>{s.queue=[999]},s=>{s.labelLimit=7},
   s=>{s.phase="paused";s.resumePhase="invalid" as "arena"},s=>{s.afterDraft="dead"},s=>{s.target=999},s=>{s.prefix="bad"},s=>{s.boss=999},s=>{s.phase="overdrive"},s=>{s.phase="draft"},
  ]
  for(const mutate of mutations) { const s: DungeonState = JSON.parse(original); mutate(s); expect(restoreDungeonRun(JSON.stringify(s))).toBeNull() }
  expect(restoreDungeonRun(original)).not.toBeNull(); expect(createDungeonState("s","en").version).toBe(1)
 })
})
