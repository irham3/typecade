import { expect, it } from "vitest"
import { coinBreakdown, coinTuning, coinsForRun, createHeroProfile, equip, payOutRun, PROFILE_VERSION, purchase, restoreHeroProfile } from "./economy"
import { cosmeticById, cosmetics, defaultLoadout, heroSlots, rarityPrice } from "../../content/src/cosmetics"

const run = (time: number, kills = 0, level = 1, gold = 0) => ({ time, kills, level, gold })

it("explains a run's coins line by line, pays nothing for quits and caps long runs", () => {
  expect(coinBreakdown(run(29, 99, 9, 999))).toEqual({ lines: [], total: 0, capped: false })
  const short = coinBreakdown(run(240, 80, 12, 300))
  expect(short.lines.map(line => line.source)).toEqual(["time", "kills", "level", "gold"])
  expect(short.total).toBe(short.lines.reduce((sum, line) => sum + line.amount, 0))
  expect(short.capped).toBe(false)
  expect(coinsForRun(run(240, 80, 12, 300))).toBe(short.total)
  const long = coinBreakdown(run(3600, 2000, 40, 9000))
  expect(long.capped).toBe(true)
  expect(long.total).toBe(coinTuning.maxPerRun)
})

it("pays each run seed once and adds the first-run bonus once per UTC day", () => {
  const fresh = createHeroProfile()
  const first = payOutRun(fresh, "seed-a", run(300, 60, 10, 200), "2026-10-17")
  expect(first.bonus).toBe(coinTuning.firstRunOfDay)
  expect(first.profile.coins).toBe(first.earned + first.bonus)
  expect(first.profile.bonusDay).toBe("2026-10-17")
  expect(payOutRun(first.profile, "seed-a", run(300), "2026-10-17")).toEqual({ profile: first.profile, earned: 0, bonus: 0 })
  const second = payOutRun(first.profile, "seed-b", run(300), "2026-10-17")
  expect(second.bonus).toBe(0)
  expect(second.profile.bonusDay).toBe("2026-10-17")
  const quit = payOutRun(fresh, "seed-c", run(5), "2026-10-18")
  expect(quit.earned + quit.bonus).toBe(0)
  let profile = fresh
  for (let i = 0; i < coinTuning.paidRunMemory + 5; i++) profile = payOutRun(profile, `seed-${i}`, run(60), "2026-10-19").profile
  expect(profile.paidRuns).toHaveLength(coinTuning.paidRunMemory)
})

it("sells unowned items for coins and equips only owned items into their own slot", () => {
  const rich = { ...createHeroProfile(), coins: 100_000 }
  expect(purchase(rich, "nope")).toEqual({ ok: false, reason: "unknown" })
  expect(purchase(rich, defaultLoadout.head)).toEqual({ ok: false, reason: "owned" })
  expect(purchase(createHeroProfile(), "head.crown")).toEqual({ ok: false, reason: "coins" })
  const bought = purchase(rich, "head.crown")
  expect(bought.ok).toBe(true)
  if (!bought.ok) return
  expect(bought.profile.coins).toBe(100_000 - rarityPrice.legendary)
  expect(equip(bought.profile, "head.crown").loadout.head).toBe("head.crown")
  expect(equip(rich, "head.crown")).toBe(rich)
  expect(equip(rich, "nope")).toBe(rich)
})

it("restores only valid saved profiles and falls back field by field", () => {
  const fresh = createHeroProfile()
  for (const raw of [null, "", "x".repeat(20_001), "{not json", JSON.stringify({ version: 0 }), "null"]) expect(restoreHeroProfile(raw)).toEqual(fresh)
  const saved = { version: PROFILE_VERSION, coins: 4200, owned: ["head.crown", "missing", 7], loadout: { ...defaultLoadout, head: "head.crown", body: "head.crown", face: "face.skull" }, paidRuns: ["a", 3, "x".repeat(201)], bonusDay: "2026-10-17" }
  const restored = restoreHeroProfile(JSON.stringify(saved))
  expect(restored.coins).toBe(4200)
  expect(restored.owned).toContain("head.crown")
  expect(restored.owned).not.toContain("missing")
  expect(restored.loadout.head).toBe("head.crown")
  expect(restored.loadout.body).toBe(defaultLoadout.body)
  expect(restored.loadout.face).toBe(defaultLoadout.face)
  expect(restored.paidRuns).toEqual(["a"])
  expect(restored.bonusDay).toBe("2026-10-17")
  const broken = restoreHeroProfile(JSON.stringify({ version: PROFILE_VERSION, coins: -5, owned: "all", paidRuns: "x", bonusDay: "today" }))
  expect(broken.coins).toBe(0)
  expect(broken.owned).toEqual(fresh.owned)
  expect(broken.loadout).toEqual(fresh.loadout)
  expect(broken.paidRuns).toEqual([])
  expect(broken.bonusDay).toBe("")
})

it("keeps the catalog consistent: every slot has free items and every default is a free item of its slot", () => {
  for (const { id } of heroSlots) {
    expect(cosmetics.some(entry => entry.slot === id && entry.price === 0)).toBe(true)
    expect(cosmeticById(defaultLoadout[id])).toMatchObject({ slot: id, price: 0 })
  }
  expect(cosmeticById("nope")).toBeUndefined()
  expect(new Set(cosmetics.map(entry => entry.id)).size).toBe(cosmetics.length)
})
