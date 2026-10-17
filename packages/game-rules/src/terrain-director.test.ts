import { expect, it } from "vitest"
import { hasClearPath, isWalkable, ruinAt, ruinContains, ruinsInChunk, ruinsNear } from "./terrain"
import { buildPowerScore, paceFor, pressureFor, pressureTuning, surgeLineup, waveAt } from "./director"
import { spawnRoster } from "./roster"
import { SurvivalRun } from "./survival"
import { dungeonBalance as B, dungeonObjects } from "../../content/src/dungeon"

it("shares deterministic footprints and rejects segments crossing a ruin on either axis",()=>{
 const ruins=ruinsInChunk(0,0);expect(ruins).toEqual(ruinsInChunk(0,0));expect(ruins).toHaveLength(1)
 const wall=ruins[0]!;expect(ruinsNear(wall)).toEqual(ruins);expect(ruinAt(wall)).toEqual(wall);expect(ruinContains(wall,wall)).toBe(true)
 expect(isWalkable(wall)).toBe(false);expect(isWalkable({x:NaN,z:0})).toBe(false);expect(isWalkable({x:0,z:Infinity})).toBe(false)
 expect(ruinAt({x:0,z:0})).toBeUndefined()
 for(const [a,b] of [[{x:20,z:26},{x:32,z:26}],[{x:26,z:20},{x:26,z:32}],[{x:20,z:20},{x:32,z:32}],[{x:0,z:0},{x:40,z:0}]] as const)expect(hasClearPath(a,b)).toBe(false)
 expect(hasClearPath({x:0,z:0},{x:0,z:15})).toBe(true);expect(hasClearPath({x:0,z:0},{x:15,z:0})).toBe(true)
 expect(hasClearPath({x:32,z:0},{x:20,z:0})).toBe(true)
 const kinds=new Set<string>();for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++)for(const ruin of ruinsInChunk(x,z))kinds.add(ruin.archetype)
 expect(kinds.size).toBe(6)
})

it("paces build, surge and recovery deterministically, including elite unlocks and veteran rosters",()=>{
 for(const [time,phase] of [[0,"opening"],[45,"build"],[85,"surge"],[98,"breather"],[105,"build"]] as const){const wave=waveAt(time);expect(wave.phase).toBe(phase);expect(wave.progress).toBeGreaterThanOrEqual(0);expect(wave.progress).toBeLessThan(1);expect(paceFor(wave).spawnRate).toBeGreaterThan(0)}
 expect(surgeLineup(90,0,0,()=>0).elite).toBeNull();expect(surgeLineup(400,2,10,()=>.99).elite).toBe("troll")
 expect(surgeLineup(120,2,1,()=>0).elite).toBeNull()
 expect(spawnRoster(0,0,true)).not.toContain("deathknight");expect(spawnRoster(0,1,false)).toContain("deathknight")
 const r=new SurvivalRun("wave-cap"),s=r.state;r.start();s.enemies=[];s.queue=[];s.time=s.worldTime=84.99;s.spawnAt=0;s.nextBoss=10000;s.player.invincible=1000
 for(let i=0;i<9;i++)r.spawn("skeleton",{x:0,z:6})
 r.advance(.02);expect(s.notice).toContain("SURGE");expect(s.enemies.filter(e=>!dungeonObjects.includes(e.kind)).length).toBeLessThanOrEqual(B.openingThreats+6)
 s.enemies=[];s.queue=[];s.time=s.worldTime=204.99;r.advance(.02);expect(s.enemies.length).toBeGreaterThan(0)
})

it("scales pressure with the actual build and caps armor, speed and simultaneous threats deterministically",()=>{
 expect(buildPowerScore({level:1,weaponRanks:0,relicRanks:0,skillRanks:3})).toBe(0)
 const power=buildPowerScore({level:20,weaponRanks:20,relicRanks:20,skillRanks:9}),base=paceFor(waveAt(200)),pressure=pressureFor(base,power)
 expect(pressure.spawnRate).toBe(base.spawnRate*pressureTuning.maxSpawnRate)
 expect(pressure.haste).toBe(base.haste*pressureTuning.maxHaste)
 expect(pressure.extraArmorChance).toBe(pressureTuning.maxArmorChance)
 expect(pressure.threatBonus).toBe(base.threatBonus+pressureTuning.maxThreatBonus)
 expect(pressureFor(base,0)).toEqual({...base,extraArmorChance:0})
 const simulate=()=>{
  const r=new SurvivalRun("build-pressure"),s=r.state;r.start();s.level=20;s.time=s.worldTime=200;s.spawnAt=s.nextBoss=10000;s.player.invincible=10000
  r.advance(.1);s.enemies=[];s.queue=[]
  let armored=0;for(let i=0;i<80;i++){s.enemies=[];const enemy=r.spawn("skeleton",{x:2,z:0})!;if(enemy.words.length>1)armored++;expect(enemy.health).toBe(enemy.words.length)}
  expect(armored).toBeGreaterThan(10);expect(armored).toBeLessThan(60)
  const boss=r.spawn("boss",{x:4,z:0})!;expect(boss.words).toHaveLength(3)
  s.time=1801;const elite=r.spawn("minotaur",{x:2,z:0})!;expect(elite.words).toHaveLength(6)
  return r.serialize()
 }
 expect(simulate()).toBe(simulate())
})
