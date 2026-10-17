import { expect, it } from "vitest"
import type { DungeonState } from "../../contracts/src/survival"
import { talentTree } from "../../content/src/talents"
import { dungeonBalance as B, skillRules } from "../../content/src/dungeon"
import { areRunTalentsValid, buyTalent, createTalentProfile, emberBreakdown, emberTuning, payOutEmbers, resetTalents, restoreTalentProfile, runTalentsFor, spentEmbers, talentStatus } from "./talents"
import { SurvivalRun, restoreDungeonRun } from "./survival"

const run = (time: number, kills = 0, words = 0, biome = 0) => ({ time, kills, words, biome, talents: runTalentsFor({}) })

it("pays nothing for quits, rewards depth most and pays each seed once", () => {
  expect(emberBreakdown(run(29, 99, 99, 3)).total).toBe(0)
  const first = emberBreakdown(run(150, 40, 60)).total
  expect(first).toBeGreaterThanOrEqual(talentTree[0]!.costs[0]!)
  expect(emberBreakdown(run(600, 200, 300, 1)).total).toBeGreaterThan(first * 3)
  const paid = payOutEmbers(createTalentProfile(), "seed", run(150, 40, 60))
  expect(paid.profile.embers).toBe(paid.earned)
  expect(payOutEmbers(paid.profile, "seed", run(150, 40, 60))).toEqual({ profile: paid.profile, earned: 0 })
  expect(emberBreakdown(run(600, 200, 300, 1), 2).total).toBeGreaterThan(emberBreakdown(run(600, 200, 300, 1)).total)
  expect(emberBreakdown(run(1e9, 1e9, 1e9, 1e6)).total).toBe(emberTuning.maxPerRun)
})

it("enforces prerequisites, costs and max ranks, and refunds everything", () => {
  let profile = { ...createTalentProfile(), embers: 1000 }
  expect(buyTalent(profile, "vigor")).toEqual({ ok: false, reason: "locked" })
  expect(buyTalent(profile, "nope")).toEqual({ ok: false, reason: "unknown" })
  const root = buyTalent(profile, "heart"); if (!root.ok) throw new Error("root")
  profile = root.profile
  expect(profile.embers).toBe(995)
  expect(buyTalent(profile, "heart")).toEqual({ ok: false, reason: "maxed" })
  expect(talentStatus(profile, "vigor")).toBe("available")
  expect(talentStatus({ ...profile, embers: 0 }, "vigor")).toBe("poor")
  const vigor = buyTalent(profile, "vigor"); if (!vigor.ok) throw new Error("vigor")
  expect(spentEmbers(vigor.profile)).toBe(25)
  expect(resetTalents(vigor.profile)).toMatchObject({ embers: 1000, ranks: {} })
})

it("restores only valid, connected ranks from untrusted saves", () => {
  expect(restoreTalentProfile("{")).toEqual(createTalentProfile())
  const forged = restoreTalentProfile(JSON.stringify({ version: 1, embers: 50, lifetime: 80, ranks: { vigor: 2, heart: 1, laststand: 1, focus: 9, bogus: 1 }, paidRuns: ["a", 4] }))
  expect(forged.ranks).toEqual({ heart: 1, vigor: 2, focus: 3 })
  expect(forged.paidRuns).toEqual(["a"])
})

it("applies run bonuses at the start and keeps them through save and restore", () => {
  const ranks = { heart: 1, vigor: 2, guard: 2, laststand: 1, armory: 1, veteran: 1, focus: 1, reach: 1, wellspring: 1, arcana: 2, composure: 1, mending: 1, bounty: 1 }
  const r = new SurvivalRun("talent", "en", undefined, runTalentsFor(ranks))
  expect(r.state.player.maxHp).toBe(B.hp + 3)
  expect(r.state.player.hp).toBe(B.hp + 3)
  expect(r.state.player.shield).toBe(2)
  expect(r.state.weapons.orbit.level).toBe(1)
  expect(r.state.pendingDrafts).toBe(1)
  expect(r.skillRecharge("cleave")).toBe(skillRules.cleave.words - 2)
  const restored = restoreDungeonRun(r.serialize())!
  expect(restored.state.talents).toEqual(r.state.talents)
  // A forged heart count beyond the carried ranks is rejected.
  expect(restoreDungeonRun(JSON.stringify({ ...r.state, player: { ...r.state.player, maxHp: B.hp + 9 } }))).toBeNull()
  expect(restoreDungeonRun(JSON.stringify({ ...r.state, talents: { ranks: { vigor: 7 }, lastStand: 0 } }))).toBeNull()
  // Older saves without talents restore with none.
  const legacy: Partial<DungeonState> = { ...new SurvivalRun("legacy", "en").state }
  delete legacy.talents
  expect(restoreDungeonRun(JSON.stringify(legacy))!.state.talents).toEqual({ ranks: {}, lastStand: 0 })
  expect(areRunTalentsValid({ ranks: {}, lastStand: 1 })).toBe(false)
})

it("Last Stand saves exactly one killing blow and Composure halves the streak", () => {
  const r = new SurvivalRun("stand", "en", undefined, runTalentsFor({ heart: 1, vigor: 1, guard: 1, mending: 1, laststand: 1, focus: 1, composure: 1 }))
  r.start()
  const s = r.state
  s.player.shield = 0; s.player.invincible = 0
  r.damage(s.player.hp)
  expect(s.phase).toBe("arena")
  expect(s.player.hp).toBe(1)
  expect(s.talents.lastStand).toBe(0)
  s.player.invincible = 0
  r.damage(1)
  expect(s.phase).toBe("dead")
  const t = new SurvivalRun("calm", "en", undefined, runTalentsFor({ heart: 1, focus: 1, composure: 1 }))
  t.start(); t.state.streak = 10; t.state.bestStreak = 10; t.state.correct = 10
  t.input("#")
  expect(t.state.streak).toBe(5)
})
