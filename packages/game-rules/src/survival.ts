import type { DamageSource, DungeonEnemy, DungeonLanguage, DungeonState, EnemyKind, Point, RelicId, RunPhase, SkillId, SupplyKind, UpgradeId } from "../../contracts/src/survival"
import { bossPassages, commonWords, commonWordStyle, dungeonBalance as B, dungeonUpgrades, dungeonWords, dungeonLongWords, dungeonSupplies, dungeonObjects, enemySpeed, enemyLunges, enemyProfiles, skillRules } from "../../content/src/dungeon"
import { createSeededRng } from "./rng"
import { areWeaponsValid, createEmptyWeapons, isWeaponId, tickWeapons, weaponIds, type CombatPort } from "./weapons"
import { spawnRoster } from "./roster"
import { hasClearPath, isWalkable, ruinAt } from "./terrain"
import { paceFor, surgeLineup, waveAt } from "./director"


const skillIds: SkillId[] = ["cleave", "storm", "heal"]
const relicIds: RelicId[] = ["lightning", "magnet", "switch", "vowels", "overclock", "glasses", "execute"]
const objects = dungeonObjects
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)
export const xpThreshold = (level: number) => Math.min(100_000, Math.floor(100 * 1.25 ** Math.min(level, 32)))
export const runWpm = (s: DungeonState) => Math.round(s.correct / 5 / Math.max(1 / 6, s.time / 60))
export const runAccuracy = (s: DungeonState) => s.correct + s.errors ? Math.round(s.correct / (s.correct + s.errors) * 100) : 100
/** Collision lives in ./terrain; these names are kept for existing callers. */
export const dungeonWalkable = (p: Point) => isWalkable(p)
const reachable = (a: Point, b: Point) => hasClearPath(a, b)

export function createDungeonState(seed: string, language: DungeonLanguage): DungeonState {
 return {
  version: 1, seed, rng: 0, language, phase: "ready", resumePhase: "arena", time: 0, worldTime: 0, nextBoss: B.bossInterval, spawnAt: 2, nextId: 1, biome: 0,
  player: { x: 0, z: 0, hp: B.hp, maxHp: B.hp, mana: 100, shield: 0, invincible: 0, dashFrom: { x: 0, z: 0 }, dashAt: -10 },
  bossArena:null,procs:{lightning:0,vowels:0},supplies:{shield:0,potion:0,mana:0,sentry:0},sentry:null,
  enemies: [], loot: [], projectiles: [], effects: [], recentWords: [], target: null, prefix: "", command: "", queue: [], labelLimit: 6,
  level: 1, xp: 0, totalXp: 0, gold: 0, kills: 0, words: 0, correct: 0, errors: 0, streak: 0, bestStreak: 0,
  skills: { cleave: { level: 1, cooldown: 0 }, storm: { level: 1, cooldown: 0 }, heal: { level: 1, cooldown: 0 } },
  relics: { lightning: 0, magnet: 0, switch: 0, vowels: 0, overclock: 0, glasses: 0, execute: 0 },
  weapons: createEmptyWeapons(), orbitHits: {},
  offers: [], pendingDrafts: 0, legendaryDrafts: 0, afterDraft: "arena", boss: null, stagger: 0, paragraph: "", cursor: 0, notice: "Type a word to dash and strike. Tab opens skills.",
 }
}

/** Deterministic simulation. No renderer, browser clock or storage dependency. */
export class SurvivalRun {
 readonly state: DungeonState
 constructor(seed: string, language: DungeonLanguage = "id", restored?: DungeonState) {
  this.state = restored ?? createDungeonState(seed, language)
  if (!restored) {
   for (const [i,kind] of (["skeleton","goblin","chest","shield"] as const).entries()) this.spawn(kind, { x: Math.sin(i * Math.PI/2) * (6 + i * .3), z: Math.cos(i * Math.PI/2) * (6 + i * .3) })
   this.refreshQueue()
  }
 }
 /** Port handed to the weapon system so it can strike without reaching into private state. */
 private get combat(): CombatPort { return { state: this.state, hit: (enemy, layers, preserve, source) => this.hit(enemy, layers, preserve, source), effect: (kind, at, value) => this.effect(kind, at, value), random: () => this.random() } }
 /** Movement multiplier from the wave director; derived from time, so it is not saved. */
 private haste = 1
 private random() { const s = this.state; return createSeededRng(`${s.seed}:${s.rng++}`).nextFloat() }
 private pick<T>(list: readonly T[]) { return list[Math.floor(this.random() * list.length)]! }
 private effect(kind: DungeonState["effects"][number]["kind"], at: Point, value = 0, to?:Point, source?: DamageSource) {
  const s = this.state
  // A full horde must not evict its cast cue with 128 subsequent hit/pickup cues.
  if (s.effects.length >= B.effects) {const minor=s.effects.findIndex(fx=>fx.kind==="shatter"||fx.kind==="pickup"||fx.kind==="hit");s.effects.splice(Math.max(0,minor),1)}
  s.effects.push({ id: s.nextId++, kind, x: at.x, z: at.z, life: ["heal","mana","shield","pickup","treasure","level","upgrade","block","barrier","finisher"].includes(kind)?1.35:.55, value, ...(to?{to:{x:to.x,z:to.z}}:{}),...(source?{source}:{}) })
 }
 start() { if (this.state.phase === "ready") this.state.phase = "arena" }
 pause() {
  const s = this.state
  if (s.phase === "dead" || s.phase === "ready" || s.phase === "paused") return
  s.resumePhase = s.phase; s.phase = "paused"
 }
 resume() { if (this.state.phase === "paused") this.state.phase = this.state.resumePhase }
 setLabelLimit(limit: number) { this.state.labelLimit = limit < 6 ? 4 : 6; this.refreshQueue() }
 cancel() { this.state.prefix = ""; this.state.target = null; this.state.command = ""; this.refreshQueue() }

