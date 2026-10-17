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
  { id: "hero", label: "Hero" },
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
  item("hero", "warden", "Aldric the Lionheart", "starter", "Human knight. Royal blue tabard, gold lion shield, square stance."),
  item("hero", "rogue", "Kestrel Blackfeather", "starter", "Human cutpurse. Crimson scarf, wavy kris, never stands still."),
  item("hero", "duelist", "Lyra Vale", "starter", "Elf duelist. Platinum braid, forest-green coat, a swift rapier."),
  item("hero", "brute", "Brann Ironhide", "rare", "Dwarf berserker. Great red braided beard and a forge hammer."),
  item("hero", "frostborn", "Ragnar Frostborn", "rare", "Northman raider. Wolf-pelt hood, ice-white beard, a frost axe."),
  item("hero", "ronin", "Kenji Ashblade", "rare", "Wandering swordsman. Black topknot, red sash, a long katana."),
  item("hero", "sylvan", "Thorne Oakheart", "rare", "Sylvan druid. Bark skin, antlers, moss beard and a thorn staff."),
  item("hero", "mage", "Morwen the Grey", "epic", "Battle mage. Silver hair, violet robes, a bound wisp; she hovers."),
  item("hero", "orc", "Grukk Tuskborn", "epic", "Orc warchief. Green hide, tusks, black mohawk and a bone cleaver."),
  item("hero", "pyromancer", "Kaela Emberheart", "epic", "Fire sorceress. Living flame hair and an ember wand."),
  item("hero", "dragonkin", "Saffi Sunscale", "epic", "Dragonkin lancer. Golden scales, swept horns and a tail."),
  item("hero", "avian", "Mira Featherfall", "epic", "Avian skydancer. Teal feather crest and wide wings."),
  item("hero", "lunarian", "Selene Moonveil", "legendary", "Lunarian priestess. Pale moon skin, crescent halo, moon glaive."),
  item("hero", "darkelf", "Vesper Nightshade", "legendary", "Dark elf assassin. Dusk skin, white ponytail, red eyes, twin fangs."),
  item("hero", "leonin", "Rhaz Sunmane", "legendary", "Leonin champion. Lion mane, golden plate and a greatsword."),

  item("head", "none", "Own Hair", "starter", "The hero's own hair and features, nothing over them."),
  item("head", "squire", "Squire Cap", "starter", "Padded cloth cap."),
  item("head", "shadowhood", "Shadow Hood", "starter", "Deep black hood with a crimson lining."),
  item("head", "wolfpelt", "Wolf Pelt", "rare", "A wolf's head worn as a hood."),
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
  item("face", "lashes", "Bright Eyes", "starter", "Lashes and rose lips."),
  item("face", "moonlit", "Moonlit Eyes", "legendary", "Glowing pale eyes and silver lips."),
  item("face", "warpaint", "War Paint", "epic", "Red stripes under a heavy brow."),
  item("face", "redeyes", "Crimson Gaze", "legendary", "Burning red eyes, dark lips."),
  item("face", "slit", "Dragon Eyes", "epic", "Golden slit eyes and scaled cheeks."),
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
  item("body", "tabard", "Lion Tabard", "starter", "Steel plate under a tabard with a gold lion."),
  item("body", "duelcoat", "Duelist Coat", "starter", "Fitted coat with flared tails and a gold sash."),
  item("body", "furcoat", "Northern Furs", "rare", "Heavy fur coat over mail."),
  item("body", "ronin", "Ronin Garb", "rare", "Wide-sleeved robe, one armored shoulder, red sash."),
  item("body", "barkhide", "Barkhide", "rare", "Living bark plates bound with vines."),
  item("body", "bonemail", "Bone Mail", "epic", "Hide harness with skull pauldrons."),
  item("body", "scalemail", "Dragon Scale", "epic", "Overlapping scales with a plated skirt."),
  item("body", "starsilk", "Starsilk Gown", "legendary", "Midnight gown with silver stars."),
  item("body", "shadowleathers", "Shadow Leathers", "legendary", "Fitted leathers laced at the waist."),
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
  item("back", "warcape", "Royal Cape", "starter", "Crimson cape with a gold clasp."),
  item("back", "leafcloak", "Leaf Cloak", "starter", "Cloak of layered leaves."),
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
  item("weapon", "kris", "Kris", "starter", "Wavy-bladed knife."),
  item("weapon", "rapier", "Rapier", "starter", "Thin blade with a swept gold guard."),
  item("weapon", "frostaxe", "Frost Axe", "rare", "Bearded axe with an ice edge."),
  item("weapon", "katana", "Katana", "rare", "Long curved blade, wrapped grip."),
  item("weapon", "thornstaff", "Thorn Staff", "rare", "Gnarled staff sprouting leaves."),
  item("weapon", "arcstaff", "Arcane Staff", "epic", "Staff cradling a violet orb."),
  item("weapon", "cleaver", "Bone Cleaver", "epic", "Huge notched blade on a bone handle."),
  item("weapon", "emberwand", "Ember Wand", "epic", "Short wand holding a living flame."),
  item("weapon", "dragonlance", "Dragon Lance", "epic", "Gold dragon-head spear with a red tassel."),
  item("weapon", "wingblade", "Wing Blade", "epic", "Curved sabre with a feather guard."),
  item("weapon", "moonglaive", "Moon Glaive", "legendary", "Pole with a glowing crescent blade."),
  item("weapon", "twinfang", "Twin Fang", "legendary", "Curved dagger with a red-lit edge."),
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
  item("offhand", "lionshield", "Lion Shield", "starter", "Blue heater shield with a gold lion."),
  item("offhand", "torch", "Torch", "starter", "Lights the way."),
  item("offhand", "dagger", "Parrying Dagger", "starter", "Held point-down."),
  item("offhand", "roundshield", "Round Shield", "starter", "Planked wood with a steel boss."),
  item("offhand", "heater", "Heater Shield", "common", "Classic knight's shield."),
  item("offhand", "kite", "Kite Shield", "rare", "Long tapered shield."),
  item("offhand", "tower", "Tower Shield", "epic", "Tall rectangular shield."),

  item("dye", "keep", "Keep Blue", "starter", "Blue cloth, steel trim."),
  item("dye", "lionheart", "Lionheart", "starter", "Royal blue, gold trim."),
  item("dye", "bloodmoon", "Blood Moon", "starter", "Charcoal, crimson trim."),
  item("dye", "sylvan", "Sylvan", "starter", "Forest green, ivory and gold."),
  item("dye", "forgefire", "Forgefire", "rare", "Rust red, bronze trim."),
  item("dye", "glacier", "Glacier", "rare", "Ice blue, frost white."),
  item("dye", "ashen", "Ashen", "rare", "Black, blood-red trim."),
  item("dye", "grove", "Grove", "rare", "Moss green, sap gold."),
  item("dye", "amethyst", "Amethyst", "epic", "Violet, silver trim."),
  item("dye", "warband", "Warband", "epic", "Hide brown, bone trim."),
  item("dye", "cinder", "Cinder", "epic", "Flame red, ember gold."),
  item("dye", "sunscale", "Sunscale", "epic", "Crimson, sun gold."),
  item("dye", "skyfeather", "Skyfeather", "epic", "Sky teal, cloud white."),
  item("dye", "lunar", "Lunar", "legendary", "Midnight, moon silver."),
  item("dye", "nightshade", "Nightshade", "legendary", "Deep violet, magenta trim."),
  item("dye", "pride", "Pride", "legendary", "Royal red, lion gold."),
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

