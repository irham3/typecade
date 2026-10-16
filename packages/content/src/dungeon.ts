import type { DungeonLanguage, EnemyKind, SkillId, UpgradeId } from "../../contracts/src/survival"

export const dungeonBalance = {
 tick: 1 / 30, enemies: 128, loot: 256, projectiles: 64, effects: 128,
 hp: 6, contactGrace: 1.2, dashGrace: .3, pickupRadius: 2.2,
 spawnRadius: 8.5, spawnInterval: 2.4, speed: .32, manaRegen: 2.5,
 bossInterval: 300, stagger: 10, bossHealth: 260,
} as const
export const dungeonTerrain = { chunkSize: 32, ruinX: 10, ruinZ: 10, halfWidth: 4.5, halfDepth: 2.5 } as const
export const dungeonBiomes=[
 {name:"Ashen Courtyard",stone:0x485469,moss:0x3c5147,fog:0x111a2b,flame:0xff923d},
 {name:"Hollow Crypt",stone:0x444f6b,moss:0x354b55,fog:0x11182a,flame:0x72c9e2},
 {name:"Ember Foundry",stone:0x594c58,moss:0x454239,fog:0x211724,flame:0xf98748},
] as const
export const dungeonLongWords:Record<DungeonLanguage,readonly string[]>={
 en:["annihilate","dismantle","eradicate","vanquish","overthrow","conqueror","barricade","spellbound","onslaught","aftershock","bloodstone","crossguard","dreadnought","earthbound","firebrand","gravekeeper","hammerfall","ironclad","keystone","longsword","nightfall","outnumber","pathfinder","quickblade","runebound","stronghold","thunderclap","unbroken","vanguard","warhammer"],
 id:["hancurkan","binasakan","runtuhkan","gempurkan","musnahkan","tumbangkan","singkirkan","kalahkan","benturkan","cengkeram","dobrakkan","guncangkan","hantamkan","jatuhkan","koyakkan","lumpuhkan","lenyapkan","padamkan","pecahkan","patahkan","serangkan","taklukkan","terjanglah","tuntaskan","tusukkan","perlawanan","pertahanan","perisainya","penyerang","reruntuhan"],
}
export const skillRules: Record<SkillId, { cost: number; words: number; en: string; id: string; description: string }> = {
 cleave: { cost: 25, words: 3, en: "CLEAVE", id: "SAPU", description: "Sweep nearby foes. Preserve your locked word." },
 storm: { cost: 40, words: 5, en: "STORM", id: "BADAI", description: "Strike every visible foe. Evolve to freeze." },
 heal: { cost: 35, words: 4, en: "HEAL", id: "SEMBUH", description: "Restore two hearts. Evolve to gain Aegis." },
}
export const dungeonWords: Record<DungeonLanguage, Record<EnemyKind, readonly string[]>> = {
 en: {
  skeleton: ["cut","slash","jab","rip","bash","chip","crack","crush","flay","hack","hew","jolt","kick","knock","lunge","parry","press","pry","rake","rend","sever","slice","smash","split","stab","sting","swat","trip","ward","whack","wring","clash"],
  goblin: ["dash","stab","rush","hit","chop","rend","ambush","dodge","evade","feint","flank","jab","juke","knife","lunge","pounce","prowl","scurry","skulk","sneak","spring","stalk","strike","vault","weave","wound","harry","dart","slash","claw","grip","pry"],
  guard: ["Guard","Break","Shatter","Bastion","Deflect","Fortify","Parry","Shield","Protect","Rampart","Sentinel","Buckle","Counter","Tempered","Brace","Ironclad","Bulwark","Resolve","Stand","Ward"],
  minotaur: ["CRUSH","BREAK","EXECUTE","SHATTER","TRAMPLE","RUPTURE","DEMOLISH","OVERRUN","PULVERIZE","RAVAGE","FRACTURE","DISMANTLE","ANNIHILATE","STAMPEDE","SMASH","THUNDER","CONQUER","SLAM","UPROOT","DESTROY"],
  boss: ["SHATTER","OBSIDIAN","DESTROY","DEVASTATE","ERADICATE","OVERPOWER","ANNIHILATE","INCINERATE","UNBREAKABLE","CATACLYSM","OVERTHROW","DESTRUCTION","EXTINGUISH","ABOMINATION","DREADNOUGHT","BLOODSTONE","STRONGHOLD","WARBRINGER","THUNDERCLAP","VENGEANCE"],
  bomber: ["detonate-3","bot-09","fuse-12","blast-07","charge-8","ignite-4","timer-15","spark-6","bomb-21","chain-05","detonate-7","bot-12","fuse-21","blast-15","charge-3","ignite-9","timer-04","spark-12","bomb-08","chain-17"],
  mage: ["hex_bolt!","void_orb!","arc_burst!","ember_ray!","ice_shard!","rift_echo!","doom_mark!","soul_bind!","night_hex!","spark_arc!","shock_wave!","frost_bite!","rune_lock!","dark_pulse!","storm_eye!","spell_fire!","mana_rift!","ghost_arc!","burn_mark!","curse_web!"],
  barrel: ["IGNITE","BURST","EXPLODE","KINDLE","DETONATE","SCORCH","SPARK","BLAZE"], chest: ["LOOT","OPEN","CLAIM","UNLOCK","PLUNDER","SEARCH","REVEAL","GATHER"],
 },
 id: {
  skeleton: ["tebas","sabet","hajar","iris","pukul","belah","babat","tikam","retak","rapuh","lawan","patah","hantam","kikis","cakar","bentur","gurat","sayat","ayun","tusuk","desak","gempur","dobrak","duel","tahan","ruas","paku","siku","jagal","gebuk","sentak","usir"],
  goblin: ["babat","serbu","tikam","gempur","usir","lawan","elak","hindar","lompat","sambar","sergap","intai","cabik","cakar","terkam","kejar","sentak","gigit","libas","tusuk","gesit","tangkis","sayat","kelit","terjang","rebut","desak","jegal","pukul","sabet","tebas","hajar"],
  guard: ["Perisai","Hantam","Besi","Benteng","Tangkis","Hadang","Lindung","Patah","Redam","Tahan","Tembus","Penjaga","Pelindung","Pertahan","Palang","Teguh","Baja","Tameng","Kukuh","Bentur"],
  minotaur: ["HANCURKAN","TEMBUS","EKSEKUSI","GEMPUR","RUNTUHKAN","BINASAKAN","LULUHKAN","TUMBANG","HANTAM","PECAHKAN","TAKLUKKAN","GUNCANG","TERJANG","MUSNAHKAN","ROBOHKAN","DOBRAK","PADAMKAN","LUMPUHKAN","CABIK","RUSAKKAN"],
  boss: ["PECAHKAN","OBSIDIAN","HANCURKAN","TUMBANGKAN","MUSNAHKAN","GEMPURKAN","SINGKIRKAN","TAKLUKKAN","RUNTUHKAN","BINASAKAN","PERLAWANAN","KEHANCURAN","LULUHLANTAK","LUMPUHKAN","HANTAMKAN","LENYAPKAN","PATAHKAN","BENTURKAN","GUNCANGKAN","HABISKAN"],
  bomber: ["ledak-3","mesin-09","bom-12","sumbu-07","picu-8","bara-4","waktu-15","dinamit-21","rantai-05","ledak-7","mesin-12","bom-21","sumbu-15","picu-3","bara-9","waktu-04","dinamit-08","rantai-17","api-06","hitung-11"],
  mage: ["kutuk_petir!","mantra!","bola_api!","sihir_es!","rune_gelap!","kilat_biru!","bara_ungu!","segel_jiwa!","pecah_rune!","kutuk_abu!","kabut_es!","panah_api!","jubah_sihir!","cahaya_es!","gelap_malam!","sinar_bara!","rune_jiwa!","arus_mana!","sihir_batu!","api_biru!"],
  barrel: ["LEDAKKAN","BAKAR","PICU","SULUT","NYALAKAN","PELETUP","HANGUS","BARA"], chest: ["BUKA","AMBIL","JARAH","ANGKAT","KLAIM","BONGKAR","TEMUKAN","RAIH"],
 },
}
export const bossPassages: Record<DungeonLanguage, readonly string[]> = {
 en: ["break the ancient armor and strike the shadow BLIZZARD let the frozen blade cut through the dark keep ", "hold your ground and let each letter become a blade BLIZZARD shatter the stone and face the dawn ", "the gates are open keep your blade steady BLIZZARD press through the courtyard and silence the horns ", "follow the cracks in the ancient shield BLIZZARD strike before the scattered stones return "],
 id: ["pecahkan perisai kuno dan tebas bayangan BLIZZARD biarkan pedang es membelah gelapnya benteng ", "jaga irama dan jadikan setiap huruf sebuah pedang BLIZZARD hancurkan batu lalu sambut fajar ", "gerbang terbuka genggam pedangmu dengan teguh BLIZZARD lewati halaman dan padamkan api di menara ", "ikuti retakan pada perisai tua itu BLIZZARD serang sebelum kepingan batu kembali menyatu "],
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
