import { pair, type Part } from "./blueprint"

/** Movement personality a character animates with (see scene/heroStyles.ts). */
export type HeroStyleId = "warden" | "rogue" | "brute" | "duelist" | "mage" | "beast" | "dancer" | "ronin"

/** Colours an archetype's signature parts may draw with; filled from the equipped dye. */
export interface ArchetypePalette { cloth: number; trim: number; metal: number; leather: number; skin: number; hair: number; ink: number; dark: (hex: number) => number }

/**
 * A playable character: body proportions, skin and hair, the hair they wear with an open head
 * slot, and race features that stay on whatever outfit is equipped (an elf keeps her ears, an
 * orc his tusks). Outfit slots draw over it.
 */
export interface HeroArchetype {
  style: HeroStyleId
  /** Root scale [width, height, depth]: silhouette first, so each hero reads at a glance. */
  stature: readonly [number, number, number]
  skin: number
  hair: number
  /** Hairstyle; drawn only when the head slot leaves the hair visible (own hair or a circlet). */
  hairParts: (p: ArchetypePalette) => Part[]
  /** Race features and signature details added to the body mesh. */
  signature: (p: ArchetypePalette) => Part[]
}

/** Cap, fringe and short sides: the base most short cuts build on. */
const shortCut = (p: ArchetypePalette): Part[] => [[p.hair, 0, 2.36, -.04, .82, .16, .78], [p.hair, 0, 2.29, .33, .72, .1, .1], ...pair([p.hair, -.4, 2.14, -.04, .06, .3, .64])]
/** Long hair: cap, side curtains to the shoulders and a back fall. */
const longHair = (p: ArchetypePalette, length = .9): Part[] => [
  [p.hair, 0, 2.37, -.04, .84, .18, .8], [p.hair, 0, 2.28, .34, .76, .12, .1],
  ...pair([p.hair, -.42, 2.04 - length * .2, -.02, .08, .5 + length * .3, .7]),
  [p.hair, 0, 2.06 - length * .45, -.38, .8, .6 + length * .7, .14],
]
/** Pointed ears swept up and back (elves, dark elves). */
const elfEars = (skin: number): Part[] => pair([skin, -.46, 2.12, -.02, .1, .44, .16, "cone", 1.15])
/** A female face cue that survives any face item: a soft blush line. Kept subtle on purpose. */
const blush = (p: ArchetypePalette): Part[] => pair([p.skin === 0xd8d4f4 ? 0xc8b8f0 : 0xe89a9a, -.2, 1.93, .36, .12, .04, .02])

