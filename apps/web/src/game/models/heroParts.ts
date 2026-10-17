import { dyePalettes, type HeroSlot } from "@typecade/content"
import { pair, type ActorBlueprint, type Part } from "./blueprint"

/** Colors an item draws with. `glow` uses colors registered in vertexGlow so it self-illuminates. */
interface Palette { cloth: number; trim: number; metal: number; leather: number; glow: number; skin: number; hair: number; ink: number; dark: (hex: number) => number }

const shade = (hex: number, factor: number) => {
  const c = (shift: number) => Math.max(0, Math.min(255, Math.round((hex >> shift & 255) * factor)))
  return c(16) << 16 | c(8) << 8 | c(0)
}

function palette(dyeId: string): Palette {
  const dye = dyePalettes[dyeId] ?? dyePalettes["dye.keep"]!
  return { ...dye, glow: dye.glow ?? 0x7fd6ff, skin: 0xd9a57e, hair: 0x4a2f20, ink: 0x10141c, dark: hex => shade(hex, .72) }
}

/** Hero sockets match DungeonModels.rig: legs at y .7, arms/weapon at shoulder y 1.52. */
type Builder = (p: Palette) => Part[]

/** Full helms hide the face; their face item sits on the visor instead. */
const closedHelms = new Set(["head.great", "head.dragon", "head.crown"])

const heads: Record<string, Builder> = {
  "head.squire": p => [[p.cloth, 0, 2.36, -.02, .84, .22, .8], [p.leather, 0, 2.25, 0, .86, .08, .82], [p.dark(p.cloth), 0, 2.48, -.05, .5, .1, .5]],
  "head.bare": p => [[p.hair, 0, 2.34, -.04, .82, .2, .78], [p.hair, 0, 2.24, .33, .72, .12, .1], ...pair([p.hair, -.4, 2.06, -.02, .08, .4, .68])],
  "head.kettle": p => [[p.metal, 0, 2.27, 0, 1.18, .07, 1.12, "cylinder"], [p.metal, 0, 2.42, 0, .62, .28, .62, "round"], [p.trim, 0, 2.3, 0, .9, .05, .86]],
  "head.cowl": p => [[p.cloth, 0, 2.1, -.06, .96, .92, .9], [p.ink, 0, 2.02, .4, .62, .52, .04], [p.cloth, 0, 2.52, -.28, .28, .34, .28, "cone", .5], [p.trim, 0, 1.62, .32, .5, .07, .1]],
  "head.great": p => [[p.metal, 0, 2.08, 0, .92, .92, .88], [p.trim, 0, 2.5, 0, .94, .08, .9], [p.ink, 0, 2.12, .45, .64, .07, .03], ...[-.18, 0, .18].map(x => [p.ink, x, 1.88, .45, .05, .05, .02] as Part)],
  "head.horned": p => [[p.metal, 0, 2.34, 0, .86, .3, .82, "round"], [p.trim, 0, 2.22, 0, .9, .07, .86], ...pair([0xe6dcc0, -.5, 2.48, 0, .14, .46, .14, "cone", .9]), ...pair([0xe6dcc0, -.66, 2.78, 0, .1, .26, .1, "cone", -.3])],
  "head.ranger": p => [[p.cloth, 0, 2.12, -.06, .94, .88, .88], [p.ink, 0, 2.02, .4, .6, .5, .04], [p.cloth, 0, 2.56, -.38, .3, .5, .3, "cone", .9], [0x7fa860, .3, 1.66, .34, .14, .14, .05, "round"]],
  "head.winged": p => [[p.metal, 0, 2.34, 0, .86, .32, .82, "round"], [p.trim, 0, 2.2, 0, .9, .07, .86], ...pair([p.trim, -.5, 2.5, -.05, .08, .4, .4, "box", .5]), ...pair([p.metal, -.62, 2.72, -.12, .06, .3, .34, "box", .9])],
  "head.dragon": p => [[p.metal, 0, 2.08, 0, .92, .9, .88], [p.metal, 0, 1.98, .5, .44, .3, .3], [p.ink, 0, 2.12, .47, .6, .06, .03], ...[-.25, .05, .35].map(z => [p.trim, 0, 2.58 - z * .2, z - .1, .08, .26, .14, "cone"] as Part)],
  "head.crown": p => [[p.metal, 0, 2.08, 0, .92, .92, .88], [p.ink, 0, 2.12, .45, .64, .07, .03], [0xe8b966, 0, 2.55, 0, .98, .12, .94, "cylinder"], ...[-.32, 0, .32].map(x => [0xe8b966, x, 2.72, .3, .1, .24, .1, "cone"] as Part), [0xffe066, 0, 2.6, .46, .1, .1, .05, "round"]],
  "head.bandana": p => [[p.hair, 0, 2.3, -.06, .8, .14, .72], [p.cloth, 0, 2.3, 0, .84, .16, .8], [p.dark(p.cloth), 0, 2.24, .41, .72, .04, .02], [p.cloth, 0, 2.2, -.44, .14, .14, .1], [p.cloth, .08, 2.06, -.46, .1, .3, .04, "box", -.35], [p.dark(p.cloth), -.06, 2.04, -.46, .1, .26, .04, "box", .3]],
  "head.coif": p => { const mail = shade(p.metal, .82); return [[mail, 0, 2.36, -.04, .86, .2, .8], [mail, 0, 2.04, -.28, .86, .72, .3], ...pair([mail, -.41, 2.06, .04, .08, .66, .62]), [mail, 0, 1.66, .06, .84, .2, .66], [p.leather, 0, 2.27, .02, .88, .05, .82]] },
  "head.longhair": p => [[p.hair, 0, 2.34, -.04, .82, .2, .78], [p.hair, 0, 2.26, .33, .74, .1, .1], [p.hair, 0, 1.86, -.36, .72, .78, .14], ...pair([p.hair, -.4, 1.98, -.04, .08, .6, .7]), [p.leather, 0, 1.6, -.4, .2, .08, .06]],
  "head.circlet": p => [[p.hair, 0, 2.34, -.04, .82, .2, .78], [p.hair, 0, 2.24, .33, .72, .12, .1], ...pair([p.hair, -.4, 2.08, -.02, .08, .34, .66]), [p.metal, 0, 2.3, 0, .86, .06, .82], [p.trim, 0, 2.3, .42, .12, .12, .04, "round"]],
}

