import { dyePalettes, type HeroSlot } from "@typecade/content"
import { pair, type ActorBlueprint, type Part } from "./blueprint"
import { archetypeFor, openHeads } from "./heroArchetypes"

/** Colors an item draws with. `glow` uses colors registered in vertexGlow so it self-illuminates. */
interface Palette { cloth: number; trim: number; metal: number; leather: number; glow: number; skin: number; hair: number; ink: number; dark: (hex: number) => number }

const shade = (hex: number, factor: number) => {
  const c = (shift: number) => Math.max(0, Math.min(255, Math.round((hex >> shift & 255) * factor)))
  return c(16) << 16 | c(8) << 8 | c(0)
}

function palette(dyeId: string, skin: number, hair: number): Palette {
  const dye = dyePalettes[dyeId] ?? dyePalettes["dye.keep"]!
  return { ...dye, glow: dye.glow ?? 0x7fd6ff, skin, hair, ink: 0x10141c, dark: hex => shade(hex, .72) }
}

/** Hero sockets match DungeonModels.rig: legs at y .7, arms/weapon at shoulder y 1.52. */
type Builder = (p: Palette) => Part[]

/** Full helms hide the face; their face item sits on the visor instead. */
const closedHelms = new Set(["head.great", "head.dragon", "head.crown"])

