import type { FishSpecies, FishingSkill, RouteNode, ZoneId } from "@typecade/contracts"

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



export const fishingSkills: FishingSkill[] = [
	{
		id: "cast_net",
		name: "Cast Net",
		type: "active",
		rarity: "common",
		effect: "steady_small_fish",
		rankedAllowed: false,
		description: "Tension -18, line +20%. Requires 45% reel and a common fish up to 2.2 kg. Finish every character to land it.",
	},
	{
		id: "steel_line",
		name: "Steel Line",
		type: "passive",
		rarity: "common",
		effect: "ignore_first_typo_per_encounter",
		rankedAllowed: false,
		description: "First typo shielded. Prevents line damage and tension once per fish.",
	},
	{
		id: "sonar",
		name: "Sonar",
		type: "active",
		rarity: "common",
		effect: "reveal_route_fish",
		rankedAllowed: false,
		description: "Tension -5, route preview 12s. Choose your route before typing.",
	},
	{
		id: "calm_current",
		name: "Calm Current",
		type: "active",
		rarity: "uncommon",
		effect: "slow_fish_pressure",
		rankedAllowed: false,
		description: "Tension -10, pressure -65% for 8s. The typing timer keeps running.",
	},
	{
		id: "perfect_bait",
		name: "Perfect Bait",
		type: "passive",
		rarity: "uncommon",
		effect: "perfect_streak_tension_recovery",
		rankedAllowed: false,
		description: "Tension recovery after four perfect words. Uncommon or rarer fish only.",
	},
	{
		id: "reel_mastery",
		name: "Reel Mastery",
		type: "passive",
		rarity: "rare",
		effect: "fifth_perfect_word_line_recovery",
		rankedAllowed: false,
		description: "Tension -8, line +5%. Every five consecutive perfect words.",
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

export const adventureConditions = [
	{ id: "calm", name: "Calm Water", description: "Finish all text. Retype a typo to continue.", time: 1, pressure: 1, typoDamage: 1, reward: 1, passages: 1 },
	{ id: "surge", name: "Rough Current", description: "+45% idle pressure. Calm Current helps.", time: 1, pressure: 1.45, typoDamage: 1, reward: 1.25, passages: 1 },
	{ id: "fragile", name: "Fragile Line", description: "+50% typo damage. Steel Line shields one typo.", time: 1, pressure: 1, typoDamage: 1.5, reward: 1.25, passages: 1 },
	{ id: "quick", name: "Quick Bite", description: "-20% time. Finish every character.", time: 0.8, pressure: 1, typoDamage: 1, reward: 1.25, passages: 1 },
	{ id: "shoal", name: "Treasure Shoal", description: "Longer text, +70% time, +50% rewards.", time: 1.7, pressure: 1, typoDamage: 1, reward: 1.5, passages: 2 },
] as const

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

const passageByProfile: Partial<Record<FishSpecies["typingProfile"], string>> = {
	short_burst: "ikan melesat, diam sebentar, lalu melesat lagi",
	long_words: "kerang berlapis menyembunyikan perjalanan panjang",
	tricky_pairs: "karang kering, kerang kuning, karang kering",
	many_short: "air di kiri, air di kanan, ikan ke batu",
	medium_burst: "tali menegang saat arus berbalik cepat, lalu tenang sejenak",
	boss_mixed: "ombak kecil pecah, arus deras datang; tarik tali pelan, lalu cepat saat karang retak dan mahkota emas muncul di bawah perahu",
}

export function getIndonesianPassage(index: number, profile?: FishSpecies["typingProfile"]): string {
	const profiled = profile ? passageByProfile[profile] : undefined
	if (profiled) return profiled
	const passages = languagePacks.id.passages
	return passages[index % passages.length] ?? passages[0]
}