/** Face parts sit on the skin (z .37) or on a closed helm's visor (z .46). */
const faces: Record<string, (p: Palette, z: number) => Part[]> = {
  "face.steady": (p, z) => pair([p.ink, -.16, 2.04, z, .1, .12, .03]),
  "face.scar": (p, z) => [...pair([p.ink, -.16, 2.04, z, .1, .12, .03]), [0xa4443c, .17, 2.05, z + .01, .03, .32, .02, "box", .5]],
  "face.beard": (p, z) => [...pair([p.ink, -.16, 2.04, z, .1, .12, .03]), [p.hair, 0, 1.76, z - .02, .6, .24, .08], ...pair([p.hair, -.12, 1.52, z - .02, .1, .3, .08])],
  "face.mask": (p, z) => [...pair([p.ink, -.16, 2.06, z, .1, .1, .03]), [p.cloth, 0, 1.84, z, .74, .24, .06]],
  "face.visor": (_p, z) => pair([0x7fd6ff, -.16, 2.08, z + .01, .14, .05, .03]),
  "face.skull": (p, z) => [[0xe6dcc0, 0, 1.98, z, .68, .62, .05], ...pair([p.ink, -.15, 2.04, z + .02, .14, .14, .03]), [p.ink, 0, 1.86, z + .02, .06, .1, .03], ...[-.12, 0, .12].map(x => [p.ink, x, 1.74, z + .02, .05, .06, .03] as Part)],
  "face.ember": (_p, z) => pair([0xff8352, -.16, 2.05, z + .01, .12, .1, .03]),
  "face.stern": (p, z) => [...pair([p.ink, -.16, 2.03, z, .1, .1, .03]), ...pair([p.hair, -.17, 2.15, z + .01, .18, .05, .03, "box", -.25]), [p.dark(p.skin), 0, 1.84, z, .2, .04, .02]],
  "face.stubble": (p, z) => [...pair([p.ink, -.16, 2.04, z, .1, .12, .03]), [shade(p.hair, 1.25), 0, 1.78, z - .01, .62, .2, .03], [p.dark(p.skin), 0, 1.86, z + .01, .18, .04, .02]],
  "face.eyepatch": (p, z) => [[p.ink, .16, 2.04, z, .1, .12, .03], [p.ink, -.16, 2.05, z + .01, .18, .16, .03], [p.ink, 0, 2.16, z - .01, .78, .04, .03, "box", -.18]],
  "face.mustache": (p, z) => [...pair([p.ink, -.16, 2.04, z, .1, .12, .03]), ...pair([p.hair, -.12, 1.86, z + .01, .22, .07, .04, "box", .3])],
}