const heads: Record<string, Builder> = {
  "head.none": () => [],
  "head.shadowhood": p => [[0x1a1a20, 0, 2.12, -.06, .98, .94, .9], [p.ink, 0, 2.02, .4, .64, .54, .04], [p.trim, 0, 2.12, .44, .7, .7, .02], [0x1a1a20, 0, 2.6, -.32, .3, .36, .3, "cone", .6], [0x1a1a20, 0, 1.56, -.3, .9, .3, .5]],
  "head.wolfpelt": () => { const fur = 0x8a8f96, dark = 0x5a5e66; return [[fur, 0, 2.4, -.04, .92, .3, .9], [fur, 0, 2.42, .42, .5, .22, .34], [0x2a2a2e, 0, 2.42, .6, .14, .1, .06], ...pair([fur, -.3, 2.66, .02, .14, .26, .14, "cone", .2]), ...pair([0xf0ead8, -.14, 2.3, .58, .05, .12, .05, "cone", Math.PI]), [dark, 0, 1.8, -.46, .96, 1.1, .1], ...pair([0xffcf4a, -.14, 2.5, .52, .06, .04, .02])] },
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
  // Female faces: lashes swept out from the eye and coloured lips.
  "face.lashes": (p, z) => [...pair([p.ink, -.16, 2.04, z, .1, .13, .03]), ...pair([p.ink, -.23, 2.12, z + .01, .1, .03, .02, "box", .5]), ...pair([0xffffff, -.14, 2.07, z + .01, .03, .03, .02]), [0xc0405a, 0, 1.84, z, .16, .05, .02]],
  "face.moonlit": (p, z) => [...pair([0x9ff5fa, -.16, 2.04, z + .01, .12, .1, .03]), ...pair([p.ink, -.23, 2.12, z + .01, .1, .03, .02, "box", .5]), [0xb8c0e8, 0, 1.84, z, .16, .05, .02]],
  "face.warpaint": (p, z) => [...pair([p.ink, -.16, 2.04, z, .1, .1, .03]), ...pair([p.dark(p.skin), -.16, 2.14, z + .01, .22, .07, .03, "box", -.2]), ...pair([0xc8302a, -.16, 1.9, z + .01, .06, .2, .02]), [0xc8302a, 0, 2.24, z + .01, .06, .14, .02]],
  "face.redeyes": (p, z) => [...pair([0xff4a5a, -.16, 2.04, z + .01, .12, .08, .03]), ...pair([p.ink, -.24, 2.11, z + .01, .12, .03, .02, "box", .5]), [0x5a2a4a, 0, 1.84, z, .16, .05, .02]],
  "face.slit": (p, z) => [...pair([0xffcf4a, -.16, 2.04, z + .01, .12, .12, .03]), ...pair([p.ink, -.16, 2.04, z + .02, .03, .12, .02]), ...pair([p.ink, -.24, 2.12, z + .01, .1, .03, .02, "box", .5]), ...pair([shade(p.skin, .8), -.28, 1.9, z, .1, .1, .02, "box", Math.PI / 4]), [0xa0303a, 0, 1.84, z, .16, .05, .02]],
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
  "body.tabard": p => [[p.metal, 0, 1.2, 0, .96, .84, .7], ...pair([p.metal, -.56, 1.56, 0, .4, .28, .48, "round"]), [p.cloth, 0, 1.0, .36, .62, 1.08, .04], [p.trim, 0, 1.52, .38, .62, .06, .03], [p.trim, 0, .48, .38, .62, .06, .03], [p.leather, 0, .86, 0, 1.0, .12, .72], [p.trim, 0, .86, .37, .14, .12, .03]],
  // Fitted coat with a narrow waist and long split tails flaring to the knees.
  "body.duelcoat": p => [[p.cloth, 0, 1.24, 0, .86, .72, .6], [p.trim, 0, .9, 0, .74, .1, .54], [p.cloth, 0, .64, -.04, .9, .4, .62, "cone", Math.PI], [p.dark(p.cloth), 0, .62, -.3, .7, .5, .06], [p.trim, -.2, 1.24, .31, .06, .7, .02], [p.trim, 0, 1.5, .3, .5, .06, .02], [p.metal, .14, .9, .28, .1, .1, .03]],
  "body.furcoat": p => [[shade(p.metal, .8), 0, 1.18, 0, .96, .86, .68], [0x9a8a78, 0, 1.6, -.02, 1.12, .3, .82], [0x9a8a78, 0, .88, 0, 1.06, .4, .76], [p.cloth, 0, 1.1, .36, .5, .6, .03], [p.leather, 0, .9, 0, 1.0, .1, .74], [p.trim, 0, .9, .38, .16, .14, .03]],
  "body.ronin": p => [[p.cloth, 0, 1.12, 0, .94, .96, .66], [p.trim, 0, .9, 0, 1.0, .16, .72], [p.trim, .24, .78, .36, .1, .3, .03, "box", -.3], [shade(p.cloth, 1.4), 0, 1.4, .33, .1, .5, .03, "box", .55], [shade(p.cloth, 1.4), 0, 1.4, .33, .1, .5, .03, "box", -.55], [p.metal, .56, 1.56, 0, .5, .3, .54], [p.dark(p.metal), .56, 1.44, 0, .52, .06, .56]],
  "body.barkhide": p => [[0x6a4a2a, 0, 1.18, 0, .96, .86, .68], ...[1.0, 1.25, 1.5].map((y, i) => [0x8a6440, (i - 1) * .12, y, .35, .8 - i * .1, .14, .03, "box", (i - 1) * .2] as Part), [p.cloth, 0, .86, 0, 1.0, .14, .72], ...pair([0x5a8a3a, -.56, 1.58, 0, .44, .26, .5, "round"]), [0x7dff9a, .18, 1.2, .37, .07, .07, .02, "round"]],
  "body.bonemail": p => [[p.cloth, 0, 1.16, 0, .98, .9, .7], [p.leather, 0, 1.2, .35, .1, .9, .03, "box", .6], [p.leather, 0, 1.2, .35, .1, .9, .03, "box", -.6], ...pair([0xe8dcc0, -.6, 1.62, 0, .46, .36, .5, "round"]), ...pair([p.ink, -.66, 1.66, .2, .08, .08, .04]), [p.trim, 0, .88, 0, 1.04, .14, .74], [0xe8dcc0, 0, .88, .38, .2, .18, .04]],
  "body.scalemail": p => [[p.metal, 0, 1.22, .02, .9, .8, .66], ...[1.02, 1.22, 1.42].flatMap(y => [-.2, .2].map(x => [shade(p.metal, 1.15), x, y, .35, .26, .12, .02, "box", x * .8] as Part)), [p.cloth, 0, .66, 0, .96, .44, .66, "cone", Math.PI], [p.trim, 0, .9, 0, .82, .1, .62], ...pair([p.metal, -.54, 1.58, 0, .38, .26, .46, "round"])],
  "body.starsilk": p => [[p.cloth, 0, 1.28, 0, .84, .64, .58], [p.cloth, 0, .62, 0, 1.2, 1.0, 1.1, "cone", Math.PI], [p.trim, 0, .94, 0, .76, .08, .56], [p.trim, 0, 1.56, .28, .6, .06, .03], ...[[.24, .7], [-.3, .5], [.1, .3], [-.12, .82]].map(([x, y]) => [0xa9e9ff, x!, y!, .44 - y! * .1, .06, .06, .03, "box", Math.PI / 4] as Part), ...pair([p.trim, -.48, 1.56, 0, .2, .14, .4, "round"])],
  "body.shadowleathers": p => [[p.cloth, 0, 1.24, 0, .84, .72, .58], [p.leather, 0, .92, 0, .78, .2, .56], ...[.86, .94, 1.02].map(y => [p.trim, 0, y, .3, .3, .02, .02] as Part), [p.cloth, 0, .72, 0, .88, .26, .6], [p.trim, 0, 1.52, .3, .5, .05, .02], ...pair([p.leather, -.5, 1.56, 0, .28, .18, .44])],
  "body.gambeson": p => [[p.cloth, 0, 1.18, 0, .92, .84, .64], ...[.95, 1.15, 1.35].map(y => [p.dark(p.cloth), 0, y, .33, .86, .03, .02] as Part), [p.leather, 0, .84, 0, .96, .14, .68], [p.trim, 0, .84, .35, .14, .12, .03]],
  "body.jerkin": p => [[p.cloth, 0, 1.18, 0, .9, .82, .62], [p.leather, 0, 1.16, .03, .94, .7, .64], [p.dark(p.leather), 0, 1.16, .34, .05, .62, .02], [p.leather, 0, .84, 0, .98, .14, .7], [p.trim, 0, .84, .36, .14, .12, .03]],
  "body.chain": p => [[shade(p.metal, .8), 0, 1.18, 0, .94, .86, .66], [p.cloth, 0, 1.08, .34, .6, .96, .04], [p.trim, 0, 1.52, .35, .6, .06, .04], [p.leather, 0, .86, 0, .98, .12, .7]],
  "body.plate": p => [[p.metal, 0, 1.22, .02, .96, .8, .7], [p.trim, 0, 1.22, .38, .06, .64, .02], ...pair([p.metal, -.56, 1.56, 0, .42, .3, .5, "round"]), [p.cloth, 0, .76, .1, .92, .3, .62], [p.leather, 0, .9, 0, 1, .12, .72]],
  "body.rangercoat": p => [[p.cloth, 0, 1.06, 0, .94, 1.06, .66], [p.dark(p.cloth), 0, .66, .02, .98, .3, .68], [p.leather, 0, 1.2, .35, .12, 1, .04, "box", .7], ...[1.4, 1.2, 1.0].map(y => [p.trim, .1 - (y - 1) * .5, y, .37, .07, .08, .03] as Part)],
  "body.gilded": p => [[p.metal, 0, 1.22, .02, .96, .8, .7], [p.trim, 0, 1.22, .38, .62, .05, .02], [p.trim, 0, 1.4, .38, .4, .05, .02], ...pair([p.metal, -.56, 1.56, 0, .44, .32, .52, "round"]), ...pair([p.trim, -.56, 1.5, .1, .46, .06, .5]), [p.cloth, 0, .76, .1, .92, .3, .62], [p.trim, 0, .9, 0, 1, .12, .72]],
  "body.obsidian": () => [[0x1d1b22, 0, 1.22, .02, .96, .8, .7], [0xff8352, 0, 1.22, .38, .04, .6, .02], [0xff8352, -.2, 1.05, .38, .2, .04, .02, "box", .6], ...pair([0x26232c, -.56, 1.58, 0, .46, .34, .54, "round"]), ...pair([0xff8352, -.56, 1.66, .2, .2, .04, .04]), [0x26232c, 0, .76, .1, .92, .3, .62]],
  "body.tunic": p => [[p.cloth, 0, 1.12, 0, .92, .96, .64], [p.trim, 0, 1.5, .33, .44, .08, .02], [p.leather, 0, .9, 0, .96, .1, .68], [p.metal, 0, .9, .35, .12, .1, .03], [p.dark(p.cloth), .3, .72, .3, .1, .3, .03, "box", -.2]],
  "body.brigandine": p => [[p.leather, 0, 1.18, 0, .94, .84, .66], ...[1.02, 1.22, 1.42].flatMap(y => [-.24, 0, .24].map(x => [p.metal, x, y, .34, .06, .06, .02] as Part)), [p.cloth, 0, .76, .04, .9, .24, .62], [p.dark(p.leather), 0, .88, 0, 1, .12, .7], [p.trim, 0, .88, .36, .14, .12, .03]],
  "body.robe": p => [[p.cloth, 0, .9, 0, 1.02, 1.36, .7, "cone"], [p.cloth, 0, 1.3, 0, .9, .6, .62], [p.trim, 0, 1.3, .32, .1, .56, .02], [shade(p.leather, 1.3), 0, .96, 0, .94, .07, .66], [shade(p.leather, 1.3), .16, .78, .34, .05, .3, .03]],
}

