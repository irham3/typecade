import { describe, expect, it } from "vitest"
import { applyArenaWord, arenaMinimum, castArenaSkill, courseDistance, createArenaCombat, finishArenaDeadline, generateDungeonRoomText, leaveArena, tickArena } from "./arena"
import { createRacePlayer, defaultRaceConfig, parseRaceConfig } from "./index"
import type { SkillId } from "../../contracts/src/survival"
const players=()=>Array.from({length:4},(_,i)=>createRacePlayer(String(i),`Knight ${i}`,"classic"))
describe("authoritative dungeon room combat",()=>{
 it("seeds the course and gives obstacle words actual distance bonuses",()=>{
  const config={...defaultRaceConfig,mode:"sprint" as const,wordCount:50};expect(generateDungeonRoomText(config,"a")).toBe(generateDungeonRoomText(config,"a"));expect(generateDungeonRoomText(config,"a")).not.toBe(generateDungeonRoomText(config,"b"))
  expect(generateDungeonRoomText({...config,language:"id"},"a")).toContain("LOMPAT");expect(generateDungeonRoomText({...config,mode:"raid"},"a").split(" ")).toHaveLength(1000)
  const c=createArenaCombat("sprint",players(),0);applyArenaWord(c,"0","dash",1);applyArenaWord(c,"0","DODGE",2);applyArenaWord(c,"0","IGNITE",3);expect(c.players["0"]!.distance).toBe(28);expect(courseDistance("one two three")).toBe(15)
  expect(castArenaSkill(c,"0","cleave",1,4)).toBe("");expect(c.players["0"]!.distance).toBe(36);c.players["0"]!.cooldowns.storm=0;expect(castArenaSkill(c,"0","storm",2,5)).toBe("")
 })
 it("blocks attacks for five seconds, keeps roles and resolves a real PvP elimination",()=>{
  const c=createArenaCombat("clash",players().slice(0,2),0)
  applyArenaWord(c,"1","BLOCK",10);applyArenaWord(c,"0","strike",11);expect(c.players["1"]!.hp).toBe(100);expect(c.players["1"]!.shield).toBe(8)
  tickArena(c,6000,["0","1"]);expect(c.players["1"]!.shield).toBe(0)
  applyArenaWord(c,"0","CRUSH",6001);expect(c.players["1"]!.hp).toBe(80)
  for(let i=0;i<7;i++)applyArenaWord(c,"0","strike",6002+i)
  expect(c.ended).toBe(true);expect(c.winner).toBe("0");const old=c.players["0"]!.score;applyArenaWord(c,"0","strike",7000);expect(c.players["0"]!.score).toBe(old)
  expect(castArenaSkill(c,"0","storm",1,7000)).toContain("Invalid")
 })
 it("validates skill sequence, mana and word cooldown without trusting client damage",()=>{
  const c=createArenaCombat("clash",players(),0)
  expect(castArenaSkill(c,"missing","heal",1,0)).toContain("Invalid");expect(castArenaSkill(c,"0","invalid" as SkillId,1,0)).toContain("Invalid");expect(castArenaSkill(c,"0","heal",NaN,0)).toContain("Invalid")
  expect(castArenaSkill(c,"0","heal",1,0)).toBe("Health is full");expect(castArenaSkill(c,"0","heal",1,0)).toContain("Invalid")
  c.players["0"]!.mana=0;expect(castArenaSkill(c,"0","storm",2,1)).toContain("mana");c.players["0"]!.mana=100
  expect(castArenaSkill(c,"0","storm",3,2)).toBe("");expect(c.players["1"]!.hp).toBe(80);expect(castArenaSkill(c,"0","storm",4,3)).toContain("words")
  for(let i=0;i<5;i++)applyArenaWord(c,"0","BLOCK",4+i)
  expect(c.players["0"]!.cooldowns.storm).toBe(0);expect(castArenaSkill(c,"0","cleave",5,10)).toBe("");c.players["0"]!.hp=50;expect(castArenaSkill(c,"0","heal",6,11)).toBe("");expect(c.players["0"]!.hp).toBe(75)
 })
 it("executes genuine raid DPS, tank aggro, healing and three shared revives",()=>{
  const c=createArenaCombat("raid",players(),0);expect(c.players["2"]!.role).toBe("healer");expect(c.players["3"]!.role).toBe("tank")
  applyArenaWord(c,"0","strike",100);expect(c.bossHp).toBe(988);applyArenaWord(c,"3","strike",100);expect(c.bossHp).toBe(982);expect(c.players["3"]!.shield).toBe(8)
  tickArena(c,5000,c.order);expect(c.players["3"]!.hp).toBe(94);applyArenaWord(c,"2","heal",5001);expect(c.players["3"]!.hp).toBe(100)
  for(let i=0;i<3;i++){c.players["0"]!.hp=0;applyArenaWord(c,"2","heal",6000+i);expect(c.players["0"]!.hp).toBeGreaterThan(0)}
  expect(c.revives).toBe(0);c.players["0"]!.hp=0;applyArenaWord(c,"2","heal",7000);expect(c.players["0"]!.hp).toBe(0);applyArenaWord(c,"0","strike",7001)
  expect(castArenaSkill(c,"2","heal",1,7002)).toBe("");expect(castArenaSkill(c,"1","cleave",1,7003)).toBe("");expect(castArenaSkill(c,"1","storm",2,7004)).toBe("")
  c.bossHp=1;applyArenaWord(c,"1","strike",8000);expect(c.winner).toBe("team");tickArena(c,9000,c.order);finishArenaDeadline(c)
 })
 it("handles missing tanks, disconnected players, wipe, timeout and leaving",()=>{
  const c=createArenaCombat("raid",players(),0);tickArena(c,5000,["0"]);expect(c.players["0"]!.hp).toBe(86);tickArena(c,10000,[])
  for(const id of c.order)c.players[id]!.hp=0;tickArena(c,15000,c.order);expect(c.winner).toBe("boss")
  const timeout=createArenaCombat("raid",players(),0);finishArenaDeadline(timeout);expect(timeout.winner).toBe("boss")
  const victory=createArenaCombat("raid",players(),0);victory.bossHp=0;finishArenaDeadline(victory);expect(victory.winner).toBe("team")
  const duel=createArenaCombat("clash",players().slice(0,2),0);leaveArena(duel,"1");expect(duel.winner).toBe("0");leaveArena(duel,"0");expect(duel.winner).toBeNull()
 })
 it("resolves ties and validates configuration boundaries",()=>{
  const tied=createArenaCombat("clash",players(),0);finishArenaDeadline(tied);expect(tied.winner).toBeNull()
  const scored=createArenaCombat("clash",players(),0);scored.players["1"]!.score=5;finishArenaDeadline(scored);expect(scored.winner).toBe("1")
  const hp=createArenaCombat("clash",players(),0);hp.players["0"]!.hp=80;hp.players["1"]!.hp=90;hp.players["2"]!.hp=0;hp.players["3"]!.hp=0;finishArenaDeadline(hp);expect(hp.winner).toBe("1")
  expect(arenaMinimum("raid")).toBe(4);expect(arenaMinimum("sprint")).toBe(2)
  expect(()=>parseRaceConfig({...defaultRaceConfig,mode:"bad"})).toThrow();expect(()=>parseRaceConfig({...defaultRaceConfig,mode:"raid",maxPlayers:2})).toThrow();expect(()=>parseRaceConfig({...defaultRaceConfig,mode:"clash",variant:"perfect"})).toThrow()
 })
 it("bounds event history and respects an explicitly assigned role",()=>{
  const p=players();p[0]!.role="healer";const c=createArenaCombat("sprint",p,0);for(let i=0;i<40;i++)applyArenaWord(c,"0","run",i);expect(c.actions).toHaveLength(16);expect(c.players["0"]!.role).toBe("healer");applyArenaWord(c,"missing","a",100)
 })
 it("finishes an empty opponent set safely",()=>{const c=createArenaCombat("clash",players().slice(0,1),0);applyArenaWord(c,"0","strike",1);expect(c.winner).toBe("0")})
})