const torso: Record<string, Builder> = {
  "body.gambeson": p => [[p.cloth, 0, 1.18, 0, .92, .84, .64], ...[.95, 1.15, 1.35].map(y => [p.dark(p.cloth), 0, y, .33, .86, .03, .02] as Part), [p.leather, 0, .84, 0, .96, .14, .68], [p.trim, 0, .84, .35, .14, .12, .03]],
  "body.jerkin": p => [[p.cloth, 0, 1.18, 0, .9, .82, .62], [p.leather, 0, 1.16, .03, .94, .7, .64], [p.dark(p.leather), 0, 1.16, .34, .05, .62, .02], [p.leather, 0, .84, 0, .98, .14, .7], [p.trim, 0, .84, .36, .14, .12, .03]],
  "body.chain": p => [[shade(p.metal, .8), 0, 1.18, 0, .94, .86, .66], [p.cloth, 0, 1.08, .34, .6, .96, .04], [p.trim, 0, 1.52, .35, .6, .06, .04], [p.leather, 0, .86, 0, .98, .12, .7]],
  "body.plate": p => [[p.metal, 0, 1.22, .02, .96, .8, .7], [p.trim, 0, 1.22, .38, .06, .64, .02], ...pair([p.metal, -.56, 1.56, 0, .42, .3, .5, "round"]), [p.cloth, 0, .76, .1, .92, .3, .62], [p.leather, 0, .9, 0, 1, .12, .72]],
  "body.rangercoat": p => [[p.cloth, 0, 1.06, 0, .94, 1.06, .66], [p.dark(p.cloth), 0, .66, .02, .98, .3, .68], [p.leather, 0, 1.2, .35, .12, 1, .04, "box", .7], ...[1.4, 1.2, 1.0].map(y => [p.trim, .1 - (y - 1) * .5, y, .37, .07, .08, .03] as Part)],
  "body.gilded": p => [[p.metal, 0, 1.22, .02, .96, .8, .7], [p.trim, 0, 1.22, .38, .62, .05, .02], [p.trim, 0, 1.4, .38, .4, .05, .02], ...pair([p.metal, -.56, 1.56, 0, .44, .32, .52, "round"]), ...pair([p.trim, -.56, 1.5, .1, .46, .06, .5]), [p.cloth, 0, .76, .1, .92, .3, .62], [p.trim, 0, .9, 0, 1, .12, .72]],
  "body.obsidian": _p => [[0x1d1b22, 0, 1.22, .02, .96, .8, .7], [0xff8352, 0, 1.22, .38, .04, .6, .02], [0xff8352, -.2, 1.05, .38, .2, .04, .02, "box", .6], ...pair([0x26232c, -.56, 1.58, 0, .46, .34, .54, "round"]), ...pair([0xff8352, -.56, 1.66, .2, .2, .04, .04]), [0x26232c, 0, .76, .1, .92, .3, .62]],
  "body.tunic": p => [[p.cloth, 0, 1.12, 0, .92, .96, .64], [p.trim, 0, 1.5, .33, .44, .08, .02], [p.leather, 0, .9, 0, .96, .1, .68], [p.metal, 0, .9, .35, .12, .1, .03], [p.dark(p.cloth), .3, .72, .3, .1, .3, .03, "box", -.2]],
  "body.brigandine": p => [[p.leather, 0, 1.18, 0, .94, .84, .66], ...[1.02, 1.22, 1.42].flatMap(y => [-.24, 0, .24].map(x => [p.metal, x, y, .34, .06, .06, .02] as Part)), [p.cloth, 0, .76, .04, .9, .24, .62], [p.dark(p.leather), 0, .88, 0, 1, .12, .7], [p.trim, 0, .88, .36, .14, .12, .03]],
  "body.robe": p => [[p.cloth, 0, .9, 0, 1.02, 1.36, .7, "cone"], [p.cloth, 0, 1.3, 0, .9, .6, .62], [p.trim, 0, 1.3, .32, .1, .56, .02], [shade(p.leather, 1.3), 0, .96, 0, .94, .07, .66], [shade(p.leather, 1.3), .16, .78, .34, .05, .3, .03]],
}

