import { expect, it, vi } from "vitest"
import { SurvivalRun, restoreDungeonRun } from "./survival"
import { areWeaponsValid, createEmptyWeapons, isWeaponId, orbitBladePositions, tickWeapons, weaponIds } from "./weapons"
import { dungeonBalance as B, dungeonUpgrades, weaponRules } from "../../content/src/dungeon"

it("bounds weapon saves, migrates old runs and protects the boss and locked final word", () => {
 const r = new SurvivalRun("weapon-save"), s = r.state
 expect(isWeaponId("orbit")).toBe(true); expect(isWeaponId("bad")).toBe(false)
 expect(areWeaponsValid(null)).toBe(false); expect(areWeaponsValid(0)).toBe(false)
 for (const value of [undefined, {level: .5, timer: 0}, {level: -1, timer: 0}, {level: 6, timer: 0}, {level: 1, timer: "0"}, {level: 1, timer: NaN}, {level: 1, timer: 61}]) {
  expect(areWeaponsValid({...s.weapons, orbit: value})).toBe(false)
 }
 const raw = JSON.parse(r.serialize()); delete raw.weapons; delete raw.orbitHits
 expect(restoreDungeonRun(JSON.stringify(raw))?.state.weapons).toEqual(createEmptyWeapons())
 for (const hits of [null, 1, {"1": "bad"}]) expect(restoreDungeonRun(JSON.stringify({...raw, orbitHits: hits}))).toBeNull()
 expect(restoreDungeonRun(JSON.stringify({...raw, weapons: {}}))).toBeNull()
 expect(restoreDungeonRun(r.serialize().replace('"orbitHits":{}','"orbitHits":{"1":1e400}'))).toBeNull()
 r.start(); s.enemies=[];s.queue=[];s.spawnAt=1000;s.nextBoss=1000;s.player.invincible=1000
 const locked = r.spawn("skeleton", {x:1,z:0})!, boss = r.spawn("boss", {x:2,z:0})!
 locked.words=["abc"];r.refreshQueue();r.input("a")
 for (const id of weaponIds) s.weapons[id].level=5
 const armor=[...boss.words];r.advance(.1)
 expect(locked.words).toEqual(["abc"]);expect(s.prefix).toBe("a");expect(boss.words).toEqual(armor)
})

it("applies every weapon rank, contact cooldown, range, freeze and barrel splash through the combat port", () => {
 const r=new SurvivalRun("weapon-ranks"),s=r.state
 s.enemies=[];s.boss=null
 const near=r.spawn("guard",{x:1,z:0})!,far=r.spawn("skeleton",{x:20,z:0})!,barrel=r.spawn("barrel",{x:1,z:1})!,boss=r.spawn("boss",{x:2,z:0})!
 const hit=vi.fn(),effect=vi.fn(),port={state:s,hit,effect,random:()=>0}
 expect(orbitBladePositions(s)).toEqual([])
 const legacy={...s,weapons:undefined!};expect(orbitBladePositions(legacy)).toEqual([])
 for(let rank=1;rank<=5;rank++){
  for(const id of weaponIds)s.weapons[id]={level:rank,timer:0}
  const positions=orbitBladePositions(s);expect(positions).toHaveLength(weaponRules.orbit.count[rank-1]!)
  near.x=positions[0]!.x;near.z=positions[0]!.z;barrel.x=near.x;barrel.z=near.z
  hit.mockClear();tickWeapons(port,.01)
  expect(hit.mock.calls.some(call=>call[0]===near&&call[3]==="orbit")).toBe(true)
  expect(hit.mock.calls.some(call=>call[0]===barrel&&call[3]==="meteor")).toBe(true)
  expect(hit.mock.calls.some(call=>call[0]===far||call[0]===boss)).toBe(false)
  expect(near.frozen).toBeGreaterThanOrEqual(1.25)
  const orbitCount=hit.mock.calls.filter(call=>call[3]==="orbit").length
  tickWeapons(port,.01);expect(hit.mock.calls.filter(call=>call[3]==="orbit")).toHaveLength(orbitCount)
  s.worldTime+=5;near.x=50;s.orbitHits[999]=0;tickWeapons(port,5);expect(s.orbitHits[999]).toBeUndefined()
 }
 expect(effect.mock.calls.some(call=>call[0]==="nova")).toBe(true)
 s.enemies=[];tickWeapons(port,50)
 for(const id of weaponIds)s.weapons[id].level=0
 tickWeapons(port,1)
})