 spawn(kind: EnemyKind, at?: Point): DungeonEnemy | undefined {
  const s = this.state
  if (s.enemies.length >= B.enemies || kind === "boss" && s.boss !== null || kind in dungeonSupplies && s.enemies.some(e=>e.kind===kind)) return
  const angle = this.random() * Math.PI * 2
  const radius=at?B.spawnRadius:6+this.random()*(B.spawnRadius-6)
  let position = at ?? { x: s.player.x + Math.sin(angle) * radius, z: s.player.z + Math.cos(angle) * radius }
  const valid=(p:Point)=>dungeonWalkable(p)&&(!!at||reachable(s.player,p)&&!s.enemies.some(e=>distance(e,p)<1))
  for (let i = 0; i < 16 && !valid(position); i++) position = { x: s.player.x + Math.sin(angle + (i + 1)*2.399) * radius, z: s.player.z + Math.cos(angle + (i + 1)*2.399) * radius }
  if (!valid(position)) return
  const layers = kind === "boss" ? 3 + Math.min(2, s.biome) : kind === "minotaur" ? Math.min(5, 3 + Math.floor(s.time / 900)) : kind === "guard" ? 2 : kind === "deathknight" ? Math.min(4, 3 + Math.floor(s.time / 900)) : enemyProfiles[kind]?.layers ?? 1
  const words = Array.from({ length: layers }, (_, i) => this.drawWord(kind,layers-i,i===0))
  const health = kind === "boss" ? B.bossHealth * (1 + s.biome * .5) : layers
  const enemy: DungeonEnemy = { id: s.nextId++, kind, ...position, words, speed: B.speed * enemySpeed[kind] * (.88+this.random()*.24) * (.7+.3*Math.min(1,s.time/B.openingSeconds)) * (1 + Math.min(.7, s.time / 700) + Math.min(.3, s.biome * .06)), frozen: 0, attack: kind === "bomber" ? 20 : kind === "mage" ? 5.5 : kind==="minotaur"||kind==="boss"?6+this.random()*2:this.openingTimer(kind), health, maxHealth: health }
  s.enemies.push(enemy)
  if (kind === "boss") { s.boss = enemy.id; s.notice = "Obsidian Minotaur — break its armor." }
  return enemy
 }
 /** First ability timer for the newer combatants: staggered so a fresh pack does not act in unison. */
 private openingTimer(kind: EnemyKind) {
  const lunge=enemyLunges[kind],base=lunge?lunge.cooldown*.6:{archer:2.4,imp:2,shaman:3.5,necromancer:4.5,wraith:2.5,troll:6}[kind as string]
  return base===undefined?0:base*(.7+this.random()*.6)
 }
 private drawWord(kind:EnemyKind,layers:number,first:boolean) {
  const s=this.state,style=commonWordStyle[kind]
  let source:readonly string[]=s.time>=900&&(kind==="skeleton"||kind==="goblin")?dungeonLongWords[s.language]:dungeonWords[s.language][kind]
  // Nearly half of eligible words come from everyday vocabulary, re-cased to the foe's own style.
  if(style&&this.random()<.45)source=commonWords[s.language].filter(w=>w.length>=3&&w.length<=style.max).map(w=>style.style==="lower"?w:style.style==="upper"?w.toUpperCase():w[0]!.toUpperCase()+w.slice(1))
  const pool=[...new Set(source.map(word=>this.modifyWord(word,kind,layers)))],used=s.enemies.map(e=>e.words[0]?.[0])
  const unique=first?pool.filter(word=>!used.includes(word[0])):pool,candidates=unique.length?unique:pool
  const fresh=candidates.filter(word=>!s.recentWords.includes(word)),oldest=Math.min(...candidates.map(word=>s.recentWords.indexOf(word)))
  const word=this.pick(fresh.length?fresh:candidates.filter(word=>s.recentWords.indexOf(word)===oldest))
  s.recentWords.push(word);if(s.recentWords.length>24)s.recentWords.shift()
  return word
 }
 private modifyWord(word: string, kind: EnemyKind, layers: number) {
  const s = this.state
  if (s.relics.glasses && (kind === "mage" || kind === "bomber")) word = word.replace(/[^\p{L}\p{N}]/gu, "")
  if (s.relics.execute && layers === 1 && (kind === "minotaur" || kind === "boss")) word = word.slice(0, 3)
  return word
 }
 refreshQueue() {
  const s = this.state
  const priority = (e: DungeonEnemy) => distance(e, s.player) - (e.id === s.target ? 100 : 0) - (e.kind === "bomber" ? 4 : e.kind === "boss" ? 3 : 0) - (s.queue.includes(e.id) ? .6 : 0)
  const initials=new Set<string>()
  s.queue = s.enemies.filter(e => e.words.length && (e.id === s.target || distance(e, s.player) < 12 && reachable(s.player, e))).sort((a, b) => priority(a) - priority(b) || a.id - b.id).filter(e=>{const initial=e.words[0]![0]!;if(initials.has(initial))return false;initials.add(initial);return true}).slice(0, s.labelLimit).map(e => e.id)
 }
 targets() { return this.state.queue.map(id => this.state.enemies.find(e => e.id === id)!).filter(Boolean) }

