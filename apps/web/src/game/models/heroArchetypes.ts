import { pair, type Part } from "./blueprint"

/** Movement personality a character animates with (see scene/heroStyles.ts). */
export type HeroStyleId = "warden" | "rogue" | "brute" | "duelist" | "mage"

/** Colours an archetype's signature parts may draw with; filled from the equipped dye. */
export interface ArchetypePalette { cloth: number; trim: number; metal: number; leather: number; skin: number; hair: number; ink: number; dark: (hex: number) => number }

/**
 * A playable character: body proportions, skin and hair, and parts that stay on whatever
 * outfit is equipped (a dwarf keeps his beard, an elf her ears). Outfit slots draw over it.
 */
export interface HeroArchetype {
  style: HeroStyleId
  /** Root scale [width, height, depth]: silhouette first, so each hero reads at a glance. */
  stature: readonly [number, number, number]
  skin: number
  hair: number
  /** Signature parts added to the body mesh. */
  signature: (p: ArchetypePalette) => Part[]
}

export const heroArchetypes: Record<string, HeroArchetype> = {
  "hero.warden": {
    style: "warden", stature: [1, 1, 1], skin: 0xd9a57e, hair: 0x4a2f20,
    // Tabard crest: the keep's lion square on the chest.
    signature: p => [[p.trim, 0, 1.3, .37, .2, .2, .02, "box", Math.PI / 4]],
  },
  "hero.rogue": {
    style: "rogue", stature: [.94, .95, .94], skin: 0xc8946e, hair: 0x231a16,
    signature: p => [
      // Face scarf over nose and mouth, tails blowing back.
      [0x2b2b33, 0, 1.86, .38, .8, .26, .06],
      [0x2b2b33, 0, 1.66, .04, .88, .16, .78],
      [0x2b2b33, .2, 1.7, -.44, .12, .36, .05, "box", -.5],
      // Short shoulder cloak and belt kit.
      [0x3a3a44, 0, 1.4, -.38, .96, .56, .08],
      ...pair([0x3a3a44, -.5, 1.52, -.05, .14, .4, .6]),
      ...pair([p.leather, -.36, .9, .26, .14, .16, .1]),
      [p.metal, .4, .8, .12, .05, .34, .05, "box", .5],
    ],
  },
  "hero.brute": {
    style: "brute", stature: [1.2, .84, 1.18], skin: 0xd99a7a, hair: 0xa04a24,
    signature: p => [
      [p.hair, 0, 1.74, .36, .7, .44, .12],
      ...pair([p.hair, -.18, 1.44, .38, .12, .3, .1]),
      ...pair([p.metal, -.18, 1.3, .38, .14, .06, .12]),
      [p.leather, 0, .98, .02, 1.04, .2, .74],
      [p.trim, 0, .98, .38, .26, .22, .04],
    ],
  },
  "hero.duelist": {
    style: "duelist", stature: [.9, 1.1, .9], skin: 0xf0c9a8, hair: 0xe8dcb0,
    signature: p => [
      ...pair([p.skin, -.52, 2.16, -.02, .14, .42, .16, "cone", 1.05]),
      [p.hair, 0, 1.84, -.38, .62, .76, .1],
      [p.trim, -.3, 1.12, .34, .14, .7, .03, "box", .55],
    ],
  },
  "hero.mage": {
    style: "mage", stature: [1, 1.03, 1], skin: 0xc79a7c, hair: 0xb8b8b8,
    signature: p => [
      // Floor-length robe over the legs, with a trimmed hem and a rope belt.
      [p.cloth, 0, .52, 0, 1.12, .84, 1.0, "cylinder"],
      [p.trim, 0, .14, 0, 1.16, .08, 1.04, "cylinder"],
      [p.trim, 0, .92, 0, 1.0, .06, .78],
      // High collar.
      [p.dark(p.cloth), 0, 1.7, -.12, .9, .3, .5],
      [p.hair, 0, 1.7, .36, .5, .36, .1],
      // Bound wisp over the left shoulder; glows through the vertex-glow path.
      [0xbca1ff, -.62, 2.42, -.1, .2, .2, .2, "round"],
      [0xd8a7ff, -.62, 2.42, -.1, .1, .1, .1, "round"],
    ],
  },
}

export const archetypeFor = (id: string): HeroArchetype => heroArchetypes[id] ?? heroArchetypes["hero.warden"]!
