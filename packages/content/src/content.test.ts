import { expect, it } from "vitest"
import { bossPassages, dungeonWords, dungeonUpgrades, skillRules } from "./index"
import { createSeededRng } from "../../game-rules/src/rng"

it("ships playable bilingual enemy, boss and unambiguous command packs", () => {
 for(const language of ["en","id"] as const){
  for(const words of Object.values(dungeonWords[language]))expect(words.every(word=>word.length>0&&word.length<=40&&!/\s/.test(word))).toBe(true)
  for(const paragraph of bossPassages[language])expect(paragraph).toContain("BLIZZARD")
  for(const pack of [skillRules,dungeonUpgrades]){
   const words=Object.values(pack).map(value=>value[language])
   expect(new Set(words).size).toBe(words.length)
   expect(words.every(word=>word===word.toUpperCase())).toBe(true)
  }
 }
})
it("reproduces random choices and rejects empty pools",()=>{
 const a=createSeededRng("room"),b=createSeededRng("room")
 for(let i=0;i<100;i++){expect(a.nextFloat()).toBe(b.nextFloat());expect(a.nextInt(2,4)).toBe(b.nextInt(2,4));expect(a.pick([1,2,3])).toBe(b.pick([1,2,3]))}
 expect(()=>a.pick([])).toThrow("Cannot pick from an empty list")
})
