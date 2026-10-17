import { expect, it } from "vitest"
import { SurvivalRun, restoreDungeonRun, runWpm, dungeonWalkable } from "./survival"
import { dungeonBalance as B, dungeonUpgrades, skillRules } from "../../content/src/dungeon"

for(const wpm of [20,50,90,130])it(`keeps a ${wpm} WPM seeded playthrough progressing with bounded pools`,()=>{
 const run=new SurvivalRun(`balance-${wpm}`),s=run.state;run.start()
 let inputAt=0,wall=0,maxEnemies=0,maxLoot=0
 while(wall<960&&s.phase!=="dead"){
  if(s.phase==="draft"){
   const offer=s.offers.find(id=>["heal","storm","cleave"].includes(id))??s.offers[0]!
   for(const key of dungeonUpgrades[offer][s.language])run.input(key)
   continue
  }
  run.advance(B.tick);wall+=B.tick
  maxEnemies=Math.max(maxEnemies,s.enemies.length);maxLoot=Math.max(maxLoot,s.loot.length)
  if(wall<inputAt)continue
  inputAt=wall+60/(wpm*5)
  if(s.phase==="arena"&&s.player.hp<=3&&!run.skillBlocked("heal"))run.input("Tab")
  if(s.phase==="skills"){
   const keyword=skillRules.heal[s.language];run.input(keyword[s.command.length]!)
  }else if(s.phase==="overdrive")run.input(s.paragraph[s.cursor]!)
  else{
   const target=s.enemies.find(e=>e.id===s.target)??run.targets()[0]
   if(target)run.input(target.words[0]![s.prefix.length]!)
  }
 }
 expect(maxEnemies).toBeLessThanOrEqual(B.enemies);expect(maxLoot).toBeLessThanOrEqual(B.loot)
 expect(s.kills).toBeGreaterThan(5);expect(s.time).toBeGreaterThan(30);expect(s.correct).toBeGreaterThan(50)
 expect(s.phase==="dead"||s.time>=959).toBe(true)
 expect(restoreDungeonRun(run.serialize())).not.toBeNull()
 console.info(JSON.stringify({wpm,survived:Math.round(s.time),level:s.level,kills:s.kills,biomes:s.biome,maxEnemies,maxLoot,measuredWpm:runWpm(s)}))
},20000)

it("never presents ambiguous first letters, including a late horde",()=>{
 const r=new SurvivalRun("initials","en");r.start();r.state.time=901
 for(let i=0;i<40;i++)r.spawn(i%2?"goblin":"skeleton",{x:2,z:2})
 r.refreshQueue();const words=r.targets().map(e=>e.words[0]!)
 expect(new Set(words.map(w=>w[0])).size).toBe(words.length)
 expect(words.length).toBeGreaterThanOrEqual(4)
})
it("routes pursuers around a solid ruin without entering the walls or getting stuck",()=>{
 const r=new SurvivalRun("path","en"),s=r.state;r.start();s.enemies=[];s.spawnAt=10000;s.nextBoss=10000;s.player.x=0;s.player.z=10;s.player.invincible=1000
 const enemy=r.spawn("skeleton",{x:15,z:10})!;enemy.speed=2
 for(let i=0;i<450;i++){r.advance(B.tick);expect(dungeonWalkable(enemy)).toBe(true)}
 expect(Math.hypot(enemy.x-s.player.x,enemy.z-s.player.z)).toBeLessThan(1)
 expect(restoreDungeonRun(r.serialize())).not.toBeNull()
})
