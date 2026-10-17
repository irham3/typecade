import type { EnemyKind } from "@typecade/contracts"
import { pair, palette, type ActorBlueprint, type Part } from "./blueprint"

const { ink, bone, leather, steel, gold } = palette

/** Tusked orc jailer: hunched green-grey brute with a round spiked shield. Deliberately unlike the hero knight. */
function orcWarden(): ActorBlueprint {
  const skin = 0x6f8a5c, darkSkin = 0x56704a, iron = 0x5d6670, rust = 0x9a5a34
  return {
    body: [
      [leather, 0, 1.0, 0, 1.15, .78, .82],
      [skin, 0, 1.38, .05, 1.05, .72, .78],
      [rust, 0, 1.06, .42, .9, .28, .08],
      [iron, 0, .82, 0, 1.2, .2, .86],
      [skin, 0, 1.95, .32, .74, .62, .62],
      [darkSkin, 0, 2.22, .26, .78, .18, .6],
      ...pair([0xff6b3d, -.17, 2.0, .64, .12, .07, .03]),
      ...pair([bone, -.2, 1.74, .66, .07, .2, .07, "cone"]),
      ...pair([skin, -.44, 2.0, .3, .3, .14, .16, "cone", 1.2]),
      ...pair([iron, -.66, 1.72, 0, .5, .3, .6]),
      ...pair([steel, -.78, 1.95, 0, .1, .32, .1, "cone", .5]),
      ...pair([steel, -.62, 1.98, .2, .08, .26, .08, "cone", .3]),
      [0x3a2b22, 0, 1.3, -.5, .9, 1.0, .14],
    ],
    leg: [[darkSkin, 0, -.28, 0, .36, .58, .4], [iron, 0, -.6, .12, .44, .2, .55]],
    arm: [
      [skin, 0, -.22, 0, .36, .6, .4],
      [iron, 0, -.5, .36, .56, .56, .07, "round"],
      [0x7a5232, 0, -.5, .4, .5, .5, .07, "round"],
      [steel, 0, -.5, .47, .14, .14, .1, "round"],
      ...pair([steel, -.3, -.5, .44, .06, .14, .06, "cone", .9]),
    ],
    weapon: [
      [skin, 0, -.22, 0, .36, .6, .4],
      [0x5a3a22, 0, -.3, .28, .2, 1.4, .2, "cylinder"],
      [iron, 0, .45, .28, .42, .5, .42, "round"],
      ...pair([steel, -.18, .55, .28, .07, .22, .07, "cone", .9]),
      [steel, 0, .78, .28, .07, .22, .07, "cone"],
    ],
    scale: 1.22,
  }
}

/** Stone gargoyle with horns and spread bat wings (wings flap through the leg sockets). */
function gargoyle(): ActorBlueprint {
  const stone = 0x6c6878, deep = 0x4b4858, glow = 0xa58bff
  return {
    body: [
      [stone, 0, 1.15, 0, .7, .75, .6],
      [deep, 0, .82, 0, .55, .3, .45],
      [stone, 0, 1.72, .18, .62, .52, .55],
      ...pair([glow, -.14, 1.78, .46, .1, .06, .03]),
      ...pair([bone, -.2, 2.1, .1, .1, .36, .1, "cone", .4]),
      [deep, 0, 1.55, .48, .3, .14, .1],
      ...pair([bone, -.1, 1.5, .52, .05, .1, .05, "cone", Math.PI]),
      [deep, 0, .9, -.55, .12, .12, .55],
      [glow, 0, 1.25, .32, .18, .18, .05, "round"],
    ],
    leg: [[deep, 0, 0, 0, 1.5, .12, .7], [stone, 0, -.1, .1, 1.1, .1, .4], [glow, 0, .04, 0, 1.55, .04, .08]],
    arm: null,
    weapon: null,
    scale: 1.1,
  }
}

/** Treasure chest with a gaping lid, teeth and tongue. Reads as loot at a glance, then as a monster. */
function mimic(): ActorBlueprint {
  const wood = 0x7a4f2c, band = gold, maw = 0x3a0f16
  const teeth: Part[] = [-.4, -.2, 0, .2, .4].flatMap(x => [[bone, x, .86, .36, .1, .16, .1, "cone", Math.PI] as Part, [bone, x + .1, .98, .3, .09, .15, .09, "cone"] as Part])
  return {
    body: [
      [wood, 0, .42, 0, 1.15, .76, .8],
      [band, 0, .78, 0, 1.2, .08, .84],
      [maw, 0, .9, .05, 1.0, .1, .66],
      [wood, 0, 1.28, -.18, 1.15, .32, .78, "box", 0],
      [band, 0, 1.12, -.18, 1.2, .07, .82],
      [0xff4f6a, 0, .92, .32, .34, .07, .42],
      ...teeth,
      ...pair([0xffe066, -.3, 1.32, .22, .12, .1, .04]),
      [band, 0, .5, .41, .2, .26, .06],
    ],
    leg: [[wood, 0, -.12, 0, .16, .26, .16], [bone, 0, -.26, .08, .12, .08, .14, "cone", Math.PI]],
    arm: null,
    weapon: null,
    scale: .95,
  }
}