it("upgrades weapon ranks through real drafts and bounds veteran arrow fans",()=>{
 const r=new SurvivalRun("weapon-draft"),s=r.state;r.start();s.enemies=[];s.queue=[];s.spawnAt=1000;s.nextBoss=1000
 for(const [i,id] of weaponIds.entries()){s.weapons[id].timer=i?4:0;s.phase="draft";s.offers=[id];s.pendingDrafts=1;expect(r.chooseUpgrade(id)).toBe(true);expect(r.upgradeLevel(id)).toBe(1);expect(s.weapons[id].timer).toBe(1)}
 s.phase="arena";s.time=200;const archer=r.spawn("archer",{x:5,z:0})!;archer.attack=0;archer.speed=.1
 s.projectiles=Array.from({length:63},()=>({id:s.nextId++,x:0,z:10,vx:0,vz:0,life:10}))
 ;(r as unknown as {steerEnemy:(e:typeof archer,dt:number)=>void}).steerEnemy(archer,.01)
 expect(s.projectiles).toHaveLength(64)
})

it("holds necromancer summons at the threat cap and when there is no clear landing",()=>{
 const r=new SurvivalRun("summon-cap"),s=r.state;r.start();s.enemies=[];s.queue=[]
 const necro=r.spawn("necromancer",{x:3,z:0})!;necro.attack=0
 const a=r as unknown as {ability:(e:typeof necro,dt:number)=>void;strikePosition:(e:typeof necro,range:number)=>{x:number;z:number}}
 for(let i=0;i<B.preBossThreats;i++)r.spawn("skeleton",{x:0,z:3})
 a.ability(necro,.1);expect(s.effects.some(e=>e.kind==="summon")).toBe(false)
 s.enemies=[necro];necro.attack=0;const original=a.strikePosition;a.strikePosition=e=>({x:e.x,z:e.z})
 a.ability(necro,.1);expect(s.enemies).toHaveLength(1);a.strikePosition=original
})


it("keeps close wraiths in place and refuses a blink through a ruin",()=>{
 const r=new SurvivalRun("wraith-block"),s=r.state;s.enemies=[]
 const wraith=r.spawn("wraith",{x:1,z:0})!
 const a=r as unknown as {ability:(e:typeof wraith,dt:number)=>void}
 wraith.attack=0;a.ability(wraith,.1);expect(wraith.x).toBe(1);expect(s.effects.some(e=>e.kind==="blink")).toBe(false)
 s.player.x=24;s.player.z=26;wraith.x=30;wraith.z=26;wraith.attack=0
 a.ability(wraith,.1);expect(wraith.x).toBe(30);expect(s.effects.some(e=>e.kind==="blink")).toBe(false)
})


it("offers unique restorative skills after every weapon and relic reaches its cap",()=>{
 const r=new SurvivalRun("exhausted-build"),s=r.state;r.start();s.enemies=[];s.queue=[];s.spawnAt=s.nextBoss=1000;s.player.invincible=1000
 for(const id of weaponIds)s.weapons[id].level=5
 for(const id of Object.keys(s.relics) as (keyof typeof s.relics)[])s.relics[id]=dungeonUpgrades[id].max
 s.skills.cleave.level=2;s.skills.storm.level=s.skills.heal.level=3
 r.gainXp(125);r.advance(.01);expect(s.offers).toEqual(["cleave","storm","heal"])
 expect(r.chooseUpgrade("cleave")).toBe(true);expect(s.skills.cleave.level).toBe(3)
 r.gainXp(1000);r.advance(.01);expect(s.offers).toEqual(["cleave","storm","heal"])
})
