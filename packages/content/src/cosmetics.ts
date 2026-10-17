/** Hero customization catalog. Pure data: geometry lives in the renderer, rules in game-rules. */
import type { HeroSlot } from "../../contracts/src/survival"

export type { HeroSlot }
export type Rarity = "starter" | "common" | "rare" | "epic" | "legendary"

export interface CosmeticItem {
  id: string
  slot: HeroSlot
  name: string
  rarity: Rarity
  /** Coin price; 0 means owned from the start. */
  price: number
  /** One plain sentence about the look. */
  note: string
}

export const heroSlots: readonly { id: HeroSlot; label: string }[] = [
  { id: "head", label: "Head" },
  { id: "face", label: "Face" },
  { id: "body", label: "Armor" },
  { id: "legs", label: "Legs" },
  { id: "back", label: "Back" },
  { id: "weapon", label: "Weapon" },
  { id: "offhand", label: "Off-hand" },
  { id: "dye", label: "Colors" },
]

/** Prices per tier, grindy by design: a common takes ~4-10 runs, a legendary 50+ long runs (see economy.coinTuning). */
export const rarityPrice: Record<Rarity, number> = { starter: 0, common: 3600, rare: 12000, epic: 24000, legendary: 48000 }

const item = (slot: HeroSlot, id: string, name: string, rarity: Rarity, note: string): CosmeticItem =>
  ({ id: `${slot}.${id}`, slot, name, rarity, price: rarityPrice[rarity], note })