/** Waddling mushroom with a spotted cap. */
function sporeling(): ActorBlueprint {
  const cap = 0xd8433f, stem = 0xf0e3c4, spot = 0xfff6e0
  return {
    body: [
      [stem, 0, .78, 0, .55, .7, .5, "cylinder"],
      [cap, 0, 1.38, 0, .95, .5, .95, "round"],
      [0xb3322f, 0, 1.18, 0, .9, .1, .9, "cylinder"],
      ...pair([spot, -.38, 1.55, .25, .14, .1, .14, "round"]),
      [spot, 0, 1.78, .1, .16, .1, .16, "round"],
      [spot, .1, 1.5, -.42, .13, .1, .13, "round"],
      ...pair([ink, -.12, .95, .27, .07, .1, .03]),
      [0xff8fa3, 0, .8, .27, .12, .04, .03],
    ],
    leg: [[stem, 0, -.12, 0, .16, .26, .18]],
    arm: [[stem, 0, -.18, 0, .12, .36, .12]],
    weapon: null,
    scale: .85,
  }
}

/** Pale crawling ghoul with long clawed arms. */
function ghoul(): ActorBlueprint {
  const flesh = 0x9fae8f, shadow = 0x6b7a63, eye = 0xfff36a
  return {
    body: [
      [flesh, 0, .95, .1, .62, .5, .9],
      [shadow, 0, 1.08, -.2, .5, .22, .7],
      ...[-.35, -.1, .15].map(z => [bone, 0, 1.24, z, .12, .08, .12, "cone"] as Part),
      [flesh, 0, 1.15, .66, .5, .44, .46],
      ...pair([eye, -.12, 1.22, .9, .1, .06, .03]),
      [0x3b1a1a, 0, 1.0, .88, .3, .1, .04],
      ...pair([bone, -.08, .98, .9, .04, .08, .03, "cone", Math.PI]),
    ],
    leg: [[shadow, 0, -.3, -.1, .2, .5, .22], [flesh, 0, -.55, .02, .24, .12, .32]],
    arm: [[flesh, 0, -.35, .2, .16, .8, .18], ...[-.08, 0, .08].map(x => [bone, x, -.8, .3, .04, .18, .04, "cone", Math.PI] as Part)],
    weapon: [[flesh, 0, -.35, .2, .16, .8, .18], ...[-.08, 0, .08].map(x => [bone, x, -.8, .3, .04, .18, .04, "cone", Math.PI] as Part)],
    scale: .95,
  }
}

/** Cursed death knight: black spiked plate, horned helm, sickly green visor and cape. */
function deathKnight(): ActorBlueprint {
  const plate = 0x2c2838, trim = 0x5b4a73, glow = 0x7dff9a, cape = 0x3a1427
  return {
    body: [
      [plate, 0, 1.2, 0, 1.0, .9, .72],
      [trim, 0, 1.35, .38, .78, .55, .08],
      [glow, 0, 1.35, .43, .16, .16, .04, "round"],
      [plate, 0, .82, 0, 1.05, .22, .78],
      [plate, 0, 2.02, .04, .82, .74, .74],
      [0x09070d, 0, 2.02, .42, .6, .16, .04],
      ...pair([glow, -.15, 2.03, .44, .12, .05, .03]),
      ...pair([bone, -.42, 2.48, 0, .14, .62, .14, "cone", .55]),
      ...pair([plate, -.66, 1.66, 0, .48, .32, .62]),
      ...pair([trim, -.7, 1.9, 0, .1, .36, .1, "cone", .4]),
      ...pair([trim, -.55, 1.92, .22, .09, .3, .09, "cone", .25]),
      [cape, 0, 1.15, -.46, 1.0, 1.4, .1],
      [cape, 0, .5, -.5, 1.1, .25, .12],
    ],
    leg: [[plate, 0, -.28, 0, .34, .6, .38], [trim, 0, -.6, .1, .4, .2, .5]],
    arm: [[plate, 0, -.1, 0, .46, .5, .52], [trim, 0, -.48, 0, .34, .5, .38]],
    weapon: [
      [plate, 0, -.1, 0, .46, .5, .52],
      [trim, 0, -.42, .05, .3, .3, .3],
      [0x3d2a20, 0, -.3, .26, .12, .5, .12],
      [trim, 0, 0, .26, .7, .12, .18],
      [0x9fb3c8, 0, .9, .26, .2, 1.7, .08],
      [glow, 0, .9, .31, .05, 1.5, .02],
    ],
    scale: 1.4,
  }
}

/** Blueprint registry for actors not covered by the legacy builder. Add new kinds here (open/closed). */
export const monsterBlueprints: Partial<Record<EnemyKind, () => ActorBlueprint>> = {
  guard: orcWarden,
  gargoyle,
  mimic,
  sporeling,
  ghoul,
  deathknight: deathKnight,
}

/** Kinds whose leg sockets carry wings and should flap instead of walk. */
export const wingedKinds: ReadonlySet<EnemyKind> = new Set<EnemyKind>(["bat", "gargoyle"])
