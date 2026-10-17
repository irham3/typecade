import type { EnemyKind } from "@typecade/contracts"
import type { SampleGroup } from "./assetManifest"
import type { SamplePlay } from "./SampleBank"

export type SampleLayer = SamplePlay & { group: SampleGroup }

/**
 * Recorded layers added on top of the synthesized cue for the same event. Recordings carry the
 * physical texture (steel, wood, bone, cloth); synthesis carries pitch, magic and tails.
 */
export const eventSamples: Record<string, SampleLayer[]> = {
  slash: [{ group: "slice", gain: .9 }],
  cleave: [{ group: "slice", gain: 1 }, { group: "metalHeavy", gain: .5, delay: .03 }],
  thrust: [{ group: "draw", gain: .9 }],
  uppercut: [{ group: "slice", gain: .9, rate: 1.1 }],
  twin: [{ group: "slice", gain: .8 }, { group: "slice", gain: .7, delay: .09, rate: 1.12 }],
  leap: [{ group: "cloth", gain: .8 }, { group: "plateHeavy", gain: .8, delay: .26 }],
  whirl: [{ group: "cloth", gain: .9 }, { group: "slice", gain: .7, delay: .12 }],
  finisher: [{ group: "metalHeavy", gain: 1 }, { group: "bell", gain: .6, delay: .05, rate: .8 }],
  dust: [{ group: "cloth", gain: .5 }],
  shatter: [{ group: "plate", gain: .55 }],
  block: [{ group: "metalLight", gain: .8 }],
  hurt: [{ group: "punch", gain: 1 }],
  hit: [{ group: "punch", gain: .6 }],
  explosion: [{ group: "wood", gain: 1 }, { group: "stone", gain: .6, delay: .04 }],
  meteor: [{ group: "stone", gain: .9, delay: .28 }],
  frost: [{ group: "glass", gain: .7 }],
  pickup: [{ group: "coins", gain: .45 }],
  chest: [{ group: "creak", gain: .8 }, { group: "coins", gain: .7, delay: .15 }],
  level: [{ group: "bell", gain: .5, rate: 1.2 }],
  upgrade: [{ group: "page", gain: .7 }],
  shield: [{ group: "metalLight", gain: .6 }],
  boss: [{ group: "bell", gain: .9, rate: .7 }],
  ui: [{ group: "latch", gain: .5 }],
}

/** What each foe's body sounds like when it breaks; layered under its death cry. */
const bodyMaterial: Partial<Record<EnemyKind, SampleGroup>> = {
  skeleton: "bone", archer: "bone", necromancer: "bone", ghoul: "punch", goblin: "punch", rat: "soft", bat: "soft",
  slime: "soft", sporeling: "soft", spider: "bone", wolf: "punch", guard: "plateHeavy", deathknight: "plateHeavy",
  beetle: "plate", golem: "stone", gargoyle: "stone", troll: "punch", minotaur: "metalHeavy", boss: "metalHeavy",
  mimic: "wood", barrel: "wood", chest: "wood", imp: "soft", mage: "glass", wisp: "glass", wraith: "glass",
  shaman: "wood", serpent: "soft", assassin: "metalLight", bomber: "wood",
}

export function deathSample(kind: EnemyKind): SampleLayer | null {
  const group = bodyMaterial[kind]
  return group ? { group, gain: .85 } : null
}