export const cosmetics: readonly CosmeticItem[] = [
  item("head", "squire", "Squire Cap", "starter", "Padded cloth cap."),
  item("head", "bare", "Bare Head", "starter", "Short hair, no helmet."),
  item("head", "bandana", "Bandana", "starter", "Knotted cloth over the hair."),
  item("head", "coif", "Mail Coif", "starter", "Chainmail hood, face open."),
  item("head", "longhair", "Long Hair", "starter", "Tied at the neck."),
  item("head", "circlet", "Iron Circlet", "starter", "A plain band with one stone."),
  item("head", "kettle", "Kettle Helm", "common", "Wide steel brim."),
  item("head", "cowl", "Hooded Cowl", "common", "Deep wool hood."),
  item("head", "great", "Great Helm", "rare", "Closed bucket helm with a breathing grille."),
  item("head", "horned", "Horned Helm", "rare", "Iron cap with two curved horns."),
  item("head", "ranger", "Ranger Hood", "rare", "Pointed hood with a leaf clasp."),
  item("head", "winged", "Winged Helm", "epic", "Polished helm with swept wings."),
  item("head", "dragon", "Dragon Helm", "epic", "Snouted helm with ridged crest."),
  item("head", "crown", "Crown of the Keep", "legendary", "Gold circlet over a full helm."),

  item("face", "steady", "Steady", "starter", "Calm eyes."),
  item("face", "scar", "Scarred", "starter", "A scar across one eye."),
  item("face", "stern", "Stern", "starter", "Heavy brows, set jaw."),
  item("face", "stubble", "Stubble", "starter", "A week on the road."),
  item("face", "eyepatch", "Eyepatch", "starter", "One eye covered."),
  item("face", "mustache", "Mustache", "starter", "Waxed at the tips."),
  item("face", "beard", "Braided Beard", "common", "Two braids under the chin."),
  item("face", "mask", "Cloth Mask", "common", "Covers nose and mouth."),
  item("face", "visor", "Glowing Visor", "rare", "Two lit eye slits."),
  item("face", "skull", "Bone Mask", "epic", "Carved skull faceplate."),
  item("face", "ember", "Ember Eyes", "legendary", "Burning eyes that leave a glow."),

  item("body", "gambeson", "Padded Gambeson", "starter", "Quilted cloth coat."),
  item("body", "jerkin", "Leather Jerkin", "starter", "Belted leather vest."),
  item("body", "tunic", "Belted Tunic", "starter", "Wool tunic with a buckle."),
  item("body", "brigandine", "Brigandine", "starter", "Leather coat with rivets."),
  item("body", "robe", "Apprentice Robe", "starter", "Long robe, rope belt."),
  item("body", "chain", "Chainmail", "common", "Mail shirt under a tabard."),
  item("body", "plate", "Plate Cuirass", "rare", "Breastplate with pauldrons."),
  item("body", "rangercoat", "Ranger Coat", "rare", "Long coat with a bandolier."),
  item("body", "gilded", "Gilded Plate", "epic", "Engraved plate with gold trim."),
  item("body", "obsidian", "Obsidian Plate", "legendary", "Black plate with ember seams."),

  item("legs", "boots", "Trousers & Boots", "starter", "Plain trousers, tall boots."),
  item("legs", "greaves", "Leather Greaves", "starter", "Strapped shin guards."),
  item("legs", "wraps", "Leg Wraps", "starter", "Cloth bands over soft shoes."),
  item("legs", "highboots", "High Boots", "starter", "Cuffed riding boots."),
  item("legs", "chain", "Chain Leggings", "common", "Mail to the knee."),
  item("legs", "plate", "Plate Greaves", "rare", "Full steel legs."),
  item("legs", "spurred", "Spurred Sabatons", "epic", "Pointed steel boots with spurs."),

  item("back", "none", "Nothing", "starter", "Travel light."),
  item("back", "satchel", "Satchel", "starter", "Small leather bag."),
  item("back", "bedroll", "Bedroll", "starter", "Blanket strapped across the shoulders."),
  item("back", "scabbard", "Scabbard", "starter", "A spare blade on the back."),
  item("back", "lantern", "Hip Lantern", "starter", "A small lit lantern."),
  item("back", "cape", "Short Cape", "common", "Shoulder-length cape."),
  item("back", "longcape", "Long Cape", "rare", "Cape to the heels."),
  item("back", "quiver", "Quiver", "rare", "Arrows over the shoulder."),
  item("back", "banner", "Banner Pole", "epic", "A house banner on the back."),
  item("back", "mantle", "Phoenix Mantle", "legendary", "Feathered mantle of flame."),

  item("weapon", "arming", "Arming Sword", "starter", "Straight one-handed blade."),
  item("weapon", "axe", "Hand Axe", "starter", "Short bearded axe."),
  item("weapon", "shortsword", "Shortsword", "starter", "Short blade, wide guard."),
  item("weapon", "club", "Iron-bound Club", "starter", "Oak with two iron rings."),
  item("weapon", "falchion", "Falchion", "starter", "Single edge, heavy tip."),
  item("weapon", "staff", "Quarterstaff", "starter", "Ash pole with brass caps."),
  item("weapon", "spear", "Spear", "common", "Leaf-blade spear."),
  item("weapon", "mace", "Flanged Mace", "common", "Steel head with flanges."),
  item("weapon", "greatsword", "Greatsword", "rare", "Long two-handed blade."),
  item("weapon", "hammer", "War Hammer", "rare", "Heavy square head."),
  item("weapon", "rune", "Runeblade", "epic", "Blade with glowing runes."),
  item("weapon", "crescent", "Crescent Axe", "epic", "Wide moon-shaped head."),
  item("weapon", "sunfire", "Sunfire Blade", "legendary", "A blade of white-gold fire."),

  item("offhand", "bare", "Bare Hand", "starter", "Gloved fist."),
  item("offhand", "buckler", "Wooden Buckler", "starter", "Small round shield."),
  item("offhand", "torch", "Torch", "starter", "Lights the way."),
  item("offhand", "dagger", "Parrying Dagger", "starter", "Held point-down."),
  item("offhand", "roundshield", "Round Shield", "starter", "Planked wood with a steel boss."),
  item("offhand", "heater", "Heater Shield", "common", "Classic knight's shield."),
  item("offhand", "kite", "Kite Shield", "rare", "Long tapered shield."),
  item("offhand", "tower", "Tower Shield", "epic", "Tall rectangular shield."),

  item("dye", "keep", "Keep Blue", "starter", "Blue cloth, steel trim."),
  item("dye", "ash", "Ash Grey", "starter", "Grey cloth, iron trim."),
  item("dye", "ochre", "Ochre", "starter", "Yellow-brown cloth, brass trim."),
  item("dye", "teal", "Teal", "starter", "Blue-green cloth, steel trim."),
  item("dye", "rust", "Rust", "starter", "Brick red cloth, iron trim."),
  item("dye", "slate", "Slate", "starter", "Blue-grey cloth, pewter trim."),
  item("dye", "crimson", "Crimson", "common", "Red cloth, brass trim."),
  item("dye", "forest", "Forest", "common", "Green cloth, bronze trim."),
  item("dye", "royal", "Royal Purple", "rare", "Purple cloth, gold trim."),
  item("dye", "midnight", "Midnight", "rare", "Navy cloth, silver trim."),
  item("dye", "ivory", "Ivory & Gold", "epic", "White cloth, gold trim."),
  item("dye", "obsidian", "Obsidian & Ember", "legendary", "Black cloth, ember trim."),
]

