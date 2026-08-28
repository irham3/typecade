import type { FishSpecies, FishingSkill, Rarity, RouteNode, ZoneId } from "@typecade/contracts"

export interface FishCatalogEntry {
	id: string
	name: string
	rarity: Rarity
	spritePath: string
	landmark: string
}

export const languagePacks = {
	id: {
		id: "id",
		label: "Indonesian",
		passages: [
			"ombak pagi membawa ikan kecil ke karang",
			"arus tenang menyimpan kilau mutiara",
			"perahu kayu meluncur di laut biru",
			"umpan harum turun perlahan ke pasir",
			"karang merah menjaga jalur nelayan",
			"ikan bulan menari dekat cahaya",
			"tali pancing bergetar saat kail bergerak",
			"kapten sabar membaca arah angin",
			"buih putih pecah di sisi perahu",
			"mata kail menangkap bayang di air",
			"pasang naik membuka rute baru",
			"laguna dangkal penuh rahasia asin",
			"ikan besar menekan tali dengan kuat",
			"jaga ritme ketik dan tarik napas",
			"cahaya emas muncul dari bawah ombak",
		],
	},
} as const

export const fishSpecies: FishSpecies[] = [
	{
		id: "reef_minnow",
		name: "Pebble Goby",
		rarity: "common",
		habitat: "zone_1",
		behavior: "calm",
		typingProfile: "short_steady",
		baseSizeKg: 1.2,
		baseDifficulty: 0.75,
		baseTimeMs: 46000,
		progressPerWord: 0.16,
		tensionOnTypo: 7,
		durabilityOnTypo: 3,
		idlePressurePerSecond: 0.35,
		assetKey: "fish_pebble_goby",
		lore: "A shovel-headed goby that combs warm reef stones for tiny pearls.",
		reward: { coins: 18, materials: 1, xp: 8 },
	},
	{
		id: "kelp_darter",
		name: "Kelp Darter",
		rarity: "common",
		habitat: "zone_1",
		behavior: "darting",
		typingProfile: "short_burst",
		baseSizeKg: 1.6,
		baseDifficulty: 0.9,
		baseTimeMs: 43000,
		progressPerWord: 0.145,
		tensionOnTypo: 8,
		durabilityOnTypo: 4,
		idlePressurePerSecond: 0.55,
		assetKey: "fish_kelp_darter",
		lore: "It darts between kelp ribbons and vanishes whenever the line slackens.",
		reward: { coins: 22, materials: 1, xp: 10 },
	},
	{
		id: "sunny_guppy",
		name: "Sunny Guppy",
		rarity: "common",
		habitat: "zone_1",
		behavior: "calm",
		typingProfile: "short_steady",
		baseSizeKg: 0.9,
		baseDifficulty: 0.7,
		baseTimeMs: 44000,
		progressPerWord: 0.17,
		tensionOnTypo: 6,
		durabilityOnTypo: 3,
		idlePressurePerSecond: 0.3,
		assetKey: "fish_sunny_guppy",
		lore: "A gold-flecked guppy that loves sunlit shallows.",
		reward: { coins: 16, materials: 1, xp: 8 },
	},
	{
		id: "shellback_puffer",
		name: "Shellback Puffer",
		rarity: "common",
		habitat: "zone_2",
		behavior: "armored",
		typingProfile: "long_words",
		baseSizeKg: 3.4,
		baseDifficulty: 1.05,
		baseTimeMs: 54000,
		progressPerWord: 0.12,
		tensionOnTypo: 9,
		durabilityOnTypo: 4,
		idlePressurePerSecond: 0.45,
		assetKey: "fish_shellback_puffer",
		lore: "Its plated hide makes every reel feel heavier than expected.",
		reward: { coins: 28, materials: 2, xp: 14 },
	},
	{
		id: "tide_skipper",
		name: "Tide Skipper",
		rarity: "common",
		habitat: "zone_2",
		behavior: "swarm",
		typingProfile: "many_short",
		baseSizeKg: 1.8,
		baseDifficulty: 1,
		baseTimeMs: 48000,
		progressPerWord: 0.135,
		tensionOnTypo: 8,
		durabilityOnTypo: 4,
		idlePressurePerSecond: 0.6,
		assetKey: "fish_tide_skipper",
		lore: "A restless school fish that turns one bite into three shadows.",
		reward: { coins: 26, materials: 2, xp: 13 },
	},
	{
		id: "coral_fry",
		name: "Coral Fry",
		rarity: "common",
		habitat: "zone_2",
		behavior: "tricky",
		typingProfile: "tricky_pairs",
		baseSizeKg: 2.1,
		baseDifficulty: 1.08,
		baseTimeMs: 50000,
		progressPerWord: 0.13,
		tensionOnTypo: 10,
		durabilityOnTypo: 4,
		idlePressurePerSecond: 0.52,
		assetKey: "fish_coral_fry",
		lore: "Its coral-red flashes make similar words feel just a little slippery.",
		reward: { coins: 30, materials: 2, xp: 15 },
	},
	{
		id: "moonfin_snapper",
		name: "Moonfin Snapper",
		rarity: "rare",
		habitat: "zone_3",
		behavior: "tricky",
		typingProfile: "tricky_pairs",
		baseSizeKg: 8.6,
		baseDifficulty: 1.35,
		baseTimeMs: 58000,
		progressPerWord: 0.105,
		tensionOnTypo: 12,
		durabilityOnTypo: 5,
		idlePressurePerSecond: 0.72,
		assetKey: "fish_moonfin_snapper",
		lore: "Active at night when the moon pulls on forgotten tides.",
		reward: { coins: 76, materials: 5, xp: 34 },
	},
	{
		id: "glass_eel",
		name: "Glass Eel",
		rarity: "uncommon",
		habitat: "zone_3",
		behavior: "darting",
		typingProfile: "medium_burst",
		baseSizeKg: 5.1,
		baseDifficulty: 1.25,
		baseTimeMs: 56000,
		progressPerWord: 0.112,
		tensionOnTypo: 11,
		durabilityOnTypo: 5,
		idlePressurePerSecond: 0.82,
		assetKey: "fish_glass_eel",
		lore: "A ribbon of reflected sky that bends away from careless pulls.",
		reward: { coins: 58, materials: 4, xp: 28 },
	},
	{
		id: "reef_shark",
		name: "Reef Shark",
		rarity: "rare",
		habitat: "zone_3",
		behavior: "predator",
		typingProfile: "medium_burst",
		baseSizeKg: 38,
		baseDifficulty: 1.55,
		baseTimeMs: 64000,
		progressPerWord: 0.095,
		tensionOnTypo: 13,
		durabilityOnTypo: 6,
		idlePressurePerSecond: 1.05,
		assetKey: "fish_reef_shark",
		lore: "A decisive hunter that punishes hesitation with a charging run.",
		reward: { coins: 94, materials: 6, xp: 42 },
	},
	{
		id: "crown_leviathan",
		name: "Crown Leviathan",
		rarity: "boss",
		habitat: "zone_3",
		behavior: "boss",
		typingProfile: "boss_mixed",
		baseSizeKg: 126,
		baseDifficulty: 1.85,
		baseTimeMs: 90000,
		progressPerWord: 0.082,
		tensionOnTypo: 15,
		durabilityOnTypo: 7,
		idlePressurePerSecond: 1.22,
		assetKey: "fish_crown_leviathan",
		lore: "The reef's old monarch, crowned in coral and drawn by perfect rhythm.",
		reward: { coins: 180, materials: 12, xp: 90 },
	},
]