const backs: Record<string, Builder> = {
  "back.none": () => [],
  "back.satchel": p => [[p.leather, .32, .92, -.36, .34, .3, .2], [p.dark(p.leather), 0, 1.25, -.33, .1, .7, .04, "box", .7]],
  "back.cape": p => [[p.cloth, 0, 1.26, -.42, .9, .9, .08], [p.trim, 0, 1.68, -.38, .92, .08, .1]],
  "back.longcape": p => [[p.cloth, 0, .98, -.44, .94, 1.5, .08], [p.dark(p.cloth), 0, .26, -.45, .96, .1, .08], [p.trim, 0, 1.68, -.4, .96, .08, .1]],
  "back.quiver": p => [[p.leather, -.2, 1.25, -.42, .22, .8, .22, "cylinder", .35], ...[-.06, .02, .1].map(dx => [0xe6dcc0, -.42 + dx, 1.78, -.42, .03, .3, .03, "box", .35] as Part), ...[-.06, .02, .1].map(dx => [p.cloth, -.5 + dx, 1.92, -.42, .07, .1, .02, "box", .35] as Part)],
  "back.banner": p => [[p.leather, -.3, 1.5, -.4, .07, 2, .07], [p.cloth, -.62, 2.1, -.4, .6, .7, .03], [p.trim, -.62, 2.1, -.38, .22, .22, .03, "round"], [p.trim, -.3, 2.52, -.4, .12, .12, .12, "round"]],
  "back.mantle": () => [[0xd2552f, 0, 1.3, -.42, .96, .9, .1], ...[-.36, -.12, .12, .36].map(x => [0xffa040, x, .78, -.44, .14, .3, .06, "cone", Math.PI] as Part), ...pair([0xffe066, -.48, 1.66, -.36, .12, .3, .08, "cone", .8])],
  "back.bedroll": p => [[p.cloth, 0, 1.56, -.44, .9, .26, .26, "cylinder", Math.PI / 2], ...pair([p.leather, -.26, 1.56, -.44, .05, .3, .3]), [p.dark(p.leather), 0, 1.15, -.34, .1, .7, .04, "box", -.7]],
  "back.scabbard": p => [[p.leather, .1, 1.2, -.4, .14, 1.1, .08, "box", -.5], [p.trim, .38, 1.68, -.4, .2, .06, .1, "box", -.5], [p.leather, .45, 1.8, -.4, .06, .2, .06, "box", -.5], [p.metal, -.18, .74, -.4, .12, .1, .08, "box", -.5]],
  "back.lantern": p => [[p.leather, .3, 1.0, -.4, .1, .24, .06], [p.metal, .3, .78, -.42, .2, .06, .2], [0xffd27a, .3, .66, -.42, .14, .18, .14], [p.metal, .3, .54, -.42, .2, .06, .2], [p.dark(p.leather), 0, 1.22, -.34, .1, .74, .04, "box", .7]],
}