const backs: Record<string, Builder> = {
  "back.warcape": p => [[0xa82a2a, 0, 1.06, -.44, .94, 1.3, .08], [0x7a1f1f, 0, .4, -.45, .96, .1, .08], [p.trim, 0, 1.68, -.4, .96, .08, .1], ...pair([0xffe066, -.36, 1.62, .1, .12, .12, .06, "round"])],
  "back.leafcloak": () => [[0x3f6a3a, 0, 1.2, -.44, .9, 1.0, .08], ...[-.3, 0, .3].map((x, i) => [i % 2 ? 0x5a8a3a : 0x4a7a32, x, .64, -.46, .3, .3, .06, "box", Math.PI / 4] as Part), [0x7ab84a, 0, 1.7, -.4, .9, .1, .1]],
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
  const metal = ["body.plate", "body.gilded", "body.obsidian", "body.chain", "body.tabard", "body.scalemail", "body.furcoat"].includes(body)
  const color = body === "body.obsidian" ? 0x26232c : metal ? p.metal : body === "body.jerkin" || body === "body.brigandine" ? p.leather : p.cloth
  return [[color, 0, -.14, 0, .38, .42, .44], [p.dark(color), 0, -.42, .02, .3, .38, .32], [p.leather, 0, -.64, .08, .32, .24, .36]]
}