export const heroArchetypes: Record<string, HeroArchetype> = {
  // Aldric — human knight: square, broad, short brown hair, gold lion crest.
  "hero.warden": {
    style: "warden", stature: [1.04, 1, 1.02], skin: 0xd9a57e, hair: 0x5a3820,
    hairParts: shortCut,
    signature: p => [[p.trim, 0, 1.3, .38, .22, .22, .02, "box", Math.PI / 4], [0xffe066, 0, 1.3, .39, .1, .1, .02, "box", Math.PI / 4]],
  },
  // Kestrel — human cutpurse: lean, crouched, crimson face scarf whose tails stream behind.
  "hero.rogue": {
    style: "rogue", stature: [.92, .96, .92], skin: 0xc8946e, hair: 0x1c1614,
    hairParts: p => [[p.hair, 0, 2.38, -.02, .84, .14, .8], ...[-.24, 0, .24].map(x => [p.hair, x, 2.46, .1, .14, .16, .14, "cone", x * -1.2] as Part)],
    signature: p => [
      [p.trim, 0, 1.84, .38, .8, .26, .06], [p.trim, 0, 1.66, .04, .88, .16, .78],
      [p.trim, .2, 1.66, -.46, .12, .42, .05, "box", -.5], [p.trim, .34, 1.48, -.5, .1, .3, .04, "box", -.8],
      ...pair([p.leather, -.36, .9, .26, .14, .16, .1]), [p.metal, .4, .8, .12, .05, .34, .05, "box", .5],
    ],
  },
  // Lyra — elf duelist (female): tall and slim, platinum waist-length braid, swept ears.
  "hero.duelist": {
    style: "duelist", stature: [.88, 1.1, .88], skin: 0xf3cfb0, hair: 0xf2c84a,
    hairParts: p => [...longHair(p, .4), ...[0, 1, 2, 3, 4].map(i => [i % 2 ? p.dark(p.hair) : p.hair, 0, 1.66 - i * .2, -.48, .2 - i * .015, .2, .2, "round"] as Part), [p.trim, 0, .74, -.48, .14, .08, .14]],
    signature: p => [...elfEars(p.skin), ...blush(p), [0x7dff9a, 0, 2.3, .4, .08, .08, .03, "round"]],
  },
  // Brann — dwarf berserker: wide and short, enormous braided red beard.
  "hero.brute": {
    style: "brute", stature: [1.22, .84, 1.18], skin: 0xd99a7a, hair: 0xc0501c,
    hairParts: p => [[p.hair, 0, 2.38, -.06, .82, .14, .76], ...pair([p.hair, -.42, 2.1, -.08, .1, .4, .5])],
    signature: p => [
      [p.hair, 0, 1.72, .36, .74, .5, .14], ...pair([p.hair, -.18, 1.4, .38, .12, .34, .12]), ...pair([p.metal, -.18, 1.24, .38, .14, .07, .13]),
      [p.leather, 0, .98, .02, 1.04, .2, .74], [p.trim, 0, .98, .38, .26, .22, .04],
    ],
  },
  // Ragnar — northman: big and tall, ice-white hair braids and frost-blue war paint.
  "hero.frostborn": {
    style: "brute", stature: [1.12, 1.08, 1.08], skin: 0xe8c8b0, hair: 0xe4ecf2,
    hairParts: p => [...longHair(p, .6), ...pair([p.hair, -.3, 1.72, .2, .1, .4, .1])],
    signature: () => [...pair([0x4a8ad0, -.16, 2.16, .37, .06, .2, .02]), [0x4a8ad0, 0, 2.24, .37, .3, .04, .02]],
  },
  // Kenji — ronin: lean, black topknot, red headband with trailing ribbons.
  "hero.ronin": {
    style: "ronin", stature: [.96, 1.02, .96], skin: 0xe0b48c, hair: 0x121216,
    hairParts: p => [[p.hair, 0, 2.36, -.06, .8, .14, .74], [p.hair, 0, 2.5, -.12, .18, .22, .18, "round"], [p.hair, 0, 2.6, -.28, .1, .1, .3], ...pair([p.hair, -.4, 2.14, -.06, .06, .3, .6])],
    signature: p => [[p.trim, 0, 2.3, 0, .86, .07, .82], [p.trim, .1, 2.2, -.46, .08, .34, .03, "box", -.3], [p.trim, -.06, 2.16, -.46, .08, .3, .03, "box", .35]],
  },
  // Thorne — sylvan druid: bark skin, branching antlers, a beard of moss, leaf crown.
  "hero.sylvan": {
    style: "brute", stature: [1.06, 1.12, 1.04], skin: 0x8a6440, hair: 0x5a8a3a,
    hairParts: p => [[p.hair, 0, 2.38, -.04, .84, .14, .8], ...[-.3, -.1, .1, .3].map(x => [0x7ab84a, x, 2.42, .3, .16, .1, .06, "round"] as Part)],
    signature: p => [
      ...pair([0x6a4a2a, -.3, 2.6, -.02, .07, .5, .07, "box", .45]), ...pair([0x6a4a2a, -.52, 2.86, -.02, .06, .3, .06, "box", -.2]), ...pair([0x6a4a2a, -.3, 2.86, -.02, .05, .26, .05, "box", .9]),
      [p.hair, 0, 1.74, .36, .6, .36, .1], ...pair([p.hair, -.14, 1.5, .36, .1, .24, .08]),
      [0x7dff9a, .3, 1.34, .38, .08, .08, .03, "round"], [0x7dff9a, -.2, 1.0, .38, .07, .07, .03, "round"],
    ],
  },
  // Morwen — battle mage (female): silver flowing hair, floating wisp, she hovers.
  "hero.mage": {
    style: "mage", stature: [.96, 1.04, .96], skin: 0xe2b49a, hair: 0xd8d8e4,
    hairParts: p => longHair(p, 1),
    signature: p => [
      ...blush(p),
      [p.trim, 0, .92, 0, 1.0, .06, .78], [p.dark(p.cloth), 0, 1.7, -.12, .9, .3, .5],
      [0xbca1ff, -.66, 2.5, -.1, .2, .2, .2, "round"], [0xd8a7ff, -.66, 2.5, -.1, .1, .1, .1, "round"],
    ],
  },
  // Grukk — orc warchief: hulking, green hide, tusks, black mohawk, pointed ears.
  "hero.orc": {
    style: "beast", stature: [1.2, 1.12, 1.14], skin: 0x6f9a4a, hair: 0x141414,
    hairParts: p => [[p.hair, 0, 2.44, -.04, .16, .2, .82], [p.hair, 0, 2.3, -.42, .14, .4, .1]],
    signature: p => [
      ...pair([0xf0e6c8, -.2, 1.86, .36, .07, .24, .07, "cone", .15]),
      [p.dark(p.skin), 0, 1.8, .2, .78, .18, .5],
      ...pair([p.skin, -.44, 2.12, -.04, .12, .3, .14, "cone", 1.4]),
      ...pair([p.metal, -.46, 2.02, -.04, .04, .1, .1, "round"]),
    ],
  },
  // Kaela — pyromancer (female): living flame hair that rises upward, embers drifting round her.
  "hero.pyromancer": {
    style: "mage", stature: [.92, 1.04, .92], skin: 0xf0c4a0, hair: 0xff6b3d,
    hairParts: p => [...longHair(p, .5), ...[-.24, 0, .24].map(x => [0xffe066, x, 2.58, -.1, .18, .36, .18, "cone"] as Part), [0xff6b3d, 0, 2.76, -.2, .14, .3, .14, "cone"]],
    signature: p => [...blush(p), [0xffa040, .66, 2.2, .2, .12, .12, .12, "round"], [0xffe066, -.6, 1.8, .26, .09, .09, .09, "round"], [0xff6b3d, .5, 1.3, -.4, .1, .1, .1, "round"], [p.trim, 0, 1.02, .02, .98, .08, .72]],
  },
  // Saffi — dragonkin lancer (female): golden scales, swept horns, a long tail, crimson hair.
  "hero.dragonkin": {
    style: "duelist", stature: [.98, 1.08, .98], skin: 0xe0a040, hair: 0x9a1f2a,
    hairParts: p => longHair(p, .8),
    signature: p => [
      ...pair([0xf4e6c0, -.28, 2.48, -.2, .1, .44, .1, "cone", .9]), ...pair([0xf4e6c0, -.48, 2.62, -.42, .07, .3, .07, "cone", 1.6]),
      ...[0, 1, 2, 3].map(i => [i % 2 ? p.dark(p.skin) : p.skin, 0, .78 - i * .12, -.46 - i * .2, .26 - i * .05, .2 - i * .03, .3, "round"] as Part),
      [p.trim, 0, .38, -1.26, .12, .12, .2, "cone", Math.PI / 2],
      ...blush(p),
    ],
  },
  // Mira — avian skydancer (female): teal feather crest and wide layered wings.
  "hero.avian": {
    style: "dancer", stature: [.9, 1.0, .9], skin: 0xf2d0b4, hair: 0x2ab0b8,
    hairParts: p => [[p.hair, 0, 2.36, -.04, .84, .16, .8], ...[-.2, 0, .2].map((x, i) => [i === 1 ? 0xffe066 : p.hair, x, 2.6 - Math.abs(x) * .4, -.2, .12, .5, .1, "cone", -x * 1.5] as Part), ...pair([p.hair, -.42, 1.96, -.06, .08, .6, .6])],
    signature: p => [
      ...blush(p), ...pair([0xffcf4a, -.26, 2.06, .37, .14, .03, .02]),
      ...pair([0xf4f4f0, -.7, 1.62, -.42, .9, .5, .06, "box", -.45]), ...pair([p.hair, -.92, 1.32, -.44, .8, .36, .05, "box", -.65]), ...pair([p.dark(p.hair), -1.04, 1.06, -.46, .6, .24, .05, "box", -.85]),
    ],
  },
  // Selene — lunarian priestess (female): pale moon skin, crescent mark and halo, starry motes.
  "hero.lunarian": {
    style: "dancer", stature: [.9, 1.08, .9], skin: 0xd8d4f4, hair: 0xf0f4ff,
    hairParts: p => [...longHair(p, 1.1), [0x9ff5fa, .3, 2.06, -.4, .08, 1.2, .14]],
    signature: p => [
      [0x9ff5fa, 0, 2.26, .37, .14, .06, .02], [0x9ff5fa, .05, 2.3, .37, .06, .06, .02],
      ...[-1.1, -.6, 0, .6, 1.1].map(a => [0xb7f0ff, Math.sin(a) * .62, 2.2 + Math.cos(a) * .62, -.5, .14, .14, .04, "box", -a] as Part),
      [0xa9e9ff, .7, 1.6, .1, .08, .08, .08, "round"], [0xa9e9ff, -.62, 1.2, -.2, .06, .06, .06, "round"],
      ...blush(p),
    ],
  },
  // Vesper — dark elf assassin (female): dusk-violet skin, high white ponytail, swept ears.
  "hero.darkelf": {
    style: "rogue", stature: [.88, 1.06, .88], skin: 0x7a6a9a, hair: 0xf4f0f8,
    hairParts: p => [[p.hair, 0, 2.37, -.04, .84, .16, .8], [p.hair, 0, 2.28, .34, .76, .1, .1], [p.hair, 0, 2.5, -.3, .2, .16, .2, "round"], [p.hair, 0, 2.1, -.5, .2, .8, .16], [p.hair, 0, 1.62, -.56, .14, .4, .12, "cone", Math.PI]],
    signature: p => [...elfEars(p.skin), [0xff4a5a, -.24, 2.0, .37, .04, .2, .02, "box", .3], [p.trim, 0, .84, .36, .8, .06, .04]],
  },
  // Rhaz — leonin champion: huge mane, lion ears and muzzle, a tufted tail.
  "hero.leonin": {
    style: "beast", stature: [1.14, 1.1, 1.1], skin: 0xd09a48, hair: 0x9a4a1a,
    hairParts: () => [],
    signature: p => [
      [p.hair, 0, 2.06, -.14, 1.16, 1.0, .5], [p.hair, 0, 1.66, -.04, 1.0, .4, .7], [p.dark(p.hair), 0, 2.5, -.1, .7, .2, .5],
      ...pair([p.skin, -.34, 2.46, .02, .16, .2, .1, "cone", .4]),
      [0xf0d8b0, 0, 1.88, .4, .38, .24, .14], [0x2a1a14, 0, 1.98, .48, .12, .08, .05],
      ...[0, 1, 2].map(i => [p.skin, 0, .7 - i * .14, -.44 - i * .22, .14, .14, .26] as Part), [p.hair, 0, .3, -1.08, .24, .24, .24, "round"],
    ],
  },
}

/** Head items that leave the hero's own hair showing. */
export const openHeads: ReadonlySet<string> = new Set(["head.none", "head.circlet"])

export const archetypeFor = (id: string): HeroArchetype => heroArchetypes[id] ?? heroArchetypes["hero.warden"]!