const legs: Record<string, Builder> = {
  "legs.boots": p => [[p.dark(p.cloth), 0, -.23, 0, .32, .5, .35], [p.leather, 0, -.5, .05, .38, .26, .44], [p.dark(p.leather), 0, -.62, .14, .4, .12, .6]],
  "legs.greaves": p => [[p.dark(p.cloth), 0, -.23, 0, .32, .5, .35], [p.leather, 0, -.44, .12, .36, .3, .2], [p.dark(p.leather), 0, -.6, .12, .4, .14, .6]],
  "legs.chain": p => [[shade(p.metal, .78), 0, -.24, 0, .34, .5, .36], [p.leather, 0, -.52, .06, .38, .24, .44], [p.dark(p.leather), 0, -.62, .14, .4, .12, .6]],
  "legs.plate": p => [[p.metal, 0, -.22, 0, .36, .48, .38], [p.metal, 0, -.42, .16, .2, .14, .1, "round"], [p.metal, 0, -.52, .06, .4, .24, .46], [p.dark(p.metal), 0, -.62, .16, .42, .12, .62]],
  "legs.spurred": p => [[p.metal, 0, -.22, 0, .36, .48, .38], [p.trim, 0, -.42, .16, .2, .14, .1, "round"], [p.metal, 0, -.52, .06, .4, .24, .46], [p.metal, 0, -.62, .3, .2, .1, .34, "cone", Math.PI / 2], [p.trim, 0, -.6, -.22, .04, .04, .16]],
  "legs.wraps": p => [[p.dark(p.cloth), 0, -.2, 0, .32, .44, .35], ...[-.32, -.42].map(y => [shade(p.trim, .85), 0, y, .02, .36, .06, .38] as Part), [shade(p.leather, 1.15), 0, -.5, .05, .36, .18, .42], [p.dark(p.leather), 0, -.62, .12, .38, .1, .56]],
  "legs.highboots": p => [[p.dark(p.cloth), 0, -.14, 0, .32, .3, .35], [p.leather, 0, -.24, .02, .4, .12, .42], [p.leather, 0, -.44, .04, .36, .34, .4], [p.metal, 0, -.4, .23, .06, .06, .02], [p.dark(p.leather), 0, -.62, .14, .4, .12, .6]],
}

const sleeve = (p: Palette, body: string): Part[] => {
  const metal = body === "body.plate" || body === "body.gilded" || body === "body.obsidian" || body === "body.chain"
  const color = body === "body.obsidian" ? 0x26232c : metal ? p.metal : body === "body.jerkin" || body === "body.brigandine" ? p.leather : p.cloth
  return [[color, 0, -.14, 0, .38, .42, .44], [p.dark(color), 0, -.42, .02, .3, .38, .32], [p.leather, 0, -.64, .08, .32, .24, .36]]
}

