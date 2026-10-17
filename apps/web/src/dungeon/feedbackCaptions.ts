import type { DungeonEffect } from "@typecade/contracts"

/** Icon keys the caption renderer knows; "coin" is the pixel coin, the rest are Glyph paths. */
export type CaptionIcon = "coin" | "heart" | "mana" | "shield" | "gem" | "skull" | "crown"
export interface Caption { icon: CaptionIcon; text: string; tone: string }

/** Hero-side events worth a caption. Enemy-side pops stay in VFX so they never cover enemy words. */
const captioned = new Set<DungeonEffect["kind"]>(["gold", "treasure", "heal", "mana", "shield", "block", "level", "upgrade", "finisher", "barrier"])

const signed = (value: number) => `${value > 0 ? "+" : ""}${Math.round(value * 10) / 10}`

/** Icon + a number or one or two words. Nothing longer: the event is already visible in the world. */
export function captionFor(effect: DungeonEffect): Caption | null {
  if (effect.kind === "hit") return effect.value < 0 ? { icon: "heart", text: signed(effect.value), tone: "hurt" } : null
  if (!captioned.has(effect.kind)) return null
  switch (effect.kind) {
    case "gold": return { icon: "coin", text: signed(effect.value), tone: "gold" }
    case "treasure": return { icon: "coin", text: "+25", tone: "gold" }
    case "heal": return effect.value ? { icon: "heart", text: signed(effect.value), tone: "heal" } : { icon: "heart", text: "FULL", tone: "heal" }
    case "mana": return effect.value ? { icon: "mana", text: signed(effect.value), tone: "mana" } : { icon: "mana", text: "FULL", tone: "mana" }
    case "shield": return { icon: "shield", text: signed(effect.value), tone: "shield" }
    case "block": return { icon: "shield", text: effect.value ? `${effect.value}` : "PARRY", tone: "shield" }
    case "barrier": return { icon: "shield", text: effect.value === 0 ? "BROKEN" : "-1", tone: "hurt" }
    case "level": return { icon: "crown", text: `LV ${effect.value}`, tone: "level" }
    case "upgrade": return { icon: "gem", text: `RANK ${effect.value}`, tone: "level" }
    case "finisher": return { icon: "skull", text: "FATALITY", tone: "finisher" }
    default: return null
  }
}
