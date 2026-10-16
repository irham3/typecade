export type DungeonLanguage = "en" | "id"
export type RunPhase = "ready" | "arena" | "skills" | "draft" | "overdrive" | "paused" | "dead"
export type EnemyKind = "skeleton" | "goblin" | "guard" | "bomber" | "mage" | "minotaur" | "boss" | "barrel" | "chest"
export type SkillId = "cleave" | "storm" | "heal"
export type RelicId = "lightning" | "magnet" | "switch" | "vowels" | "overclock" | "glasses" | "execute"
export type UpgradeId = SkillId | RelicId
export interface Point { x: number; z: number }
export interface DungeonEnemy extends Point {
 id: number; kind: EnemyKind; words: string[]; speed: number; frozen: number; attack: number; health: number; maxHealth: number
 waypoint?: Point
}
export interface DungeonLoot extends Point { id: number; xp: number; gold: number; mana: number }
export interface DungeonProjectile extends Point { id: number; vx: number; vz: number; life: number }
export interface DungeonEffect extends Point { id: number; kind: "slash" | "hit" | "storm" | "heal" | "pickup" | "shatter" | "magnet"; life: number; value: number }
export interface DungeonState {
 version: 1; seed: string; rng: number; language: DungeonLanguage; phase: RunPhase; resumePhase: RunPhase
 time: number; worldTime: number; nextBoss: number; spawnAt: number; nextId: number; biome: number
 player: Point & { hp: number; maxHp: number; mana: number; invincible: number; dashFrom: Point; dashAt: number }
 enemies: DungeonEnemy[]; loot: DungeonLoot[]; projectiles: DungeonProjectile[]; effects: DungeonEffect[]; recentWords: string[]
 target: number | null; prefix: string; command: string; queue: number[]; labelLimit: number
 level: number; xp: number; totalXp: number; gold: number; kills: number; words: number; correct: number; errors: number; streak: number; bestStreak: number
 skills: Record<SkillId, { level: number; cooldown: number }>; relics: Record<RelicId, number>
 offers: UpgradeId[]; pendingDrafts: number; legendaryDrafts: number; afterDraft: RunPhase
 boss: number | null; stagger: number; paragraph: string; cursor: number; notice: string
}
export interface DungeonLabel { id: number; x: number; y: number; visible: boolean }
export interface PartyWorld {
 mode:"sprint"|"clash"|"raid";phase:"waiting"|"countdown"|"racing"|"finished";casting:boolean;ownId:string|null
 players:Array<{id:string;name:string;x:number;z:number;color:number;hp:number;action:string;actionAt:number;target:string|null;role:string}>
 boss:{hp:number;maxHp:number;nextAttack:number;attackAt:number;target:string|null}|null;now:number;focus:Point
 obstacles:Array<Point & {kind:"barrel"|"goblin"|"barrier";word:string}>
}
export interface DungeonEvents {
 frame: DungeonState
 screen: "title" | "endless" | "dojo" | "multiplayer"
 settings: { reduced: boolean; volume: number }
 projected: DungeonLabel[]
 training: { correct: number; words: number; errors: number }
 party: PartyWorld|null
 partyProjected: Array<{id:string;x:number;y:number;color:number;name:string;hp:number;role:string}>
 renderer: { status: "ready" | "lost" | "error"; calls: number; geometries: number; textures: number }
}