/** Weapon parts held in the right hand (hand at y -.65, blade pointing up and forward). */
const weapons: Record<string, Builder> = {
  "weapon.arming": p => [[p.leather, 0, -.78, .22, .09, .3, .09], [p.trim, 0, -.6, .22, .16, .16, .16, "round"], [p.metal, 0, -.02, .22, .14, 1.05, .05], [0xf1f6fa, -.04, -.02, .25, .04, 1.0, .03], [p.metal, 0, .54, .22, .14, .14, .05, "cone"]],
  "weapon.axe": p => [[p.leather, 0, -.35, .22, .09, 1.1, .09], [p.metal, .16, .12, .22, .34, .36, .06], [0xf1f6fa, .32, .12, .23, .04, .34, .03]],
  "weapon.spear": p => [[p.leather, 0, -.1, .22, .07, 1.9, .07], [p.metal, 0, .98, .22, .12, .38, .05, "cone"], [p.trim, 0, .74, .22, .1, .08, .1, "cylinder"]],
  "weapon.mace": p => [[p.leather, 0, -.38, .22, .09, .95, .09], [p.metal, 0, .2, .22, .26, .26, .26, "round"], ...[0, 1, 2, 3].map(i => [p.metal, Math.sin(i * Math.PI / 2) * .16, .2, .22 + Math.cos(i * Math.PI / 2) * .16, .06, .24, .06] as Part)],
  "weapon.greatsword": p => [[p.leather, 0, -.85, .22, .09, .45, .09], [p.trim, 0, -.6, .22, .2, .2, .2, "round"], [p.metal, 0, .26, .22, .18, 1.6, .05], [0xf1f6fa, -.05, .26, .25, .05, 1.55, .03], [p.metal, 0, 1.1, .22, .18, .18, .05, "cone"]],
  "weapon.hammer": p => [[p.leather, 0, -.3, .22, .1, 1.3, .1], [p.metal, 0, .44, .22, .5, .26, .26], [p.dark(p.metal), .27, .44, .22, .06, .3, .3]],
  "weapon.rune": p => [[p.leather, 0, -.78, .22, .09, .3, .09], [p.trim, 0, -.6, .22, .18, .18, .18, "round"], [0x2e3a4c, 0, .05, .22, .15, 1.15, .05], ...[-.25, .1, .45].map(y => [0x7fd6ff, 0, y, .25, .06, .12, .02] as Part)],
  "weapon.crescent": p => [[p.leather, 0, -.25, .22, .09, 1.5, .09], [p.metal, .24, .56, .22, .12, .5, .06, "box", -.5], [p.metal, .24, .22, .22, .12, .5, .06, "box", .5], [0xf1f6fa, .36, .39, .23, .04, .5, .03]],
  "weapon.sunfire": p => [[p.leather, 0, -.78, .22, .09, .3, .09], [0xe8b966, 0, -.6, .22, .18, .18, .18, "round"], [0xffe066, 0, .05, .22, .15, 1.15, .05], [0xfff0a0, 0, .05, .25, .06, 1.1, .03], [0xffa040, 0, .66, .22, .15, .2, .05, "cone"]],
  "weapon.shortsword": p => [[p.leather, 0, -.76, .22, .09, .26, .09], [p.metal, 0, -.6, .22, .36, .07, .1], [p.metal, 0, -.12, .22, .14, .8, .05], [0xf1f6fa, -.04, -.12, .25, .04, .76, .03], [p.metal, 0, .32, .22, .14, .12, .05, "cone"]],
  "weapon.club": p => [[p.leather, 0, -.6, .22, .1, .4, .1], [shade(p.leather, 1.4), 0, -.05, .22, .2, .8, .2, "cylinder"], [shade(p.leather, 1.55), 0, .38, .22, .28, .3, .28, "cylinder"], ...[.12, .32].map(y => [p.metal, 0, y, .22, .3, .04, .3, "cylinder"] as Part)],
  "weapon.falchion": p => [[p.leather, 0, -.78, .22, .09, .28, .09], [p.trim, 0, -.6, .22, .3, .07, .1], [p.metal, .04, -.08, .22, .2, .96, .05], [p.metal, .08, .44, .22, .2, .22, .05, "cone", -.4], [0xf1f6fa, .12, -.08, .25, .04, .9, .03]],
  "weapon.staff": p => [[shade(p.leather, 1.35), 0, -.1, .22, .08, 2, .08], [p.dark(p.leather), 0, .96, .22, .14, .1, .14, "cylinder"], [p.trim, 0, -.4, .22, .12, .06, .12, "cylinder"], [p.trim, 0, .4, .22, .12, .06, .12, "cylinder"]],
}