export type HeroGender = "male" | "female"
export interface HeroDetail { race: string; gender: HeroGender }

/** Race and gender shown in the Armory; every hero is clearly one or the other. */
export const heroDetails: Readonly<Record<string, HeroDetail>> = {
  "hero.warden": { race: "Human", gender: "male" }, "hero.rogue": { race: "Human", gender: "male" }, "hero.duelist": { race: "Elf", gender: "female" },
  "hero.brute": { race: "Dwarf", gender: "male" }, "hero.frostborn": { race: "Northman", gender: "male" }, "hero.ronin": { race: "Human", gender: "male" },
  "hero.sylvan": { race: "Sylvan", gender: "male" }, "hero.mage": { race: "Human", gender: "female" }, "hero.orc": { race: "Orc", gender: "male" },
  "hero.pyromancer": { race: "Human", gender: "female" }, "hero.dragonkin": { race: "Dragonkin", gender: "female" }, "hero.avian": { race: "Avian", gender: "female" },
  "hero.lunarian": { race: "Lunarian", gender: "female" }, "hero.darkelf": { race: "Dark Elf", gender: "female" }, "hero.leonin": { race: "Leonin", gender: "male" },
}

type Kit = Readonly<Record<Exclude<HeroSlot, "hero">, string>>
const kit = (head: string, face: string, body: string, legs: string, back: string, weapon: string, offhand: string, dye: string): Kit =>
  ({ head: `head.${head}`, face: `face.${face}`, body: `body.${body}`, legs: `legs.${legs}`, back: `back.${back}`, weapon: `weapon.${weapon}`, offhand: `offhand.${offhand}`, dye: `dye.${dye}` })

/**
 * Each hero's signature outfit: what they wear when first chosen, and what buying them unlocks.
 * Free heroes use only starter items. Players can restyle any hero; each keeps its own look.
 */
