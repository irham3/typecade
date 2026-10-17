import { expect, it } from "vitest"
import { cosmetics, defaultLoadout, heroSlots } from "@typecade/content"
import { heroBlueprint } from "./heroParts"
import { archetypeFor, heroArchetypes } from "./heroArchetypes"
import { heroStyles, styleFor } from "../scene/heroStyles"
import { heroIdlePose } from "../scene/HeroIdle"

it("builds a finite hero for every cosmetic in every slot, every hero and unknown ids", () => {
  for (const { id: slot } of heroSlots) for (const entry of cosmetics.filter(item => item.slot === slot)) {
    const blueprint = heroBlueprint({ ...defaultLoadout, [slot]: entry.id })
    for (const part of [...blueprint.body, ...blueprint.leg, ...blueprint.arm!, ...blueprint.weapon!]) expect(part.slice(1, 7).every(Number.isFinite)).toBe(true)
  }
  const unknown = heroBlueprint(Object.fromEntries(heroSlots.map(({ id }) => [id, "missing"])) as typeof defaultLoadout)
  expect(unknown.body.length).toBeGreaterThan(0)
  expect(archetypeFor("missing")).toBe(heroArchetypes["hero.warden"])
})

it("gives every character style a breathing idle and its own gestures, broader when relaxed", () => {
  expect(styleFor("missing" as never)).toBe(heroStyles.warden)
  for (const style of Object.values(heroStyles)) {
    for (let t = 0; t < style.idle.gestureEvery * style.gestures.length; t += .2) {
      const calm = heroIdlePose(t, false, style), relaxed = heroIdlePose(t, true, style)
      expect(Object.values(calm).every(Number.isFinite)).toBe(true)
      expect(Object.values(relaxed).every(Number.isFinite)).toBe(true)
    }
    for (const gesture of style.gestures) for (const t of [-1, 0, .5, 1, 2]) expect(Object.values(gesture(t)).every(Number.isFinite)).toBe(true)
  }
  expect(heroIdlePose(.3, false, { ...heroStyles.warden, gestures: [] }).bodyYaw).toBeCloseTo(Math.sin(.3 * .43) * heroStyles.warden.idle.look)
})