 input(key: string) {
  const s = this.state
  if (key === "Escape") { if (s.phase === "paused") this.resume(); else this.pause(); return }
  if (key === "Tab" && (s.phase === "arena" || s.phase === "skills")) { s.phase = s.phase === "arena" ? "skills" : "arena"; s.command = ""; return }
  if (key === "Backspace" && ["arena", "skills", "draft"].includes(s.phase)) { if (s.phase === "arena") this.cancel(); else s.command = ""; return }
  if (Array.from(key).length !== 1 || !["arena", "skills", "draft", "overdrive"].includes(s.phase)) return
  if (s.phase === "draft" || s.phase === "skills") { this.commandKey(key); return }
  if (s.phase === "overdrive") {
   if (key !== s.paragraph[s.cursor]) { this.typo();const boss=s.enemies.find(e=>e.id===s.boss)!;if(boss.frozen<=0)this.moveEnemy(boss,1,s.player,Math.min(.55,Math.max(0,distance(boss,s.player)-1.9)));if(s.bossArena){s.bossArena.rage=2;s.bossArena.calm=0}s.stagger=Math.min(s.stagger,.7);return }
   s.cursor++; this.correct(key)
   // Each correct letter buys a short hold: a steady typist of any speed keeps the boss at bay; hesitation lets it close in.
   if(s.bossArena)s.bossArena.calm=Math.min(B.duelCalmMax,s.bossArena.calm+B.duelCalmPerKey)
   if(key===" ")s.player.invincible=Math.max(s.player.invincible,.8)
   const boss = s.enemies.find(e => e.id === s.boss)!
   const d=distance(boss,s.player),retreat={x:boss.x+(boss.x-s.player.x)/Math.max(.1,d)*.14,z:boss.z+(boss.z-s.player.z)/Math.max(.1,d)*.14}
   if(d<4.5&&dungeonWalkable(retreat)&&reachable(boss,retreat)){boss.x=retreat.x;boss.z=retreat.z}
   if(key===" "){
    const side=Math.floor(s.cursor/5)%2?1:-1,range=Math.max(.1,distance(s.player,boss)),step={x:s.player.x+(s.player.z-boss.z)/range*side*.65,z:s.player.z-(s.player.x-boss.x)/range*side*.65}
    if((!s.bossArena||distance(step,s.bossArena)<B.barrierRadius-2)&&dungeonWalkable(step)&&reachable(s.player,step)){s.player.dashFrom={x:s.player.x,z:s.player.z};s.player.x=step.x;s.player.z=step.z;s.player.dashAt=s.worldTime}
   }
   const ultimate = s.paragraph.slice(0, s.cursor).endsWith("BLIZZARD"), complete = s.cursor === s.paragraph.length
   boss.health = Math.max(complete ? 0 : 1, boss.health - (ultimate ? 45 : 2))
   this.effect(ultimate ? "storm" : "slash", boss, ultimate ? 45 : 2)
   if (complete) {
    if (boss.health === 0) this.kill(boss)
    else { this.rearmBoss(boss); s.notice = "Combo complete. Break the next armor set." }
   }
   return
  }
  if (s.target === null) {
   this.refreshQueue()
   const enemy = this.targets().find(e => e.words[0]![0] === key)
   if (!enemy) { this.typo(); return }
   s.target = enemy.id
  }
  const target = s.enemies.find(e => e.id === s.target)
  if (!target) { this.cancel(); return }
  const word = target.words[0]!
  if (key !== word[s.prefix.length]) { this.typo(); return }
  s.prefix += key; this.correct(key)
  if (s.prefix.length !== word.length) return
  s.words++; s.player.mana = Math.min(100, s.player.mana + 5)
  const reduction = s.relics.overclock && runWpm(s) > 100 ? 2 : 1
  skillIds.forEach(id => { s.skills[id].cooldown = Math.max(0, s.skills[id].cooldown - reduction) })
  s.player.dashFrom = { x: s.player.x, z: s.player.z }
  const landing=this.strikePosition(target,target.kind==="boss"?3.5:target.words.length>1?2.2:1)
  s.player.x=landing.x;s.player.z=landing.z
  s.player.dashAt = s.worldTime; s.player.invincible = Math.max(s.player.invincible, B.dashGrace)
  // Final layer of an armored foe: a fatality whose shockwave chips everything around it.
  const finisher=target.words.length===1&&target.maxHealth>=2&&target.kind!=="boss"&&!objects.includes(target.kind)
  this.effect(finisher?"finisher":"slash", target, finisher?target.maxHealth:1); s.target = null; s.prefix = ""
  if (s.relics.switch) for (const e of s.enemies.filter(e=>!objects.includes(e.kind))) { const d = distance(e, s.player); if (d > 0 && d < 4) { const next={x:e.x+(e.x-s.player.x)/d,z:e.z+(e.z-s.player.z)/d};if(dungeonWalkable(next)){e.x=next.x;e.z=next.z} } }
  this.hit(target, 1, false)
  if(finisher){s.player.invincible=Math.max(s.player.invincible,.9);for(const e of [...s.enemies])if(e!==target&&!(e.kind in dungeonSupplies)&&e.id!==s.boss&&distance(e,target)<(target.maxHealth>=3?3.6:2.6))this.hit(e,1,true,"finisher")}
  // Every eighth word ends in a whirlwind that sweeps adjacent foes.
  if(s.words%8===0){this.effect("whirl",s.player,1);for(const e of [...s.enemies])if(!(e.kind in dungeonSupplies)&&e.id!==s.boss&&distance(e,s.player)<2.4)this.hit(e,1,true,"whirl")}
  if(target.words.length&&(target.kind==="boss"||target.kind==="minotaur")){target.motion="recover";target.motionTime=1;target.aim={x:s.player.x,z:s.player.z}}
  this.collectLoot()
  this.openDraft()
  this.refreshQueue()
 }
 private commandKey(key: string) {
  const s = this.state
  const ids: UpgradeId[] = s.phase === "draft" ? s.offers : skillIds
  const keyword = (id: UpgradeId) => s.phase === "draft" ? dungeonUpgrades[id][s.language] : skillRules[id as SkillId][s.language]
  const next = s.command + key
  const eligible = ids.filter(id => keyword(id).startsWith(next))
  if (!eligible.length) { s.command = ""; s.notice = "That keyword does not match the displayed case. Use Shift or Caps Lock for capitals."; return }
  s.command = next
  const id = eligible.find(id => keyword(id) === next)
  if (id === undefined) return
  if (s.phase === "draft") this.chooseUpgrade(id)
  else this.cast(id as SkillId)
 }
 private typo() { const s = this.state; s.errors++; s.streak = 0; s.notice = "Miss — keep the same next letter." }
 private correct(key: string) {
  const s = this.state
  s.correct++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak)
  if (s.streak % 50 === 0) { this.collectLoot(true); this.effect("magnet", s.player); s.notice = "50 clean characters — XP magnet!" }
  if (s.phase === "overdrive") return
  if (s.relics.lightning && s.correct % 10 === 0 && !s.procs.lightning) {
   const victims=s.enemies.filter(e=>e.id!==s.target&&e.id!==s.boss&&!objects.includes(e.kind)&&distance(e,s.player)<7).slice(0,2)
   for(const e of victims){this.effect("lightning",s.player,1,e,"lightning");this.hit(e,1,true,"lightning")}
   if(victims.length)s.procs.lightning=4
  }
  if (s.relics.vowels && !s.procs.vowels && /[aeiou]/i.test(key)) {
   const candidates = s.enemies.filter(e => e.id !== s.boss && e.id !== s.target && !objects.includes(e.kind) && distance(e, s.player) < 8)
   if (candidates.length) { const e = this.pick(candidates); this.effect("firebolt", s.player, 1, e, "vowels"); this.hit(e, 1, true, "vowels"); s.procs.vowels=2.4 }
  }
 }
 skillBlocked(id: SkillId) {
  const s = this.state, skill = s.skills[id], cost = this.skillCost(id)
  return skill.cooldown > 0 ? `Complete ${skill.cooldown} more words` : s.player.mana < cost ? `Need ${cost} mana` : id === "heal" && s.player.hp >= s.player.maxHp ? "Health is full" : ""
 }
 skillCost(id: SkillId) { return Math.max(10, skillRules[id].cost - (this.state.skills[id].level - 1) * 5) }
 cast(id: SkillId) {
  const s = this.state
  if (s.phase !== "skills") return false
  const reason = this.skillBlocked(id)
  s.command = ""
  if (reason) { s.notice = reason; return false }
  const level = s.skills[id].level
  s.player.mana -= this.skillCost(id); s.skills[id].cooldown = skillRules[id].words
  if (id === "heal") {
   const restored=Math.min(2,s.player.maxHp-s.player.hp);s.player.hp += restored
   if (level === 3) s.player.invincible = Math.max(s.player.invincible, 4)
   this.effect("heal", s.player, restored)
  } else {
   this.effect(id === "storm" ? "storm" : "slash", s.player, level === 3 ? 2 : 1)
   this.area(id === "storm" ? 12 : 4 * (1 + .4 * (level - 1)), level === 3 && id === "cleave" ? 2 : 1, id)
   if (id === "cleave" && level === 3) this.collectLoot(true)
   if (id === "storm" && level === 3) for (const e of s.enemies) {
    e.frozen = 5
    if (e.id !== s.target) e.words = e.words.map(w => w.slice(0, Math.ceil(w.length / 2)))
   }
  }
  s.phase = "arena"; s.notice = `${skillRules[id][s.language]} cast.`
  if (s.boss !== null && !s.enemies.find(e => e.id === s.boss)!.words.length) this.staggerBoss()
  else this.openDraft()
  this.refreshQueue(); return true
 }
 private area(radius: number, layers: number, source: DamageSource) {
  for (const e of [...this.state.enemies].filter(e => !(e.kind in dungeonSupplies) && distance(e, this.state.player) < radius)) this.hit(e, layers, true, source)
 }
 private hit(enemy: DungeonEnemy, layers: number, preserve: boolean, source: DamageSource = "blade") {
  const s = this.state
  if (!s.enemies.includes(enemy) || !enemy.words.length) return
  const amount = Math.min(layers, Math.max(0, enemy.words.length - (preserve && enemy.id === s.target ? 1 : 0)))
  if (!amount) return
  if(preserve&&enemy.kind in dungeonSupplies)return
  if (preserve) enemy.words.splice(enemy.id === s.target ? 1 : 0, amount)
  else enemy.words.splice(0, amount)
  this.effect("shatter", enemy, amount, undefined, source)
  if (enemy.kind === "troll") enemy.attack = 6
  if (!enemy.words.length) {
   if (enemy.kind === "boss") { if (s.phase !== "skills") this.staggerBoss() }
   else this.kill(enemy)
  } else if (enemy.id !== s.target) enemy.words[0] = this.modifyWord(enemy.words[0]!, enemy.kind, enemy.words.length)
 }
 private kill(enemy: DungeonEnemy) {
  const s = this.state
  s.enemies = s.enemies.filter(e => e !== enemy)
  if(enemy.kind in dungeonSupplies){
   const kind=enemy.kind as SupplyKind;s.supplies[kind]=Math.min(1000000,s.supplies[kind]+1)
   if(kind==="shield"){s.player.shield=Math.min(4,s.player.shield+2);this.effect("shield",s.player,s.player.shield)}
   if(kind==="potion"){const restored=Math.min(2,s.player.maxHp-s.player.hp);s.player.hp+=restored;this.effect("heal",s.player,restored)}
   if(kind==="mana"){const restored=Math.min(40,100-s.player.mana);s.player.mana+=restored;this.effect("mana",s.player,restored)}
   if(kind==="sentry"){s.sentry={x:enemy.x,z:enemy.z,life:18,cooldown:.3};this.effect("deploy",enemy,18)}
   s.notice=`${dungeonSupplies[kind].name} acquired. ${dungeonSupplies[kind].benefit}`
   this.effect("pickup",enemy,0);this.refreshQueue();return
  }
  if(!objects.includes(enemy.kind))s.kills++
  const boss = enemy.kind === "boss"
  const value = boss ? 250 : enemy.kind === "minotaur" ? 60 : enemy.kind === "chest" ? 50 : enemyProfiles[enemy.kind]?.xp ?? 25
  const drop = { id: s.nextId++, x: enemy.x, z: enemy.z, xp: value, gold: boss ? 100 : enemy.kind === "chest" ? 25 : 3, mana: enemy.kind === "mage" ? 20 : 0 }
  if (s.loot.length < B.loot) s.loot.push(drop)
  else { const existing = s.loot[0]!; existing.xp += drop.xp; existing.gold += drop.gold; existing.mana += drop.mana }
  this.effect(enemy.kind === "chest" ? "treasure" : "hit", enemy, value)
  if(enemy.kind === "chest")s.notice="Chest opened. +25 gold · +50 XP. Rewards collected on your dash."
  if (boss) {
   s.boss = null; s.bossArena=null; s.stagger = 0; s.biome++; s.phase = "arena"; s.notice = "Boss defeated — a new depth opens. Legendary draft!"
   s.pendingDrafts++;s.legendaryDrafts++; this.collectLoot(true); this.openDraft()
  } else if (enemy.kind === "sporeling") {
   this.effect("spore", enemy, 3)
   for (const e of s.enemies) if (e.id !== s.boss && !objects.includes(e.kind) && distance(e, enemy) < 3) e.frozen = Math.max(e.frozen, 2)
  } else if (enemy.kind === "bomber" || enemy.kind === "barrel") {
   this.effect("blast", enemy, 1)
   for (const e of [...s.enemies]) if (distance(e, enemy) < 4) this.hit(e, 1, true, "explosion")
  }
  this.refreshQueue()
 }
 private strikePosition(enemy: Point, spacing: number, approach: Point = this.state.player): Point {
  const p=this.state.player,from=distance(approach,enemy)>.1?approach:p.dashFrom
  const angle=Math.atan2(from.x-enemy.x,from.z-enemy.z)
  for(let i=0;i<12;i++){
   const point={x:enemy.x+Math.sin(angle+i*Math.PI/6)*spacing,z:enemy.z+Math.cos(angle+i*Math.PI/6)*spacing}
   if(dungeonWalkable(point)&&reachable(enemy,point))return point
  }
  return {x:p.x,z:p.z}
 }
 private staggerBoss() {
  const s = this.state
  const boss=s.enemies.find(e=>e.id===s.boss)!
  if(distance(s.player,boss)<3){const retreat=this.strikePosition(boss,3.5);s.player.x=retreat.x;s.player.z=retreat.z}
  delete boss.motion;delete boss.motionTime;delete boss.aim
  this.startBossArena()
  s.phase = "overdrive"; s.stagger = B.stagger; s.target = null; s.prefix = ""; s.command = ""; s.cursor = 0
  s.paragraph = this.pick(bossPassages[s.language]).split(" BLIZZARD")[0]+" BLIZZARD"; s.notice = "BOSS DUEL — armor broken, arena cleared. Every letter is a strike!"
 }
 /** Nearest point whose whole barricade ring (plus a margin) is open floor reachable from the hero. */
 private arenaCenter(): Point {
  const p=this.state.player,R=B.barrierRadius+1.5
  const clear=(c:Point)=>{for(let a=0;a<16;a++)for(let r=0;r<=R;r+=R/3)if(!dungeonWalkable({x:c.x+Math.sin(a*Math.PI/8)*r,z:c.z+Math.cos(a*Math.PI/8)*r}))return false;return reachable(p,c)}
  for(let r=0;r<=16;r+=1.5)for(let a=0;a<(r?12:1);a++){const c={x:p.x+Math.sin(a*Math.PI/6)*r,z:p.z+Math.cos(a*Math.PI/6)*r};if(clear(c))return c}
  return {x:p.x,z:p.z}
 }
 /** Outside the barricade on open floor, or null when no such point exists. */
 private outsideRing(from: Point): Point | null {
  const wall=this.state.bossArena!,p=this.strikePosition(wall,B.barrierRadius+.8,from)
  return distance(p,wall)>B.barrierRadius+.5?p:null
 }
 private startBossArena() {
  const s=this.state
  if(s.bossArena)return
  // Clear the stage: open floor away from ruins, no loose items or shots, horde outside the fence.
  const center=this.arenaCenter()
  if(distance(center,s.player)>.1){s.player.dashFrom={x:s.player.x,z:s.player.z};s.player.x=center.x;s.player.z=center.z;s.player.dashAt=s.worldTime}
  s.bossArena={x:center.x,z:center.z,hp:B.barrierHp,cooldown:0,rage:0,calm:B.duelCalmMax};s.spawnAt=3;s.projectiles=[];s.sentry=null
  for(const e of [...s.enemies]){
   if(e.id===s.boss){if(distance(e,center)<3||distance(e,center)>B.barrierRadius-1){const at=this.strikePosition(center,3.5,e);e.x=at.x;e.z=at.z}continue}
   if(objects.includes(e.kind)){if(distance(e,center)<B.barrierRadius+3){this.effect("blink",e,0);s.enemies=s.enemies.filter(x=>x!==e)}continue}
   if(distance(e,center)<B.barrierRadius+.7){const at=this.outsideRing(e);if(at){e.x=at.x;e.z=at.z;delete e.motion;delete e.motionTime;delete e.aim}else s.enemies=s.enemies.filter(x=>x!==e)}
  }
  for(let i=0;i<3;i++){const at=this.outsideRing({x:center.x+Math.sin(i*2.1)*8,z:center.z+Math.cos(i*2.1)*8});if(at)this.spawn(i===1?"goblin":"skeleton",at)}
  s.notice="BOSS DUEL — items cleared and a barricade raised. Finish the line!"
 }
 private damageBarrier(at: Point, attacker: Point) {
  const wall=this.state.bossArena!
  if(wall.cooldown>0)return
  wall.hp=Math.max(0,wall.hp-1);wall.cooldown=.8
  this.effect("barrier",at,wall.hp,attacker)
  if(!wall.hp)this.state.notice="BARRICADE BROKEN — the horde can reach you. Keep finishing the same line!"
 }
 private advanceBossDuel(dt: number) {
  const s=this.state,boss=s.enemies.find(e=>e.id===s.boss)!
  this.startBossArena();const wall=s.bossArena!
  wall.cooldown=Math.max(0,wall.cooldown-dt);wall.rage=Math.max(0,wall.rage-dt);wall.calm=Math.max(0,wall.calm-dt);s.stagger=Math.max(0,s.stagger-dt)
  if(boss.frozen>0){boss.frozen=Math.max(0,boss.frozen-dt);return}
  if(boss.motion){
   boss.motionTime=Math.max(0,boss.motionTime!-dt)
   if(boss.motionTime===0){
    if(boss.motion==="windup"){
     this.effect("slam",boss,3)
     if(distance(boss,s.player)<2.8){if(s.player.invincible>0)this.effect("block",s.player,0);else this.damage(1)}
     boss.motion="recover";boss.motionTime=.65;s.stagger=B.stagger
    }else {delete boss.motion;delete boss.motionTime;delete boss.aim}
   }
  }else if(distance(boss,s.player)<2.7&&s.stagger===0&&wall.calm===0){boss.motion="windup";boss.motionTime=.8;boss.aim={x:s.player.x,z:s.player.z}}
  else {
   // Calm: circle at a standoff outside hammer reach. Hesitation: close to striking range. Typo rage: rush.
   const held=wall.calm>0&&wall.rage===0,ring=held?B.duelStandoff:2.2
   const d=Math.max(.1,distance(boss,s.player)),weave=Math.sin(s.worldTime*1.3)*.8
   this.moveEnemy(boss,dt,{x:s.player.x+(boss.x-s.player.x)/d*ring+(s.player.z-boss.z)/d*weave,z:s.player.z+(boss.z-s.player.z)/d*ring-(s.player.x-boss.x)/d*weave},held?.45:Math.min(.8,.35+boss.speed)+(wall.rage>0?.8:0))
  }
  if(s.spawnAt<=0&&s.enemies.filter(e=>!objects.includes(e.kind)&&e.id!==s.boss).length<8){const p=this.outsideRing({x:wall.x+Math.sin(s.worldTime)*8,z:wall.z+Math.cos(s.worldTime)*8});if(p)this.spawn(this.pick(["skeleton","goblin","bat"] as const),p);s.spawnAt=3}
 }
 private rearmBoss(boss: DungeonEnemy) {
  const s=this.state,layers=3+Math.min(2,s.biome)
  boss.words=Array.from({length:layers},(_,i)=>this.drawWord("boss",layers-i,i===0));s.phase="arena";s.stagger=0;s.paragraph="";s.cursor=0;s.bossArena=null
 }
 private moveEnemy(e:DungeonEnemy,dt:number,player:Point=this.state.player,speed=e.speed) {
  if(e.waypoint&&(distance(e,e.waypoint)<.3||reachable(e,player)))delete e.waypoint
  let goal=e.waypoint??player,d=Math.max(.01,distance(e,goal))
  let next={x:e.x+(goal.x-e.x)/d*Math.min(d,speed*dt),z:e.z+(goal.z-e.z)/d*Math.min(d,speed*dt)}
  if(!dungeonWalkable(next)){
   const ruin=ruinAt(next)!
   const corners=[-1,1].flatMap(x=>[-1,1].map(z=>({x:ruin.x+x*(ruin.halfWidth+.8),z:ruin.z+z*(ruin.halfDepth+.8)})))
   e.waypoint=corners.filter(p=>distance(e,p)>.5&&reachable(e,p)).sort((a,b)=>distance(e,a)+distance(a,player)-distance(e,b)-distance(b,player))[0]
   if(!e.waypoint)return
   goal=e.waypoint;d=Math.max(.01,distance(e,goal));next={x:e.x+(goal.x-e.x)/d*Math.min(d,speed*dt),z:e.z+(goal.z-e.z)/d*Math.min(d,speed*dt)}
  }
  e.x=next.x;e.z=next.z
 }
 private steerEnemy(e:DungeonEnemy,dt:number) {
  const s=this.state,p=s.player,d=distance(e,p),dx=(p.x-e.x)/Math.max(.01,d),dz=(p.z-e.z)/Math.max(.01,d),phase=s.worldTime+e.id*.73
  const lunge=enemyLunges[e.kind]
  if(lunge&&(lunge.from??0)<=s.time){
   if(e.motion){
    e.motionTime=Math.max(0,(e.motionTime??0)-dt)
    if(e.motion==="windup"&&e.motionTime===0){
     if(e.aim&&distance(e,e.aim)<.1){e.motion="slam";e.motionTime=.6;this.effect("slam",e,3);if(d<(lunge.slam??3))this.damage(1)}
     else {e.motion="charge";e.motionTime=lunge.time}
    }
    else if(e.motion==="charge"){
     if(e.aim)this.moveEnemy(e,dt,e.aim,e.speed*lunge.mult)
     if(e.motionTime===0||e.aim&&distance(e,e.aim)<.2){e.motion="recover";e.motionTime=lunge.recover}
    }else if(e.motion==="slam"&&e.motionTime===0){e.motion="recover";e.motionTime=lunge.recover}
    else if(e.motion==="recover"&&e.motionTime===0){delete e.motion;delete e.motionTime;delete e.aim;e.attack=e.kind==="minotaur"||e.kind==="boss"?6+e.id%3:lunge.cooldown+e.id%3*.4}
    return
   }
   e.attack-=dt
   if(e.speed&&e.attack<=0&&d>lunge.min&&d<lunge.max&&reachable(e,p)){e.motion="windup";e.motionTime=lunge.windup;e.aim=lunge.slam||e.kind==="boss"&&Math.floor(s.worldTime/7)%2===0?{x:e.x,z:e.z}:{x:p.x,z:p.z};return}
  }
  if(!e.speed)return
  // A mimic sits still as loot until the hero comes within reach.
  if(e.kind==="mimic"&&d>3.6)return
  let goal:Point=p,speed=e.speed*this.haste*(e.id===s.target ? .65:1)
  if(e.kind==="mage"){
   const radial=d<4.5?-1:d>6.5?1:0,side=e.id%2?1:-1
   goal={x:e.x+dx*radial*2-dz*side,z:e.z+dz*radial*2+dx*side}
  }else if(e.kind==="gargoyle"){
   const r=Math.max(.1,d),ox=(e.x-p.x)/r,oz=(e.z-p.z)/r,side=e.id%2?1:-1
   goal={x:p.x+ox*4-oz*side*1.4,z:p.z+oz*4+ox*side*1.4}
  }else if(e.kind==="ghoul"){
   const flank=d>2.5?1:0;goal={x:p.x+dz*flank*(e.id%2?1:-1),z:p.z-dx*flank*(e.id%2?1:-1)};speed*=1+Math.max(0,Math.sin(phase*2.2))*.5
  }else if(e.kind==="goblin"||e.kind==="bat"){
   const weave=Math.sin(phase*(e.kind==="bat"?2.4:1.6))*(e.kind==="bat"?1.1:.75)
   goal={x:p.x-dz*weave,z:p.z+dx*weave};speed*=e.kind==="goblin"&&Math.sin(phase*1.7)>.8?1.4:1
  }else if(e.kind==="skeleton")goal={x:p.x-dz*Math.sin(phase)*.28,z:p.z+dx*Math.sin(phase)*.28}
  else if(e.kind==="bomber"&&e.attack<2)speed*=1.45
  else if(e.kind==="archer"||e.kind==="necromancer"||e.kind==="shaman"){
   // Back-line casters hold a ring and strafe instead of closing to melee.
   const [near,far]=e.kind==="archer"?[5.5,8]:e.kind==="necromancer"?[5,7]:[4.5,6.5],radial=d<near?-1:d>far?1:0,side=Math.sin(phase*.5)>0?1:-1
   goal={x:e.x+dx*radial*2-dz*side*(e.kind==="archer"?1.2:.6),z:e.z+dz*radial*2+dx*side*(e.kind==="archer"?1.2:.6)}
  }else if(e.kind==="imp"){
   const fleeing=e.attack>2.4,radial=fleeing?-1:d>3.5?1:0,side=e.id%2?1:-1
   goal={x:e.x+dx*radial*2-dz*side,z:e.z+dz*radial*2+dx*side};speed*=fleeing?1.25:1
  }else if(e.kind==="wolf"){
   const flank=d>3?1.4:0
   goal={x:p.x-dz*flank*(e.id%2?1:-1),z:p.z+dx*flank*(e.id%2?1:-1)}
  }else if(e.kind==="slime")speed*=Math.max(0,Math.sin(phase*2.4))*2.2
  else if(e.kind==="spider"){
   const jitter=Math.sin(phase*4.3)*1.2+Math.sin(phase*1.7)*.6
   goal={x:p.x-dz*jitter,z:p.z+dx*jitter};speed*=Math.sin(phase*3.1)>-.2?1.3:0
  }else if(e.kind==="rat"){const jitter=Math.sin(phase*7)*.35;goal={x:p.x-dz*jitter,z:p.z+dx*jitter};speed*=1+Math.sin(phase*5)*.25}
  else if(e.kind==="serpent"){const wave=Math.sin(phase*2)*1.4;goal={x:p.x-dz*wave,z:p.z+dx*wave}}
  else if(e.kind==="assassin"){
   // Stalks toward the hero's back: opposite the direction of the last dash.
   const fx=p.x-p.dashFrom.x,fz=p.z-p.dashFrom.z,f=Math.hypot(fx,fz)
   if(f>.1)goal={x:p.x-fx/f*1.4,z:p.z-fz/f*1.4};if(d>4)speed*=1.5
  }else if(e.kind==="wisp"){
   const r=Math.max(.1,d),ox=(e.x-p.x)/r,oz=(e.z-p.z)/r
   goal={x:p.x+ox*3.2-oz*1.6,z:p.z+oz*3.2+ox*1.6}
  }
  if(d>.8||e.kind==="gargoyle"||e.kind==="mage"||e.kind==="archer"||e.kind==="necromancer"||e.kind==="shaman"||e.kind==="imp"||e.kind==="wisp")this.moveEnemy(e,dt,goal,speed)
  this.ability(e,dt)
 }
 /** Non-lunge special abilities: ranged shots, wards, summons, blinks and regeneration. */
 private ability(e:DungeonEnemy,dt:number) {
  const s=this.state,p=s.player
  if(!["archer","imp","shaman","necromancer","wraith","troll"].includes(e.kind))return
  e.attack-=dt
  if(e.attack>0)return
  const d=distance(e,p)
  if(e.kind==="archer"||e.kind==="imp"){
   const fast=e.kind==="archer"?4.5:3.2
   // Veteran archers loose a three-arrow fan instead of a single shot.
   const spread=e.kind==="archer"&&s.time>=180?[-.22,0,.22]:[0]
   if(d<(e.kind==="archer"?9:6)&&reachable(e,p))for(const turn of spread){if(s.projectiles.length>=B.projectiles)break;const a=Math.atan2(p.x-e.x,p.z-e.z)+turn;s.projectiles.push({id:s.nextId++,x:e.x,z:e.z,vx:Math.sin(a)*fast,vz:Math.cos(a)*fast,life:e.kind==="archer"?4:2.5})}
   e.attack=e.kind==="archer"?3.6+e.id%3*.3:4
  }else if(e.kind==="shaman"){
   const ally=s.enemies.filter(a=>a!==e&&a.id!==s.target&&a.id!==s.boss&&!objects.includes(a.kind)&&a.kind!=="shaman"&&a.words.length<3&&distance(a,e)<5).sort((a,b)=>distance(a,e)-distance(b,e))[0]
   if(ally){ally.words.push(this.drawWord(ally.kind,1,false));ally.health=Math.max(ally.health,ally.words.length);ally.maxHealth=Math.max(ally.maxHealth,ally.health);this.effect("ward",ally,ally.words.length,e)}
   e.attack=6
  }else if(e.kind==="necromancer"){
   const threats=s.enemies.filter(a=>!objects.includes(a.kind)).length
   if(threats<B.preBossThreats&&s.enemies.length<B.enemies){const at=this.strikePosition(e,1.4);if(distance(at,e)>.5&&this.spawn("skeleton",at))this.effect("summon",at,1,e)}
   e.attack=8.5
  }else if(e.kind==="wraith"){
   if(d>2.5){const step=Math.min(2.6,d-1.5),to={x:e.x+(p.x-e.x)/d*step,z:e.z+(p.z-e.z)/d*step};if(dungeonWalkable(to)&&reachable(e,to)){this.effect("blink",e,0,to);e.x=to.x;e.z=to.z}}
   e.attack=3.4
  }else {
   if(e.words.length<3&&e.id!==s.target){e.words.push(this.drawWord("troll",1,false));this.effect("ward",e,e.words.length)}
   e.attack=6
  }
 }
 gainXp(value: number) {
  const s = this.state
  const before=s.level
  const bonus = s.relics.magnet && runWpm(s) > 60 ? 1.2 : 1
  s.xp += Math.floor(value * bonus); s.totalXp += Math.floor(value * bonus)
  while (s.xp >= xpThreshold(s.level)) { s.xp -= xpThreshold(s.level); s.level++; s.pendingDrafts++ }
  if(s.level>before)this.effect("level",s.player,s.level)
 }
 private collectLoot(all = false) {
  const s = this.state
  const radius = B.pickupRadius * (1 + s.relics.magnet * .5)
  s.loot = s.loot.filter(loot => {
   if (!all && distance(loot, s.player) > radius) return true
   this.gainXp(loot.xp); s.gold += loot.gold; s.player.mana = Math.min(100, s.player.mana + loot.mana)
   this.effect("pickup", loot, loot.xp); return false
  })
 }
 private openDraft() {
  const s = this.state
  if (!s.pendingDrafts || s.boss !== null || s.phase === "overdrive" || s.phase === "dead" || s.phase === "draft") return
  s.afterDraft = s.phase; s.phase = "draft"; s.command = ""
  const eligible = (Object.keys(dungeonUpgrades) as UpgradeId[]).filter(id => this.upgradeLevel(id) < dungeonUpgrades[id].max&&(!s.legendaryDrafts||relicIds.includes(id as RelicId)||isWeaponId(id)))
  s.offers = []
  // Until two weapons are owned, every draft leads with an automatic weapon.
  const owned=weaponIds.filter(id=>s.weapons[id].level>0).length,weapons=eligible.filter(isWeaponId)
  if(owned<2&&weapons.length){const id=this.pick(weapons);s.offers.push(id);eligible.splice(eligible.indexOf(id),1)}
  while (eligible.length && s.offers.length < 3) { const index = Math.floor(this.random() * eligible.length); s.offers.push(eligible.splice(index, 1)[0]!) }
  // shortcut: after all finite upgrades, repeat the three active upgrades as restorative boons.
  for (const id of skillIds) if (s.offers.length < 3 && !s.offers.includes(id)) s.offers.push(id)
 }
 upgradeLevel(id: UpgradeId) { return skillIds.includes(id as SkillId) ? this.state.skills[id as SkillId].level : isWeaponId(id) ? this.state.weapons[id].level : this.state.relics[id as RelicId] }
 chooseUpgrade(id: UpgradeId) {
  const s = this.state
  if (s.phase !== "draft" || !s.offers.includes(id)) return false
  if (skillIds.includes(id as SkillId)) { const hp=s.player.hp,mana=s.player.mana; s.skills[id as SkillId].level = Math.min(3, s.skills[id as SkillId].level + 1); s.player.hp = Math.min(s.player.maxHp, s.player.hp + 1); s.player.mana = Math.min(100, s.player.mana + 15);this.effect("heal",s.player,s.player.hp-hp);this.effect("mana",s.player,s.player.mana-mana) }
  else if (isWeaponId(id)) { const w=s.weapons[id];w.level++;w.timer=Math.min(w.timer||1,1) }
  else s.relics[id as RelicId]++
  s.pendingDrafts--;s.legendaryDrafts=Math.max(0,s.legendaryDrafts-1); s.phase = s.afterDraft; s.command = ""; s.offers = []; s.notice = `${dungeonUpgrades[id].name} acquired. Rank ${this.upgradeLevel(id)} — ${dungeonUpgrades[id].description}${skillIds.includes(id as SkillId)?" Restore up to 1 heart and 15 mana.":""}`
  this.effect("upgrade",s.player,this.upgradeLevel(id));this.openDraft(); return true
 }
 damage(amount: number) {
  const s = this.state
  if (s.player.invincible > 0 || s.phase === "dead") return
  const absorbed=Math.min(amount,s.player.shield);s.player.shield-=absorbed
  if(absorbed){this.effect("block",s.player,absorbed);s.notice=s.player.shield?`Shield absorbed ${absorbed} damage.`:"Shield broken — health is exposed."}
  amount-=absorbed
  if(!amount){s.player.invincible=B.contactGrace;return}
  const lost=Math.min(s.player.hp,amount);s.player.hp-=lost; s.player.invincible = B.contactGrace; this.effect("hit", s.player, -lost)
  if (s.player.hp === 0) { s.phase = "dead"; s.notice = "The keep claimed this run. Your best is saved." }
 }
 advance(seconds: number) {
  const s = this.state
  if (!["arena", "skills", "overdrive"].includes(s.phase) || !Number.isFinite(seconds) || seconds <= 0) return
  const real = Math.min(seconds, .1), dt = real * (s.phase === "skills" ? .5 : 1)
  s.time += real; s.worldTime += dt; s.procs.lightning=Math.max(0,s.procs.lightning-dt);s.procs.vowels=Math.max(0,s.procs.vowels-dt); s.player.invincible = Math.max(0, s.player.invincible - dt)
  s.player.mana = Math.min(100, s.player.mana + real * B.manaRegen * (s.relics.overclock && runWpm(s) > 100 ? 2 : 1))
  s.effects = s.effects.filter(fx => { fx.life -= dt; return fx.life > 0 })
  const duel=s.phase==="overdrive"
  if(duel)this.advanceBossDuel(dt)
  if (!duel && s.time >= s.nextBoss && s.boss === null) {
   const boss = this.spawn("boss", { x: s.player.x + 5, z: s.player.z - 4 })
   if (boss) { s.nextBoss += B.bossInterval; if (s.phase === "skills") { s.phase = "arena"; s.command = "" } }
  }
  const opening=s.time<B.openingSeconds,learning=s.time<B.learningSeconds
  const wave=waveAt(s.time),pace=paceFor(wave)
  this.haste=duel?1:pace.haste
  if(!duel&&wave.phase==="surge"&&waveAt(s.time-real).phase!=="surge")this.launchSurge(wave.cycle)
  const floor=opening?2:learning?3:4,baseLimit=opening?B.openingThreats:learning?B.learningThreats:s.time<B.bossInterval?B.preBossThreats:B.enemies
  const limit=Math.min(B.enemies,Math.max(floor,baseLimit+pace.threatBonus))
  const interval=(opening?B.openingInterval:learning?B.learningInterval:B.spawnInterval)/pace.spawnRate
  s.spawnAt = Math.max(0,s.spawnAt-dt)
  if (!duel && s.spawnAt <= 0) {
   const roster=this.roster(opening)
   const needed=Math.max(floor-this.targets().filter(e=>!objects.includes(e.kind)).length,4-s.queue.length)
   for(let i=0;i<Math.max(1,Math.min(opening?2:3,needed));i++){
    this.refreshQueue()
    const threats=s.enemies.filter(e=>!objects.includes(e.kind)).length
    const needCombat=this.targets().filter(e=>!objects.includes(e.kind)).length<floor,needLabels=s.queue.length<4
    if(threats>=limit&&!needLabels)break
    let pool:EnemyKind[]
    const supplies:EnemyKind[]=["chest","barrel","shield","potion","mana",...(s.time>=90?["sentry" as const]:[])]
    if(threats>=limit||!needCombat&&needLabels)pool=supplies
    else if(needCombat)pool=roster
    else pool=[...roster,...supplies]
    const kind=this.pick(pool),first=this.spawn(kind)
    // Rats arrive as a pack of up to three around the first one.
    if(kind==="rat"&&first)for(let k=0;k<2&&s.enemies.filter(e=>!objects.includes(e.kind)).length<limit;k++)this.spawn("rat",this.strikePosition(first,1.1+k*.4,{x:first.x+Math.sin(k*2.4)*3,z:first.z+Math.cos(k*2.4)*3}))
   }
   s.spawnAt = learning?interval:Math.max(.5, interval / (1 + s.time / 360 + s.level * .03))
  }
  for (const e of [...s.enemies]) {
   if(duel&&e.id===s.boss)continue
   if (e.frozen > 0) { e.frozen -= dt; continue }
   if(duel&&s.bossArena!.hp>0&&!objects.includes(e.kind)){
    const wall=s.bossArena!
    // Nothing but the boss may stand inside an intact barricade (summons, blinks or knockback included).
    if(distance(e,wall)<B.barrierRadius-.3){const at=this.outsideRing(e);if(at){e.x=at.x;e.z=at.z}else{s.enemies=s.enemies.filter(x=>x!==e);continue}}
    const d=Math.max(.1,distance(e,wall)),goal={x:wall.x+(e.x-wall.x)/d*(B.barrierRadius+.3),z:wall.z+(e.z-wall.z)/d*(B.barrierRadius+.3)}
    this.moveEnemy(e,dt,goal,Math.max(.65,e.speed));if(distance(e,wall)<B.barrierRadius+.8)this.damageBarrier(goal,e)
    continue
   }
   const d = distance(e, s.player)
   this.steerEnemy(e,dt)
   if (e.speed && distance(e,s.player) <= 1) this.damage(1)
   if (e.kind === "bomber" || e.kind === "mage") {
    e.attack -= dt
    if (e.attack <= 0) {
     if (e.kind === "bomber") {
      if (d < 4) this.damage(2)
      if (e.id === s.target) {this.cancel();s.notice="Fuse detonated. Choose another word."}
      s.enemies = s.enemies.filter(enemy => enemy !== e); this.effect("blast", e, -2)
     } else {
      if (s.projectiles.length < B.projectiles && reachable(e,s.player)) s.projectiles.push({ id: s.nextId++, x: e.x, z: e.z, vx: (s.player.x - e.x) / Math.max(.1, d) * 2, vz: (s.player.z - e.z) / Math.max(.1, d) * 2, life: 8 })
      e.attack = 5.5+e.id%3*.4
     }
    }
   }
   if (d > 18 && e.id !== s.target && e.id !== s.boss) s.enemies = s.enemies.filter(enemy => enemy !== e)
  }
  s.projectiles = s.projectiles.filter(p => { p.x += p.vx * dt; p.z += p.vz * dt; p.life -= dt; if(!dungeonWalkable(p))return false; if(duel&&s.bossArena!.hp>0&&distance(p,s.bossArena!)<B.barrierRadius){this.damageBarrier(p,p);return false}; if (distance(p, s.player) < .6) { this.damage(1); return false }; return p.life > 0 })
  tickWeapons(this.combat,dt)
  if(s.sentry){
   const tower=s.sentry;tower.life=Math.max(0,tower.life-dt);tower.cooldown-=dt
   if(!tower.life)s.sentry=null
   else if(tower.cooldown<=0){
    const enemy=s.enemies.filter(e=>!objects.includes(e.kind)&&e.id!==s.boss&&e.words.length>(e.id===s.target?1:0)&&distance(e,tower)<7&&reachable(tower,e)).sort((a,b)=>distance(a,tower)-distance(b,tower)||a.id-b.id)[0]
    if(enemy){this.effect("sentry",tower,1,enemy);this.hit(enemy,1,true,"sentry");tower.cooldown=1.8}else tower.cooldown=.25
   }
  }
  this.collectLoot(); this.openDraft(); this.refreshQueue()
  // Preserve scripted spawn holds; shorten only the director's normal countdown.
  if(s.spawnAt<=interval&&(s.queue.length<4||this.targets().filter(e=>!objects.includes(e.kind)).length<floor&&s.enemies.filter(e=>!objects.includes(e.kind)).length<limit))s.spawnAt=Math.min(s.spawnAt,.3)
 }
 /** Surge opener: a themed pack fans in from one direction, sometimes led by an elite. */
 private launchSurge(cycle:number) {
  const s=this.state,{pack,elite}=surgeLineup(s.time,cycle,s.biome,()=>this.random())
  const heading=this.random()*Math.PI*2
  for(let i=0;i<pack.count;i++){
   const angle=heading+(i-(pack.count-1)/2)*.3,radius=B.spawnRadius+(i%2)*1.2
   const at={x:s.player.x+Math.sin(angle)*radius,z:s.player.z+Math.cos(angle)*radius}
   if(dungeonWalkable(at))this.spawn(pack.kind,at)
  }
  const leader=elite?this.spawn(elite,{x:s.player.x+Math.sin(heading)*(B.spawnRadius+2),z:s.player.z+Math.cos(heading)*(B.spawnRadius+2)}):undefined
  s.notice=`SURGE — ${pack.name}${leader?` led by a ${(enemyProfiles[leader.kind]?.name??leader.kind).toLowerCase()}`:""}! Hold the line.`
 }
 private roster(opening:boolean):EnemyKind[] { return spawnRoster(this.state.time,this.state.biome,opening) }
 serialize() { return JSON.stringify(this.state) }
}