/** What a brand-new profile wears. Every id here must be a starter item. */
export const defaultLoadout: Readonly<Record<HeroSlot, string>> = {
  head: "head.squire", face: "face.steady", body: "body.gambeson", legs: "legs.boots",
  back: "back.none", weapon: "weapon.arming", offhand: "offhand.buckler", dye: "dye.keep",
}

/** Dye palettes: cloth (primary), trim (secondary), metal and leather tones. */
export const dyePalettes: Record<string, { cloth: number; trim: number; metal: number; leather: number; glow?: number }> = {
  "dye.keep": { cloth: 0x3f6fa8, trim: 0xb7c3cc, metal: 0x9fb0bd, leather: 0x5a3f2e },
  "dye.ash": { cloth: 0x6b6f75, trim: 0x8a8f96, metal: 0x7d858c, leather: 0x4a3a30 },
  "dye.ochre": { cloth: 0xa8822f, trim: 0xc9a050, metal: 0x9a9c98, leather: 0x553a24 },
  "dye.teal": { cloth: 0x2f7a78, trim: 0xb7c3cc, metal: 0x96a6ad, leather: 0x4a3626 },
  "dye.rust": { cloth: 0x8e4a2c, trim: 0x8a8f96, metal: 0x8f9396, leather: 0x4a3024 },
  "dye.slate": { cloth: 0x4c5d70, trim: 0xa9b0b8, metal: 0x8d98a3, leather: 0x40342c },
  "dye.crimson": { cloth: 0x9c3030, trim: 0xc9a050, metal: 0xa3a7ab, leather: 0x4e3226 },
  "dye.forest": { cloth: 0x3f6a3a, trim: 0xa98042, metal: 0x8f9a8c, leather: 0x4f3b25 },
  "dye.royal": { cloth: 0x5b3a8a, trim: 0xe0b85a, metal: 0xb4b2c0, leather: 0x47302c },
  "dye.midnight": { cloth: 0x22304f, trim: 0xc8d2dc, metal: 0x8e9cb0, leather: 0x352a28 },
  "dye.ivory": { cloth: 0xe6e0cf, trim: 0xe0b85a, metal: 0xd4d0c4, leather: 0x6a4a32 },
  "dye.obsidian": { cloth: 0x1d1b22, trim: 0xff8a3d, metal: 0x3a3842, leather: 0x2a2024, glow: 0xff8a3d },
}

export function cosmeticById(id: string): CosmeticItem | undefined {
  return cosmetics.find(entry => entry.id === id)
}
