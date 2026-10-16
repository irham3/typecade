import type { DungeonLanguage, EnemyKind, SupplyKind, SkillId, UpgradeId } from "../../contracts/src/survival"

export const dungeonBalance = {
 tick: 1 / 30, enemies: 128, loot: 256, projectiles: 64, effects: 128,
 hp: 6, contactGrace: 1.2, dashGrace: .3, pickupRadius: 2.2,
 spawnRadius: 8.5, spawnInterval: 2.4, speed: .32, manaRegen: 2.5,
 openingSeconds: 90, openingThreats: 4, openingInterval: 4,
 learningSeconds: 180, learningThreats: 6, learningInterval: 3, preBossThreats: 12,
 bossInterval: 300, stagger: 10, bossHealth: 260,
} as const
export const dungeonSupplies:Record<SupplyKind,{name:string;benefit:string;icon:"shield"|"heal"|"gem"|"tower";color:number}>= {
 shield:{name:"Aegis Shield",benefit:"+2 shield · absorbs damage first · cap 4",icon:"shield",color:0x73dcec},
 potion:{name:"Health Potion",benefit:"Restore 2 hearts",icon:"heal",color:0xff8180},
 mana:{name:"Mana Crystal",benefit:"Restore 40 mana",icon:"gem",color:0x92a4ff},
 sentry:{name:"Arc Sentry",benefit:"Deploy 18s · fires every 1.8s · range 7",icon:"tower",color:0xf0cc78},
}
export const dungeonObjects:readonly EnemyKind[]=["barrel","chest","shield","potion","mana","sentry"]
export const enemySpeed:Record<EnemyKind,number>={skeleton:.9,goblin:1.35,guard:.65,bomber:1.05,mage:.8,bat:1.15,minotaur:.7,boss:.6,barrel:0,chest:0,shield:0,potion:0,mana:0,sentry:0}
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
export const combatLessons = [
 {id:"strike",title:"Your word is your movement",help:"Type the word above the enemy. Its final letter dashes you to it and strikes. No Space or movement key is needed.",success:"Enemy defeated. The dash also collected its XP and gold."},
 {id:"armor",title:"Two words, two armor layers",help:"Type the guard's word exactly, including its capital letter. The first word breaks a shield; the second defeats the guard.",success:"Shield broken, then guard defeated. The bars show the layers left."},
 {id:"treasure",title:"Gold labels are loot",help:"The diamond label belongs to a chest. Type its word to open it and collect gold and XP. It cannot attack you.",success:"Chest opened. Compare your gold and XP with the previous lesson."},
 {id:"barrel",title:"Orange labels are explosive objects",help:"Type the barrel's word to detonate it. Nearby enemies lose an armor layer too. It is an object, not a pursuer.",success:"The barrel's blast defeated its nearby enemies. One word, one chain reaction."},
 {id:"heal",title:"Read the hit, then recover",help:"Watch one safe demonstration hit: armor flashes, the screen edge reacts, and two hearts empty. Press Tab, then type the displayed HEAL keyword.",success:"Two hearts restored. Healing uses mana and needs four completed target words before it can be used again."},
 {id:"storm",title:"Skills affect real armor",help:"Press Tab and type the displayed STORM keyword. Time slows in skill mode. Each guard loses one layer; the remaining word still needs typing.",success:"The storm removed one layer from each guard. Its cooldown is measured in completed words, not seconds."},
 {id:"upgrade",title:"XP becomes a stronger build",help:"Watch the XP bar fill. Time freezes for a draft. Type one complete card keyword to apply its upgrade; read the rank and effect on the card.",success:"Upgrade applied. The golden pulse and acquisition message confirm the new build. Training does not change your saved run."},
] as const
export const combatLessonWords:Record<DungeonLanguage,{strike:string;armor:readonly string[];treasure:string;barrel:string}>={
 en:{strike:"cut",armor:["Guard","Break"],treasure:"OPEN",barrel:"IGNITE"},
 id:{strike:"tebas",armor:["Perisai","Besi"],treasure:"BUKA",barrel:"LEDAKKAN"},
}
export const dungeonWords: Record<DungeonLanguage, Record<EnemyKind, readonly string[]>> = {
 en: {
  shield:["SHIELD","AEGIS","WARD","PROTECT","DEFEND","COVER","BARRIER","BULWARK"],potion:["POTION","MEND","RECOVER","DRINK","HEALTH","RESTORE","REMEDY","REVIVE"],mana:["MANA","ENERGY","CHARGE","REFILL","SPIRIT","FLOW","POWER","CHANNEL"],sentry:["TURRET","SENTRY","DEPLOY","BUILD","GUARDIAN","WATCH","ASSEMBLE","BEACON"],
  bat:["wing","flap","dive","swoop","fang","bite","gloom","night","glide","soar","swift","flit","flutter","perch","roost","screech","shade","echo","hunt","dark"],
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
  shield:["PERISAI","TAMENG","LINDUNG","BENTENG","JAGA","PELINDUNG","TEGUH","PERTAHAN"],potion:["RAMUAN","PULIH","SEMBUH","MINUM","OBAT","NYAWA","SEHAT","BOTOL"],mana:["MANA","ENERGI","KRISTAL","ARUS","DAYA","ISI","CAHAYA","ALIR"],sentry:["MENARA","PASANG","RAKIT","BANGUN","PENJAGA","AKTIF","TEMBAK","PANTAU"],
  bat:["sayap","kelam","terbang","sambar","malam","gelap","gema","gigit","taring","kepak","angin","hantu","bayang","intai","buru","terkam","senyap","langit","layang","cicit"],
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
 storm: { name: "Absolute Zero", en: "FROST", id: "BEKU", description: "Costs 5 less mana per rank. At level 3: freeze for 5s and shorten untouched words.", max: 3 },
 heal: { name: "Divine Aegis", en: "AEGIS", id: "LINDUNG", description: "Cheaper healing. At level 3: gain four seconds of protection.", max: 3 },
 lightning: { name: "Chain Lightning", en: "SPARK", id: "PETIR", description: "Every tenth combat character strikes two nearby foes.", max: 1 },
 magnet: { name: "XP Magnet", en: "MAGNET", id: "MAGNET", description: "+50% pickup radius. Above 60 WPM: +20% XP.", max: 5 },
 switch: { name: "Mechanical Switch", en: "THOCK", id: "DORONG", description: "Completed words push nearby foes away.", max: 1 },
 vowels: { name: "Vowel Spitfires", en: "VOWEL", id: "VOKAL", description: "Vowels scorch a seeded nearby foe.", max: 1 },
 overclock: { name: "100 WPM Overclock", en: "CLOCK", id: "CEPAT", description: "Above 100 WPM: double mana recovery and cooldown reduction.", max: 1 },
 glasses: { name: "Programmer's Glasses", en: "GLASS", id: "KACAMATA", description: "Future mage and bomber words lose punctuation.", max: 1 },
 execute: { name: "Execute Shortener", en: "FINISH", id: "AKHIR", description: "Final elite words are at most three letters.", max: 1 },
}
