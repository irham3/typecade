import { describe, expect, it } from "vitest"
import { getFishingChallenge, createShallowCoastExpedition, getFishByEncounter, advanceExpedition, resolveCatchResult, startEncounter, createInitialCollection, grantCatchResult, serializeOceanSave, restoreOceanSave } from "./index"
import { fishSpecies } from "@typecade/content"
const metrics={wpm:50,rawWpm:50,accuracy:100,combo:1,maxCombo:1,consistency:100,correctKeystrokes:5,incorrectKeystrokes:0,progress:1,elapsedMs:3000}
describe("selectable fishing challenges",()=>{
 it("offers same-zone species, keeps deterministic words and scales their rewards",()=>{
  const expedition=createShallowCoastExpedition("shoal");const original=getFishingChallenge(expedition)
  for(const species of fishSpecies.filter(f=>f.habitat==="zone_1")) {
   const word=getFishingChallenge(expedition,"word",species.id);expect(word.fish.id).toBe(species.id);expect(word.text.split(/\s+/)).toHaveLength(1);expect(word).toEqual(getFishingChallenge(expedition,"word",species.id));expect(word.fish.reward.xp).toBeLessThan(original.fish.reward.xp);expect(word.fish.baseTimeMs).toBeGreaterThanOrEqual(8000)
   const sentence=getFishingChallenge(expedition,"sentence",species.id);expect(sentence.text.split(/\s+/).length).toBeGreaterThan(1)
  }
  expect(getFishByEncounter(expedition,"reef_shark").id).toBe(original.fish.id);expect(getFishByEncounter(expedition,"missing").id).toBe(original.fish.id)
 })
 it("preserves boss guard, endless refit, leveling rewards and save restoration",()=>{
  let expedition={...createShallowCoastExpedition("shoal"),currentZoneIndex:2,currentEncounterIndex:3}
  const challenge=getFishingChallenge(expedition,"word","reef_shark");expect(challenge.fish.rarity).toBe("boss");expect(challenge.text.split(/\s+/).length).toBeGreaterThan(3)
  const encounter={...startEncounter(challenge.fish,"boss",[]),status:"caught" as const,progress:1};const result=resolveCatchResult(encounter,challenge.fish,metrics)
  const collection=grantCatchResult(createInitialCollection(),result);expect(collection.xp).toBeGreaterThan(0)
  expedition=advanceExpedition(expedition,result);expect(expedition.voyage).toBe(2);expect(expedition.complete).toBe(false);expect(restoreOceanSave(serializeOceanSave(expedition,collection))!.collection.xp).toBe(collection.xp)
  const later=getFishingChallenge({...expedition,voyage:6},"passage");expect(later.fish.idlePressurePerSecond).toBeGreaterThan(getFishingChallenge({...expedition,voyage:1},"passage").fish.idlePressurePerSecond)
 })
})