/** Off-hand parts on the left arm, facing forward (z .3). */
const offhands: Record<string, Builder> = {
  "offhand.bare": () => [],
  "offhand.buckler": p => [[p.leather, 0, -.5, .3, .42, .42, .07, "round"], [p.metal, 0, -.5, .35, .14, .14, .06, "round"], [p.trim, 0, -.5, .31, .46, .46, .04, "round"]],
  "offhand.heater": p => [[p.trim, 0, -.42, .31, .66, .62, .06], [p.cloth, 0, -.4, .35, .58, .54, .04], [p.cloth, 0, -.8, .33, .36, .32, .05, "cone", Math.PI], [p.trim, 0, -.42, .38, .2, .2, .03, "round"]],
  "offhand.kite": p => [[p.trim, 0, -.35, .31, .6, .6, .06], [p.cloth, 0, -.33, .35, .52, .52, .04], [p.cloth, 0, -.88, .33, .32, .56, .05, "cone", Math.PI], [p.trim, -.14, -.4, .38, .06, .5, .02, "box", .4]],
  "offhand.tower": p => [[p.trim, 0, -.5, .32, .7, 1.2, .07], [p.cloth, 0, -.5, .36, .6, 1.1, .04], [p.metal, 0, -.2, .4, .5, .06, .03], [p.metal, 0, -.8, .4, .5, .06, .03]],
  "offhand.torch": p => [[shade(p.leather, 1.3), 0, -.55, .26, .08, .7, .08], [p.dark(p.leather), 0, -.2, .26, .14, .12, .14, "cylinder"], [0xffa040, 0, -.02, .26, .16, .3, .16, "cone"], [0xfff0a0, 0, -.06, .27, .08, .18, .08, "cone"]],
  "offhand.dagger": p => [[p.leather, 0, -.7, .22, .08, .2, .08], [p.trim, 0, -.58, .22, .22, .05, .08], [p.metal, 0, -.32, .22, .1, .44, .04], [0xf1f6fa, -.03, -.32, .24, .03, .4, .02]],
  "offhand.roundshield": p => [[shade(p.leather, 1.35), 0, -.5, .3, .62, .62, .07, "round"], ...[-.14, .14].map(x => [p.dark(shade(p.leather, 1.35)), x, -.5, .34, .03, .58, .02] as Part), [p.metal, 0, -.5, .35, .2, .2, .07, "round"], [p.metal, 0, -.5, .31, .66, .66, .04, "round"]],
}

const pick = <T,>(table: Record<string, T>, id: string, fallback: string): T => table[id] ?? table[fallback]!

/**
 * Hero parts are authored with every size as a full width (like boxes). The shared primitives
 * for round, cylinder and cone have radius 1, so their widths are halved here.
 */
function toPrimitiveScale(part: Part): Part {
  const [color, x, y, z, sx, sy, sz, shape = "box", rz = 0] = part
  if (shape === "round") return [color, x, y, z, sx / 2, sy / 2, sz / 2, shape, rz]
  if (shape === "cylinder" || shape === "cone") return [color, x, y, z, sx / 2, sy, sz / 2, shape, rz]
  return part
}

/** Builds the hero blueprint for a loadout. Unknown ids fall back to the starter look. */
export function heroBlueprint(loadout: Readonly<Record<HeroSlot, string>>): ActorBlueprint {
  const p = palette(loadout.dye)
  const closed = closedHelms.has(loadout.head)
  const head: Part[] = closed ? [] : [[p.skin, 0, 2.02, 0, .76, .72, .7]]
  const neck: Part = [p.skin, 0, 1.66, 0, .3, .14, .3]
  const blueprint: ActorBlueprint = {
    body: [neck, ...pick(torso, loadout.body, "body.gambeson")(p), ...head, ...pick(heads, loadout.head, "head.squire")(p), ...pick(faces, loadout.face, "face.steady")(p, closed ? .47 : .37), ...pick(backs, loadout.back, "back.none")(p)],
    leg: pick(legs, loadout.legs, "legs.boots")(p),
    arm: [...sleeve(p, loadout.body), ...pick(offhands, loadout.offhand, "offhand.buckler")(p)],
    weapon: [...sleeve(p, loadout.body), ...pick(weapons, loadout.weapon, "weapon.arming")(p)],
    scale: 1,
  }
  return { ...blueprint, body: blueprint.body.map(toPrimitiveScale), leg: blueprint.leg.map(toPrimitiveScale), arm: blueprint.arm?.map(toPrimitiveScale) ?? null, weapon: blueprint.weapon?.map(toPrimitiveScale) ?? null }
}