export const heroKits: Readonly<Record<string, Kit>> = {
  "hero.warden": kit("none", "stern", "tabard", "greaves", "warcape", "arming", "lionshield", "lionheart"),
  "hero.rogue": kit("shadowhood", "scar", "jerkin", "wraps", "scabbard", "kris", "dagger", "bloodmoon"),
  "hero.duelist": kit("none", "lashes", "duelcoat", "highboots", "leafcloak", "rapier", "bare", "sylvan"),
  "hero.brute": kit("horned", "beard", "plate", "plate", "none", "hammer", "roundshield", "forgefire"),
  "hero.frostborn": kit("wolfpelt", "beard", "furcoat", "chain", "none", "frostaxe", "roundshield", "glacier"),
  "hero.ronin": kit("none", "stubble", "ronin", "wraps", "scabbard", "katana", "bare", "ashen"),
  "hero.sylvan": kit("none", "steady", "barkhide", "wraps", "leafcloak", "thornstaff", "bare", "grove"),
  "hero.mage": kit("none", "lashes", "robe", "wraps", "longcape", "arcstaff", "bare", "amethyst"),
  "hero.orc": kit("none", "warpaint", "bonemail", "wraps", "none", "cleaver", "bare", "warband"),
  "hero.pyromancer": kit("none", "lashes", "robe", "wraps", "none", "emberwand", "bare", "cinder"),
  "hero.dragonkin": kit("none", "slit", "scalemail", "spurred", "none", "dragonlance", "bare", "sunscale"),
  "hero.avian": kit("none", "lashes", "tunic", "wraps", "none", "wingblade", "bare", "skyfeather"),
  "hero.lunarian": kit("none", "moonlit", "starsilk", "highboots", "none", "moonglaive", "bare", "lunar"),
  "hero.darkelf": kit("none", "redeyes", "shadowleathers", "highboots", "none", "twinfang", "dagger", "nightshade"),
  "hero.leonin": kit("none", "stern", "gilded", "plate", "cape", "greatsword", "bare", "pride"),
}

/** The full look a hero wears before the player restyles it. */
export const kitLoadout = (heroId: string): Readonly<Record<HeroSlot, string>> => ({ hero: heroId, ...(heroKits[heroId] ?? heroKits["hero.warden"]!) })

/** What a brand-new profile wears. Every id here must be a starter item. */
export const defaultLoadout: Readonly<Record<HeroSlot, string>> = kitLoadout("hero.warden")

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
  "dye.lionheart": { cloth: 0x24479a, trim: 0xe8b84a, metal: 0xc4ccd6, leather: 0x5a3a24 },
  "dye.bloodmoon": { cloth: 0x2b2a33, trim: 0xc8323a, metal: 0x9aa0a8, leather: 0x3a2622 },
  "dye.sylvan": { cloth: 0x2f6b45, trim: 0xf0e3c0, metal: 0xe0b85a, leather: 0x6a4428 },
  "dye.forgefire": { cloth: 0x8e3b22, trim: 0xe0a040, metal: 0x8c8f94, leather: 0x4a2e1e },
  "dye.glacier": { cloth: 0x3a6a8e, trim: 0xe8f4ff, metal: 0xb8d0e0, leather: 0x5a4030, glow: 0xa9e9ff },
  "dye.ashen": { cloth: 0x1f1f24, trim: 0xc0302a, metal: 0xd0d4d8, leather: 0x3a2a20 },
  "dye.grove": { cloth: 0x4a6a2a, trim: 0xd0b050, metal: 0x8a7a5a, leather: 0x5a3a22, glow: 0x7dff9a },
  "dye.amethyst": { cloth: 0x5b3a8a, trim: 0xd8d8ee, metal: 0xb4b2c8, leather: 0x3a2a3a, glow: 0xbca1ff },
  "dye.warband": { cloth: 0x5a3a22, trim: 0xd8c8a0, metal: 0x707070, leather: 0x3a2a1a },
  "dye.cinder": { cloth: 0xa8321e, trim: 0xffb040, metal: 0xc89040, leather: 0x4a2418, glow: 0xff8a3d },
  "dye.sunscale": { cloth: 0x8a2a2a, trim: 0xffcc55, metal: 0xd8a64a, leather: 0x4a2a1a },
  "dye.skyfeather": { cloth: 0x2a8aa8, trim: 0xf4f4f0, metal: 0xc0d8e0, leather: 0x6a4a2a },
  "dye.lunar": { cloth: 0x262c5e, trim: 0xe4ecff, metal: 0xc8d4f0, leather: 0x3a3a5a, glow: 0x9ff5fa },
  "dye.nightshade": { cloth: 0x2a1f3a, trim: 0xd03a7a, metal: 0xa8a8c8, leather: 0x1f1a26, glow: 0xff4a5a },
  "dye.pride": { cloth: 0x7a1f1f, trim: 0xf0c050, metal: 0xd8b860, leather: 0x4a2a18 },
}

export function cosmeticById(id: string): CosmeticItem | undefined {
  return cosmetics.find(entry => entry.id === id)
}