/**
 * Extended generated fish catalog. These are collection previews only; the
 * deterministic Milestone 1 encounter roster remains `fishSpecies` above.
 */
export const generatedFishCatalog: FishCatalogEntry[] = [
	{ id: "catalog_pebble_goby", name: "Pebble Goby", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_01.png", landmark: "Shovel head, barbels, paddle tail" },
	{ id: "catalog_ribbon_sardine", name: "Ribbon Sardine", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_02.png", landmark: "Streamer tail and thin silver body" },
	{ id: "catalog_crescent_guppy", name: "Crescent Guppy", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_03.png", landmark: "Oversized crescent tail" },
	{ id: "catalog_shellback_puffer", name: "Shellback Puffer", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_04.png", landmark: "Spiral shell-like back plate" },
	{ id: "catalog_tide_skipper", name: "Tide Skipper", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_05.png", landmark: "Pennant tail and jumping posture" },
	{ id: "catalog_coral_fry", name: "Coral Fry", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_06.png", landmark: "Three coral dorsal prongs" },
	{ id: "catalog_lantern_anchovy", name: "Lantern Anchovy", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_07.png", landmark: "Forehead lantern stalk" },
	{ id: "catalog_leafy_wrasse", name: "Leafy Wrasse", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_08.png", landmark: "Leaf-shaped fins" },
	{ id: "catalog_bandtail_bream", name: "Bandtail Bream", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_09.png", landmark: "Four body bands and three-lobed tail" },
	{ id: "catalog_needle_minnow", name: "Needle Minnow", rarity: "common", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_10.png", landmark: "Long needle snout" },
	{ id: "catalog_spotted_lionfish", name: "Spotted Lionfish", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_11.png", landmark: "Seven striped dorsal rays" },
	{ id: "catalog_sailfin_tang", name: "Sailfin Tang", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_12.png", landmark: "Large sail dorsal fin" },
	{ id: "catalog_sunset_parrotfish", name: "Sunset Parrotfish", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_13.png", landmark: "Beak-shaped snout" },
	{ id: "catalog_ribbon_eel", name: "Ribbon Eel", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_14.png", landmark: "Forehead crest and curled ribbon tail" },
	{ id: "catalog_stargazer", name: "Stargazer", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_15.png", landmark: "Top-set eyes and shovel mouth" },
	{ id: "catalog_pearl_flounder", name: "Pearl Flounder", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_16.png", landmark: "Both eyes on one side" },
	{ id: "catalog_marbled_ray", name: "Marbled Ray", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_17.png", landmark: "Diamond body and corkscrew tail" },
	{ id: "catalog_striped_barracuda", name: "Striped Barracuda", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_18.png", landmark: "Needle jaw and vertical stripes" },
	{ id: "catalog_giant_clamfish", name: "Giant Clamfish", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_19.png", landmark: "Hinged clam shell rear" },
	{ id: "catalog_glass_catfish", name: "Glass Catfish", rarity: "uncommon", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_20.png", landmark: "Translucent body and whiskers" },
	{ id: "catalog_moonfin_snapper", name: "Moonfin Snapper", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_21.png", landmark: "Crescent dorsal and split ribbon tail" },
	{ id: "catalog_reef_shark", name: "Reef Shark", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_22.png", landmark: "Blunt snout and coral scars" },
	{ id: "catalog_prism_koi", name: "Prism Koi", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_23.png", landmark: "Asymmetric fins and forehead horn" },
	{ id: "catalog_pearl_manta", name: "Pearl Manta", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_24.png", landmark: "Diamond ray body and fork tail" },
	{ id: "catalog_ember_lionfish", name: "Ember Lionfish", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_25.png", landmark: "Eight flame-like fins" },
	{ id: "catalog_glass_marlin", name: "Glass Marlin", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_26.png", landmark: "Transparent cyan body and long bill" },
	{ id: "catalog_crown_angelfish", name: "Crown Angelfish", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_27.png", landmark: "Crown upper fin and beard lower fin" },
	{ id: "catalog_blacktip_barracuda", name: "Blacktip Barracuda", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_28.png", landmark: "Charcoal body and zigzag tail" },
	{ id: "catalog_comet_swordfish", name: "Comet Swordfish", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_29.png", landmark: "Long silver bill and starry tail" },
	{ id: "catalog_spineback_grouper", name: "Spineback Grouper", rarity: "rare", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_30.png", landmark: "Six dorsal spines and huge jaw" },
	{ id: "catalog_abyssal_angler", name: "Abyssal Angler", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_31.png", landmark: "Oversized belly, gold lure, huge jaw" },
	{ id: "catalog_storm_crown_ray", name: "Storm Crown Ray", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_32.png", landmark: "Diamond ray, lightning fins, whip tail" },
	{ id: "catalog_sunken_marlin", name: "Sunken Marlin", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_33.png", landmark: "Gold spear bill and towering sail" },
	{ id: "catalog_coral_dragonfish", name: "Coral Dragonfish", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_34.png", landmark: "Sea-dragon body and horned crest" },
	{ id: "catalog_tide_emperor", name: "Tide Emperor", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_35.png", landmark: "Disc body, fan crown, mantle fringe" },
	{ id: "catalog_prism_whale", name: "Prism Whale", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_36.png", landmark: "Rounded whale-fish silhouette" },
	{ id: "catalog_aurora_serpent", name: "Aurora Serpent", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_37.png", landmark: "Long S-coiled body and horn fins" },
	{ id: "catalog_shell_monarch", name: "Shell Monarch", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_38.png", landmark: "Three armor shells and banner tail" },
	{ id: "catalog_deepstar_octofish", name: "Deepstar Octofish", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_39.png", landmark: "Four tentacle fins and star eye" },
	{ id: "catalog_crown_leviathan", name: "Crown Leviathan", rarity: "boss", spritePath: "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_40.png", landmark: "Crescent blade, crown ridge, comet tail" },
]

export const fishingSkills: FishingSkill[] = [
	{
		id: "cast_net",
		name: "Cast Net",
		type: "active",
		rarity: "common",
		effect: "instant_small_capture",
		rankedAllowed: false,
		description: "Instantly resolves or captures nearby small fish.",
	},
	{
		id: "steel_line",
		name: "Steel Line",
		type: "passive",
		rarity: "common",
		effect: "ignore_first_typo_per_encounter",
		rankedAllowed: false,
		description: "Ignores the first typo in each encounter.",
	},
	{
		id: "sonar",
		name: "Sonar",
		type: "active",
		rarity: "common",
		effect: "reveal_route_rewards",
		rankedAllowed: false,
		description: "Reveals rarity and route rewards before choosing.",
	},
	{
		id: "calm_current",
		name: "Calm Current",
		type: "active",
		rarity: "uncommon",
		effect: "slow_fish_pressure",
		rankedAllowed: false,
		description: "Slows fish pressure briefly, not the typing timer.",
	},
	{
		id: "perfect_bait",
		name: "Perfect Bait",
		type: "passive",
		rarity: "uncommon",
		effect: "perfect_streak_rare_odds",
		rankedAllowed: false,
		description: "Perfect-word streaks improve rare encounter odds.",
	},
	{
		id: "reel_mastery",
		name: "Reel Mastery",
		type: "passive",
		rarity: "rare",
		effect: "fifth_perfect_word_bonus_progress",
		rankedAllowed: false,
		description: "Every fifth perfect word grants bonus progress.",
	},
]

export const shallowCoastRouteNodes: RouteNode[] = [
	{
		id: "lagoon_gate",
		zoneId: "zone_1",
		name: "Lagoon Gate",
		risk: 0.85,
		rewardMultiplier: 0.95,
		fishIds: ["reef_minnow", "kelp_darter", "sunny_guppy"],
	},
	{
		id: "reef_shelf",
		zoneId: "zone_1",
		name: "Reef Shelf",
		risk: 1,
		rewardMultiplier: 1.08,
		fishIds: ["kelp_darter", "sunny_guppy", "reef_minnow"],
	},
	{
		id: "coral_pass",
		zoneId: "zone_2",
		name: "Coral Pass",
		risk: 1.05,
		rewardMultiplier: 1.1,
		fishIds: ["shellback_puffer", "tide_skipper", "coral_fry"],
	},
	{
		id: "sunken_rope",
		zoneId: "zone_2",
		name: "Sunken Rope",
		risk: 1.15,
		rewardMultiplier: 1.22,
		fishIds: ["tide_skipper", "coral_fry", "shellback_puffer"],
	},
	{
		id: "moon_channel",
		zoneId: "zone_3",
		name: "Moon Channel",
		risk: 1.25,
		rewardMultiplier: 1.35,
		fishIds: ["glass_eel", "moonfin_snapper", "reef_shark", "crown_leviathan"],
	},
	{
		id: "crown_wake",
		zoneId: "zone_3",
		name: "Crown Wake",
		risk: 1.35,
		rewardMultiplier: 1.5,
		fishIds: ["moonfin_snapper", "glass_eel", "reef_shark", "crown_leviathan"],
	},
]

export const shallowCoastZoneOrder: ZoneId[] = ["zone_1", "zone_2", "zone_3"]

export const starterSkillIds = ["steel_line", "reel_mastery", "calm_current"] as const

export function getFish(id: string): FishSpecies {
	const fish = fishSpecies.find((entry) => entry.id === id)
	if (!fish) {
		throw new Error(`Unknown fish species: ${id}`)
	}
	return fish
}

export function getSkill(id: string): FishingSkill {
	const skill = fishingSkills.find((entry) => entry.id === id)
	if (!skill) {
		throw new Error(`Unknown fishing skill: ${id}`)
	}
	return skill
}

export function getRouteNodesForZone(zoneId: ZoneId): RouteNode[] {
	return shallowCoastRouteNodes.filter((node) => node.zoneId === zoneId)
}

export function getIndonesianPassage(index: number): string {
	const passages = languagePacks.id.passages
	return passages[index % passages.length] ?? passages[0]
}