/** Weapon parts held in the right hand (hand at y -.65, blade pointing up and forward). */
const weapons: Record<string, Builder> = {
  "weapon.kris": p => [[p.leather, 0, -.76, .22, .09, .26, .09], [p.trim, 0, -.6, .22, .3, .07, .1], ...[0, 1, 2, 3].map(i => [p.metal, (i % 2 ? .05 : -.05), -.4 + i * .2, .22, .1, .24, .04, "box", i % 2 ? .25 : -.25] as Part), [p.metal, 0, .42, .22, .09, .14, .04, "cone"]],
  "weapon.rapier": p => [[p.leather, 0, -.78, .22, .08, .28, .08], [p.metal, 0, -.62, .3, .3, .3, .05, "round"], [p.metal, 0, -.62, .22, .3, .05, .05], [0xf1f6fa, 0, .2, .22, .05, 1.5, .04], [0xf1f6fa, 0, .98, .22, .05, .12, .04, "cone"]],
  "weapon.frostaxe": p => [[p.leather, 0, -.3, .22, .1, 1.3, .1], [p.metal, .16, .3, .22, .3, .5, .07], [0xa9e9ff, .34, .3, .23, .08, .56, .05], [0xa9e9ff, .22, .62, .22, .12, .16, .05, "cone"], [p.trim, 0, .06, .22, .14, .08, .14]],
  "weapon.katana": p => [[0x2a1f1f, 0, -.84, .22, .09, .44, .09], [p.trim, 0, -.6, .22, .28, .05, .28, "cylinder"], [0xf1f6fa, 0, -.02, .24, .06, 1.1, .04], [0xf1f6fa, .03, .76, .25, .06, .5, .04, "box", -.12], [0xf1f6fa, .07, 1.06, .26, .05, .12, .04, "cone", -.25]],
  "weapon.thornstaff": p => [[0x6a4a2a, 0, -.1, .22, .1, 2, .1], [0x5a3a1a, .08, .8, .22, .06, .4, .06, "box", -.5], [0x5a8a3a, -.1, .92, .22, .2, .1, .05, "box", .5], [0x7ab84a, .14, 1.0, .22, .16, .08, .05, "box", -.6], [0x7dff9a, 0, 1.06, .22, .14, .14, .14, "round"], [p.trim, 0, -.4, .22, .12, .06, .12, "cylinder"]],
  "weapon.arcstaff": p => [[shade(p.leather, 1.3), 0, -.1, .22, .08, 1.9, .08], ...pair([p.metal, -.12, 1.0, .22, .05, .3, .05, "box", -.4]), [0xbca1ff, 0, 1.1, .22, .22, .22, .22, "round"], [0xd8a7ff, 0, 1.1, .22, .12, .12, .12, "round"], [p.trim, 0, .82, .22, .14, .08, .14, "cylinder"]],
  "weapon.cleaver": p => [[0xe8dcc0, 0, -.6, .22, .12, .6, .12], [p.leather, 0, -.3, .22, .16, .1, .16], [p.metal, .14, .3, .22, .46, 1.0, .06], [0xf1f6fa, .38, .3, .23, .04, .96, .04], [0x2a2a2e, .2, .66, .22, .12, .12, .07, "round"], [p.dark(p.metal), .08, .82, .22, .3, .08, .06]],
  "weapon.emberwand": p => [[0x3a2418, 0, -.6, .22, .08, .7, .08], [p.trim, 0, -.24, .22, .14, .1, .14, "cylinder"], [0xff6b3d, 0, -.02, .22, .2, .26, .2, "cone"], [0xffe066, 0, -.04, .23, .1, .16, .1, "cone"], [0xffa040, 0, .2, .22, .1, .14, .1, "cone"]],
  "weapon.dragonlance": p => [[p.leather, 0, -.1, .22, .07, 2, .07], [p.trim, 0, .86, .22, .2, .22, .2, "round"], [p.trim, 0, .9, .34, .1, .1, .14], [p.metal, 0, 1.22, .22, .12, .5, .05, "cone"], [0xc8302a, .08, .7, .24, .08, .3, .04], [0xffcf4a, 0, .92, .4, .05, .04, .02]],
  "weapon.wingblade": p => [[p.leather, 0, -.78, .22, .08, .28, .08], [0xf4f4f0, .12, -.6, .22, .3, .1, .05, "box", .4], [0x2ab0b8, -.12, -.6, .22, .3, .1, .05, "box", -.4], [0xf1f6fa, .02, -.06, .22, .12, .9, .04, "box", -.08], [0xf1f6fa, .1, .5, .22, .1, .3, .04, "box", -.3]],
  "weapon.moonglaive": p => [[p.metal, 0, -.1, .22, .07, 2, .07], [p.trim, 0, .86, .22, .14, .1, .14, "cylinder"], [0x9ff5fa, .16, 1.12, .22, .08, .5, .05, "box", -.6], [0x9ff5fa, .3, .9, .22, .08, .3, .05, "box", .2], [0xb7f0ff, .02, 1.3, .22, .08, .22, .05, "box", -1.1], [p.trim, 0, -.9, .22, .12, .12, .12, "round"]],
  "weapon.twinfang": p => [[p.leather, 0, -.74, .22, .08, .24, .08], [p.trim, 0, -.6, .22, .32, .06, .08, "box", .2], [p.metal, .04, -.24, .22, .12, .6, .04, "box", -.15], [0xff4a5a, .1, -.24, .23, .03, .56, .03, "box", -.15], [p.metal, .14, .12, .22, .1, .2, .04, "cone", -.4]],
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
  "offhand.lionshield": p => [[p.trim, 0, -.42, .31, .7, .66, .06], [p.cloth, 0, -.4, .35, .6, .56, .04], [p.cloth, 0, -.84, .33, .38, .34, .05, "cone", Math.PI], [0xffe066, 0, -.38, .38, .24, .26, .03, "round"], [p.trim, 0, -.24, .39, .2, .06, .02]],
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
  const archetype = archetypeFor(loadout.hero)
  const p = palette(loadout.dye, archetype.skin, archetype.hair)
  const closed = closedHelms.has(loadout.head)
  const head: Part[] = closed ? [] : [[p.skin, 0, 2.02, 0, .76, .72, .7]]
  const neck: Part = [p.skin, 0, 1.66, 0, .3, .14, .3]
  const hair = openHeads.has(loadout.head) ? archetype.hairParts(p) : []
  const body = [neck, ...pick(torso, loadout.body, "body.gambeson")(p), ...head, ...hair, ...pick(heads, loadout.head, "head.squire")(p), ...pick(faces, loadout.face, "face.steady")(p, closed ? .47 : .37), ...pick(backs, loadout.back, "back.none")(p), ...archetype.signature(p)]
  const leg = pick(legs, loadout.legs, "legs.boots")(p)
  const arm = [...sleeve(p, loadout.body), ...pick(offhands, loadout.offhand, "offhand.buckler")(p)]
  const weapon = [...sleeve(p, loadout.body), ...pick(weapons, loadout.weapon, "weapon.arming")(p)]
  return { body: body.map(toPrimitiveScale), leg: leg.map(toPrimitiveScale), arm: arm.map(toPrimitiveScale), weapon: weapon.map(toPrimitiveScale), scale: 1 }
}
