export type DungeonLanguage = "en" | "id"
export type RunPhase = "ready" | "arena" | "skills" | "draft" | "overdrive" | "paused" | "dead"
export type SupplyKind = "shield" | "potion" | "mana" | "sentry"
export type EnemyKind = SupplyKind | "bat" | "skeleton" | "goblin" | "guard" | "bomber" | "mage" | "minotaur" | "boss" | "barrel" | "chest"
 | "wolf" | "slime" | "spider" | "wraith" | "archer" | "shaman" | "golem" | "imp" | "rat" | "necromancer" | "serpent" | "beetle" | "assassin" | "troll" | "wisp"
 | "gargoyle" | "mimic" | "sporeling" | "ghoul" | "deathknight"
export type SkillId = "cleave" | "storm" | "heal"
export type RelicId = "lightning" | "magnet" | "switch" | "vowels" | "overclock" | "glasses" | "execute"
/** Automatic, levelled weapons in the Vampire Survivors tradition: they act on their own clocks and never touch the locked word. */
export type WeaponId = "orbit" | "nova" | "meteor" | "frost"
export type UpgradeId = SkillId | RelicId | WeaponId
export interface Point { x: number; z: number }
export interface DungeonEnemy extends Point {
 id: number; kind: EnemyKind; words: string[]; speed: number; frozen: number; attack: number; health: number; maxHealth: number
 waypoint?: Point; motion?: "windup" | "charge" | "slam" | "recover"; motionTime?: number; aim?: Point
}
export interface DungeonLoot extends Point { id: number; xp: number; gold: number; mana: number }
export interface DungeonProjectile extends Point { id: number; vx: number; vz: number; life: number }
export type DamageSource = "blade" | "cleave" | "storm" | "lightning" | "vowels" | "sentry" | "explosion" | "orbit" | "nova" | "meteor" | "frost" | "whirl" | "finisher"
export interface DungeonEffect extends Point { id: number; kind: "slash" | "hit" | "storm" | "heal" | "pickup" | "shatter" | "magnet" | "block" | "shield" | "mana" | "deploy" | "sentry" | "lightning" | "firebolt" | "blast" | "treasure" | "slam" | "level" | "upgrade" | "barrier" | "ward" | "summon" | "blink" | "nova" | "meteor" | "frost" | "whirl" | "finisher" | "spore" | "gold"; source?: DamageSource; life: number; value: number; to?: Point }
export interface DungeonState {
 version: 1; seed: string; rng: number; language: DungeonLanguage; phase: RunPhase; resumePhase: RunPhase
 time: number; worldTime: number; nextBoss: number; spawnAt: number; nextId: number; biome: number
 player: Point & { hp: number; maxHp: number; mana: number; shield: number; invincible: number; dashFrom: Point; dashAt: number }
 procs: { lightning: number; vowels: number }; supplies: Record<SupplyKind, number>; sentry: (Point & { life: number; cooldown: number }) | null
 enemies: DungeonEnemy[]; loot: DungeonLoot[]; projectiles: DungeonProjectile[]; effects: DungeonEffect[]; recentWords: string[]
 target: number | null; prefix: string; command: string; queue: number[]; labelLimit: number
 level: number; xp: number; totalXp: number; gold: number; kills: number; words: number; correct: number; errors: number; streak: number; bestStreak: number
 skills: Record<SkillId, { level: number; cooldown: number }>; relics: Record<RelicId, number>
 /** Weapon rank (0 = not owned) and seconds until its next automatic strike. */
 weapons: Record<WeaponId, { level: number; timer: number }>; orbitHits: Record<string, number>
 offers: UpgradeId[]; pendingDrafts: number; legendaryDrafts: number; afterDraft: RunPhase
 bossArena: (Point & { hp:number; cooldown:number; rage:number; calm:number }) | null
 boss: number | null; stagger: number; paragraph: string; cursor: number; notice: string
}
export interface DungeonLabel { id: number; x: number; y: number; visible: boolean }
export interface PartyWorld {
 mode:"sprint"|"clash"|"raid";phase:"waiting"|"countdown"|"racing"|"finished";casting:boolean;ownId:string|null
 players:Array<{id:string;name:string;x:number;z:number;color:number;hp:number;shield?:number;action:string;actionAt:number;target:string|null;role:string}>
 boss:{hp:number;maxHp:number;nextAttack:number;attackAt:number;target:string|null}|null;now:number;focus:Point
 obstacles:Array<Point & {kind:"barrel"|"goblin"|"barrier";word:string}>
}
/** Hero customization slots; values are cosmetic item ids from the content catalog. */
export type HeroSlot = "hero" | "head" | "face" | "body" | "legs" | "back" | "weapon" | "offhand" | "dye"
export type HeroLoadout = Readonly<Record<HeroSlot, string>>
export interface DungeonEvents {
 appearance: HeroLoadout
 frame: DungeonState
 screen: "title" | "endless" | "dojo" | "multiplayer" | "tutorial" | "armory"
 settings: { reduced: boolean; volume: number; music?: number; effects?: number }
 projected: DungeonLabel[]
 training: { correct: number; words: number; errors: number }
 party: PartyWorld|null
 partyProjected: Array<{id:string;x:number;y:number;color:number;name:string;hp:number;role:string}>
 renderer: { status: "ready" | "lost" | "error"; calls: number; geometries: number; textures: number }
}