export function restoreDungeonRun(raw: string | null): SurvivalRun | null {
 if (!raw || raw.length > 500_000) return null
 try {
  const s: DungeonState = JSON.parse(raw)
  if(s?.version===1&&s.legendaryDrafts===undefined)s.legendaryDrafts=0
  if(s?.version===1&&s.recentWords===undefined)s.recentWords=[]
  if(s?.version===1&&s.player?.shield===undefined&&s.player)s.player.shield=0
  if(s?.version===1&&s.supplies===undefined)s.supplies={shield:0,potion:0,mana:0,sentry:0}
  if(s?.version===1&&s.procs===undefined)s.procs={lightning:0,vowels:0}
  if(s?.version===1&&s.sentry===undefined)s.sentry=null
  if(s?.version===1&&s.bossArena===undefined)s.bossArena=null
  if(s?.version===1&&s.bossArena&&s.bossArena.calm===undefined)s.bossArena.calm=0
  if(s?.version===1&&s.weapons===undefined)s.weapons=createEmptyWeapons()
  if(s?.version===1&&s.orbitHits===undefined)s.orbitHits={}
  if(!areWeaponsValid(s.weapons))return null
  if(typeof s.orbitHits!=="object"||s.orbitHits===null||Object.values(s.orbitHits).some(v=>typeof v!=="number"||!Number.isFinite(v)))return null
  if(!s?.procs||![s.procs.lightning,s.procs.vowels].every(v=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=4))return null
  const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value)
  if (!s || s.version !== 1 || typeof s.seed !== "string" || s.seed.length > 200 || !["en", "id"].includes(s.language) || !["ready", "arena", "skills", "draft", "overdrive", "paused", "dead"].includes(s.phase)) return null
  const base = createDungeonState(s.seed, s.language)
  for (const [key, value] of Object.entries(base)) if (typeof value === "number" && (!finite(s[key as keyof DungeonState]) || Number(s[key as keyof DungeonState]) < 0)) return null
  if(![s.rng,s.nextId,s.biome,s.level,s.totalXp,s.gold,s.kills,s.words,s.correct,s.errors,s.streak,s.bestStreak,s.pendingDrafts,s.legendaryDrafts].every(Number.isSafeInteger)||s.legendaryDrafts>s.pendingDrafts||s.level<1||s.level>1_000_000||s.pendingDrafts>1000||s.time>1_000_000_000||s.worldTime>s.time||s.xp>=xpThreshold(s.level)||s.xp>s.totalXp||s.streak>s.bestStreak||s.bestStreak>s.correct)return null
  if (!s.player || ![s.player.x, s.player.z, s.player.hp, s.player.maxHp, s.player.mana, s.player.shield, s.player.invincible, s.player.dashAt, s.player.dashFrom?.x, s.player.dashFrom?.z].every(finite) || s.player.hp < 0 || s.player.hp > s.player.maxHp || s.player.maxHp > 100 || s.player.mana < 0 || s.player.mana > 100 || s.player.shield<0 || s.player.shield>4 || !Number.isInteger(s.player.shield)) return null
  if(![s.player.x,s.player.z,s.player.dashFrom.x,s.player.dashFrom.z].every(n=>Math.abs(n)<=1_000_000)||s.player.maxHp<1||!dungeonWalkable(s.player))return null
  if (!Array.isArray(s.enemies) || s.enemies.length > B.enemies || !Array.isArray(s.loot) || s.loot.length > B.loot || !Array.isArray(s.projectiles) || s.projectiles.length > B.projectiles || !Array.isArray(s.effects) || s.effects.length > B.effects) return null
  if(!Array.isArray(s.recentWords)||s.recentWords.length>24||s.recentWords.some(word=>typeof word!=="string"||!word.length||word.length>40))return null
  if (s.enemies.some(e => !e || !Object.hasOwn(dungeonWords.en, e.kind) || ![e.id, e.x, e.z, e.speed, e.frozen, e.attack, e.health, e.maxHealth].every(finite) || !Array.isArray(e.words) || e.words.length > 5 || e.words.some(w => typeof w !== "string" || !w.length || w.length > 40))) return null
  if (new Set(s.enemies.map(e => e.id)).size !== s.enemies.length || s.loot.some(e => !e || ![e.id, e.x, e.z, e.xp, e.gold, e.mana].every(finite) || e.xp < 0 || e.gold < 0 || e.mana < 0)) return null
  if(s.enemies.some(e=>e.id>=s.nextId||!Number.isSafeInteger(e.id)||e.id<1||Math.abs(e.x)>1_000_000||Math.abs(e.z)>1_000_000||e.speed<0||e.speed>10)||s.loot.some(e=>e.xp>100_000_000||e.gold>100_000_000||e.mana>100_000))return null
  if(s.enemies.some(e=>!e.words.length&&e.kind!=="boss"||e.health<=0||e.maxHealth<=0)||[...s.loot,...s.projectiles,...s.effects].some(e=>Math.abs(e.x)>1_000_000||Math.abs(e.z)>1_000_000))return null
  if(s.enemies.some(e=>e.waypoint&&(![e.waypoint.x,e.waypoint.z].every(finite)||Math.abs(e.waypoint.x)>1_000_000||Math.abs(e.waypoint.z)>1_000_000||!dungeonWalkable(e.waypoint))))return null
  if(!s.supplies||Object.keys(dungeonSupplies).some(kind=>{const n=s.supplies[kind as SupplyKind];return !Number.isSafeInteger(n)||n<0||n>1000000}))return null
  if(s.sentry!==null&&(![s.sentry.x,s.sentry.z,s.sentry.life,s.sentry.cooldown].every(finite)||Math.abs(s.sentry.x)>1000000||Math.abs(s.sentry.z)>1000000||!dungeonWalkable(s.sentry)||s.sentry.life<=0||s.sentry.life>18||s.sentry.cooldown<0||s.sentry.cooldown>1.8))return null
  if(s.bossArena!==null&&(![s.bossArena.x,s.bossArena.z,s.bossArena.hp,s.bossArena.cooldown,s.bossArena.rage,s.bossArena.calm].every(finite)||Math.abs(s.bossArena.x)>1000000||Math.abs(s.bossArena.z)>1000000||!dungeonWalkable(s.bossArena)||!Number.isInteger(s.bossArena.hp)||s.bossArena.hp<0||s.bossArena.hp>B.barrierHp||s.bossArena.cooldown<0||s.bossArena.cooldown>.8||s.bossArena.rage<0||s.bossArena.rage>2||s.bossArena.calm<0||s.bossArena.calm>B.duelCalmMax||s.boss===null))return null
  if(s.enemies.some(e=>e.motion!==undefined&&(!(e.kind in enemyLunges)||!["windup","charge","slam","recover"].includes(e.motion)||!finite(e.motionTime)||e.motionTime!<0||e.motionTime!>1.3||!e.aim||![e.aim.x,e.aim.z].every(finite)||!dungeonWalkable(e.aim)||Math.abs(e.aim.x)>1000000||Math.abs(e.aim.z)>1000000)||e.motion===undefined&&(e.aim!==undefined||e.motionTime!==undefined)))return null
  if(s.effects.some(e=>e.source!==undefined&&!["blade","cleave","storm","lightning","vowels","sentry","explosion","orbit","nova","meteor","frost","whirl","finisher"].includes(e.source)))return null
  if(s.effects.some(e=>e.to!==undefined&&(![e.to.x,e.to.z].every(finite)||Math.abs(e.to.x)>1000000||Math.abs(e.to.z)>1000000)))return null
  if (s.projectiles.some(e => !e || ![e.id, e.x, e.z, e.vx, e.vz, e.life].every(finite)) || s.effects.some(e => !e || ![e.id, e.x, e.z, e.life, e.value].every(finite) || !["slash", "hit", "storm", "heal", "pickup", "shatter", "magnet", "block", "shield", "mana", "deploy", "sentry", "lightning", "firebolt", "blast", "treasure", "slam", "level", "upgrade", "barrier", "ward", "summon", "blink", "nova", "meteor", "frost", "whirl", "finisher", "spore"].includes(e.kind))) return null
  if (!s.skills || skillIds.some(id => !s.skills[id] || !Number.isInteger(s.skills[id].level) || s.skills[id].level < 1 || s.skills[id].level > 3 || !finite(s.skills[id].cooldown) || s.skills[id].cooldown < 0) || !s.relics || relicIds.some(id => !Number.isInteger(s.relics[id]) || s.relics[id] < 0 || s.relics[id] > dungeonUpgrades[id].max)) return null
  if (!Array.isArray(s.offers) || s.offers.length > 3 || s.offers.some(id => !Object.hasOwn(dungeonUpgrades, id)) || typeof s.prefix !== "string" || typeof s.command !== "string" || s.command.length > 40 || typeof s.paragraph !== "string" || s.paragraph.length > 100_000 || !Number.isInteger(s.cursor) || s.cursor > s.paragraph.length || typeof s.notice !== "string") return null
  if (!Array.isArray(s.queue) || s.queue.length > 6 || s.queue.some(id => !s.enemies.some(e => e.id === id)) || ![4, 6].includes(s.labelLimit)) return null
  if(new Set(s.queue).size!==s.queue.length||new Set(s.offers).size!==s.offers.length)return null
  const phase: RunPhase = s.phase === "paused" ? s.resumePhase : s.phase
  if (!["arena", "skills", "draft", "overdrive", "ready", "dead"].includes(phase) || !["arena", "skills", "overdrive"].includes(s.afterDraft)) return null
  if (s.target !== null && !s.enemies.some(e => e.id === s.target && e.words[0]?.startsWith(s.prefix)&&s.prefix.length<e.words[0].length) || s.target === null && s.prefix.length > 0) return null
  if (s.boss !== null && !s.enemies.some(e => e.id === s.boss && e.kind === "boss") || phase === "overdrive" && s.boss === null || phase === "draft" && (!s.offers.length || s.pendingDrafts < 1)) return null
  s.resumePhase = phase; if (phase !== "dead" && phase !== "ready") s.phase = "paused"
  return new SurvivalRun(s.seed, s.language, s)
 } catch { return null }
}
