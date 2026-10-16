import type { DungeonLanguage, EnemyKind, SkillId, UpgradeId } from "../../contracts/src/survival"

export const dungeonBalance = {
 tick: 1 / 30, enemies: 128, loot: 256, projectiles: 64, effects: 128,
 hp: 6, contactGrace: 1.2, dashGrace: .3, pickupRadius: 2.2,
 spawnRadius: 10, spawnInterval: 2.4, speed: .32, manaRegen: 2.5,
 bossInterval: 300, stagger: 10, bossHealth: 260,
} as const
export const dungeonTerrain = { chunkSize: 32, ruinX: 10, ruinZ: 10, halfWidth: 4.5, halfDepth: 2.5 } as const
export const dungeonBiomes=[
 {name:"Ashen Courtyard",stone:0x626269,moss:0x4d5645,fog:0x17202a,flame:0xff923d},
 {name:"Hollow Crypt",stone:0x535c70,moss:0x3d5354,fog:0x151e2d,flame:0x72c9e2},
 {name:"Ember Foundry",stone:0x6e5b54,moss:0x514638,fog:0x271e26,flame:0xf98748},
] as const
export const dungeonLongWords:Record<DungeonLanguage,readonly string[]>={
 en:["annihilate","dismantle","eradicate","vanquish","overthrow","conqueror","barricade","spellbound"],
 id:["hancurkan","binasakan","runtuhkan","gempurkan","musnahkan","tumbangkan","singkirkan","kalahkan"],
}
export const skillRules: Record<SkillId, { cost: number; words: number; en: string; id: string; description: string }> = {
 cleave: { cost: 25, words: 3, en: "CLEAVE", id: "SAPU", description: "Sweep nearby foes. Preserve your locked word." },
 storm: { cost: 40, words: 5, en: "STORM", id: "BADAI", description: "Strike every visible foe. Evolve to freeze." },
 heal: { cost: 35, words: 4, en: "HEAL", id: "SEMBUH", description: "Restore two hearts. Evolve to gain Aegis." },
}
export const dungeonWords: Record<DungeonLanguage, Record<EnemyKind, readonly string[]>> = {
 en: {
  skeleton: ["cut", "slash", "jab", "rip", "thrust", "bash"], goblin: ["dash", "stab", "rush", "hit", "chop", "rend"],
  guard: ["Guard", "Break", "Shatter"], minotaur: ["CRUSH", "BREAK", "EXECUTE"], boss: ["SHATTER", "OBSIDIAN", "DESTROY"],
  bomber: ["detonate-3", "bot-09"], mage: ["hex_bolt!", "void_orb!"], barrel: ["IGNITE"], chest: ["LOOT"],
 },
 id: {
  skeleton: ["tebas", "sabet", "hajar", "iris", "pukul", "belah"], goblin: ["babat", "serbu", "tikam", "gempur", "usir", "lawan"],
  guard: ["Perisai", "Hantam", "Besi"], minotaur: ["HANCURKAN", "TEMBUS", "EKSEKUSI"], boss: ["PECAHKAN", "OBSIDIAN", "HANCURKAN"],
  bomber: ["ledak-3", "mesin-09"], mage: ["kutuk_petir!", "mantra!"], barrel: ["LEDAKKAN"], chest: ["BUKA"],
 },
}
export const bossPassages: Record<DungeonLanguage, readonly string[]> = {
 en: ["break the ancient armor and strike the shadow BLIZZARD let the frozen blade cut through the dark keep ", "hold your ground and let each letter become a blade BLIZZARD shatter the stone and face the dawn "],
 id: ["pecahkan perisai kuno dan tebas bayangan BLIZZARD biarkan pedang es membelah gelapnya benteng ", "jaga irama dan jadikan setiap huruf sebuah pedang BLIZZARD hancurkan batu lalu sambut fajar "],
}
export const dungeonUpgrades: Record<UpgradeId, { name: string; en: string; id: string; description: string; max: number }> = {
 cleave: { name: "Crimson Cleave", en: "BLADE", id: "UP-SAPU", description: "+40% radius. At level 3: strip two layers and magnet XP.", max: 3 },
 storm: { name: "Absolute Zero", en: "FROST", id: "BEKU", description: "Wider storm. At level 3: freeze for 5s and shorten untouched words.", max: 3 },
 heal: { name: "Divine Aegis", en: "AEGIS", id: "LINDUNG", description: "Cheaper healing. At level 3: gain four seconds of protection.", max: 3 },
 lightning: { name: "Chain Lightning", en: "SPARK", id: "PETIR", description: "Every tenth combat character strikes two nearby foes.", max: 1 },
 magnet: { name: "XP Magnet", en: "MAGNET", id: "MAGNET", description: "+50% pickup radius. Above 60 WPM: +20% XP.", max: 5 },
 switch: { name: "Mechanical Switch", en: "THOCK", id: "DORONG", description: "Completed words push nearby foes away.", max: 1 },
 vowels: { name: "Vowel Spitfires", en: "VOWEL", id: "VOKAL", description: "Vowels scorch a seeded nearby foe.", max: 1 },
 overclock: { name: "100 WPM Overclock", en: "CLOCK", id: "CEPAT", description: "Above 100 WPM: double mana recovery and cooldown reduction.", max: 1 },
 glasses: { name: "Programmer's Glasses", en: "GLASS", id: "KACAMATA", description: "Remove punctuation from untouched mage and bomber words.", max: 1 },
 execute: { name: "Execute Shortener", en: "FINISH", id: "AKHIR", description: "Final elite words are at most three letters.", max: 1 },
}
