import type { DungeonEnemy, DungeonLanguage, DungeonState, EnemyKind, Point, RelicId, RunPhase, SkillId, UpgradeId } from "../../contracts/src/survival"
import { bossPassages, dungeonBalance as B, dungeonTerrain as T, dungeonUpgrades, dungeonWords, dungeonLongWords, skillRules } from "../../content/src/dungeon"
import { createSeededRng } from "./rng"

const skillIds: SkillId[] = ["cleave", "storm", "heal"]
const relicIds: RelicId[] = ["lightning", "magnet", "switch", "vowels", "overclock", "glasses", "execute"]
const objects: EnemyKind[] = ["barrel", "chest"]
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)
export const xpThreshold = (level: number) => Math.min(100_000, Math.floor(100 * 1.25 ** Math.min(level, 32)))
export const runWpm = (s: DungeonState) => Math.round(s.correct / 5 / Math.max(1 / 6, s.time / 60))
export const runAccuracy = (s: DungeonState) => s.correct + s.errors ? Math.round(s.correct / (s.correct + s.errors) * 100) : 100
export function dungeonWalkable(p: Point) {
 if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return false
 const x = ((p.x % T.chunkSize) + T.chunkSize) % T.chunkSize, z = ((p.z % T.chunkSize) + T.chunkSize) % T.chunkSize
 for(const offset of [0,16])if(Math.abs(x-((T.ruinX+offset)%T.chunkSize))<=T.halfWidth&&Math.abs(z-((T.ruinZ+offset)%T.chunkSize))<=T.halfDepth)return false
 return true
}
function reachable(a: Point, b: Point) {
 const steps = Math.ceil(distance(a, b) * 2)
 for (let i = 1; i <= steps; i++) if (!dungeonWalkable({ x: a.x + (b.x - a.x) * i / steps, z: a.z + (b.z - a.z) * i / steps })) return false
 return true
}

export function createDungeonState(seed: string, language: DungeonLanguage): DungeonState {
 return {
  version: 1, seed, rng: 0, language, phase: "ready", resumePhase: "arena", time: 0, worldTime: 0, nextBoss: B.bossInterval, spawnAt: 2, nextId: 1, biome: 0,
  player: { x: 0, z: 0, hp: B.hp, maxHp: B.hp, mana: 100, invincible: 0, dashFrom: { x: 0, z: 0 }, dashAt: -10 },
  enemies: [], loot: [], projectiles: [], effects: [], target: null, prefix: "", command: "", queue: [], labelLimit: 6,
  level: 1, xp: 0, totalXp: 0, gold: 0, kills: 0, words: 0, correct: 0, errors: 0, streak: 0, bestStreak: 0,
  skills: { cleave: { level: 1, cooldown: 0 }, storm: { level: 1, cooldown: 0 }, heal: { level: 1, cooldown: 0 } },
  relics: { lightning: 0, magnet: 0, switch: 0, vowels: 0, overclock: 0, glasses: 0, execute: 0 },
  offers: [], pendingDrafts: 0, legendaryDrafts: 0, afterDraft: "arena", boss: null, stagger: 0, paragraph: "", cursor: 0, notice: "Type a word to dash and strike. Tab opens skills.",
 }
}

/** Deterministic simulation. No renderer, browser clock or storage dependency. */
export class SurvivalRun {
 readonly state: DungeonState
 constructor(seed: string, language: DungeonLanguage = "en", restored?: DungeonState) {
  this.state = restored ?? createDungeonState(seed, language)
  if (!restored) {
   for (let i = 0; i < 6; i++) this.spawn(i === 4 ? "barrel" : i % 2 ? "goblin" : "skeleton", { x: Math.sin(i * 1.05) * (5 + i * .25), z: Math.cos(i * 1.05) * (5 + i * .25) })
   this.refreshQueue()
  }
 }
 private random() { const s = this.state; return createSeededRng(`${s.seed}:${s.rng++}`).nextFloat() }
 private pick<T>(list: readonly T[]) { return list[Math.floor(this.random() * list.length)]! }
 private effect(kind: DungeonState["effects"][number]["kind"], at: Point, value = 0) {
  const s = this.state
  if (s.effects.length >= B.effects) s.effects.shift()
  s.effects.push({ id: s.nextId++, kind, x: at.x, z: at.z, life: .55, value })
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
  if (s.enemies.length >= B.enemies || kind === "boss" && s.boss !== null) return
  const angle = this.random() * Math.PI * 2
  let position = at ?? { x: s.player.x + Math.sin(angle) * B.spawnRadius, z: s.player.z + Math.cos(angle) * B.spawnRadius }
  for (let i = 0; i < 8 && !dungeonWalkable(position); i++) position = { x: s.player.x + Math.sin(angle + i + 1) * B.spawnRadius, z: s.player.z + Math.cos(angle + i + 1) * B.spawnRadius }
  if (!dungeonWalkable(position)) return
  const pool = dungeonWords[s.language][kind]
  const used = s.enemies.map(e => e.words[0]?.[0])
  const available = pool.filter(word => !used.includes(word[0]))
  const first = this.pick(available.length ? available : pool)
  const layers = kind === "boss" ? 3 + Math.min(2, s.biome) : kind === "minotaur" ? Math.min(5, 3 + Math.floor(s.time / 900)) : kind === "guard" ? 2 : 1
  const words = Array.from({ length: layers }, (_, i) => this.modifyWord(i === 0 ? first : pool[i % pool.length]!, kind, layers - i))
  const health = kind === "boss" ? B.bossHealth * (1 + s.biome * .5) : layers
  const enemy: DungeonEnemy = { id: s.nextId++, kind, ...position, words, speed: objects.includes(kind) ? 0 : B.speed * (kind === "goblin" ? 1.3 : 1) * (1 + Math.min(2, s.time / 900)), frozen: 0, attack: kind === "bomber" ? 20 : kind === "mage" ? 8 : 0, health, maxHealth: health }
  s.enemies.push(enemy)
  if (kind === "boss") { s.boss = enemy.id; s.notice = "Obsidian Minotaur — break its armor." }
  return enemy
 }
 private modifyWord(word: string, kind: EnemyKind, layers: number) {
  const s = this.state
  if (s.relics.glasses && (kind === "mage" || kind === "bomber")) word = word.replace(/[^\p{L}\p{N}]/gu, "")
  if (s.relics.execute && layers === 1 && (kind === "minotaur" || kind === "boss")) word = word.slice(0, 3)
  if (s.time >= 900 && (kind === "skeleton" || kind === "goblin")) word = this.pick(dungeonLongWords[s.language])
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
   if (key !== s.paragraph[s.cursor]) { this.typo(); return }
   s.cursor++; this.correct(key)
   const boss = s.enemies.find(e => e.id === s.boss)!
   {
    const ultimate = s.paragraph.slice(0, s.cursor).endsWith("BLIZZARD")
    const damage = ultimate ? 45 : 2
    boss.health -= damage; this.effect(ultimate ? "storm" : "slash", boss, damage)
    if (boss.health <= 0) this.kill(boss)
   }
   if (s.cursor >= s.paragraph.length) s.paragraph += this.pick(bossPassages[s.language])
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
  s.player.dashFrom = { x: s.player.x, z: s.player.z }; s.player.x = target.x; s.player.z = target.z
  s.player.dashAt = s.worldTime; s.player.invincible = Math.max(s.player.invincible, B.dashGrace)
  this.effect("slash", target, 1); s.target = null; s.prefix = ""
  if (s.relics.switch) for (const e of s.enemies) { const d = distance(e, s.player); if (d > 0 && d < 4) { const next={x:e.x+(e.x-s.player.x)/d,z:e.z+(e.z-s.player.z)/d};if(dungeonWalkable(next)){e.x=next.x;e.z=next.z} } }
  this.hit(target, 1, false)
  this.collectLoot()
  this.openDraft()
  this.refreshQueue()
 }
 private commandKey(key: string) {
  const s = this.state
  const ids: UpgradeId[] = s.phase === "draft" ? s.offers : skillIds
  const keyword = (id: UpgradeId) => s.phase === "draft" ? dungeonUpgrades[id][s.language] : skillRules[id as SkillId][s.language]
  const next = s.command + key.toUpperCase()
  const eligible = ids.filter(id => keyword(id).startsWith(next))
  if (!eligible.length) { s.command = ""; s.notice = "That keyword does not match. Try again."; return }
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
  if (s.relics.lightning && s.correct % 10 === 0) this.area(7, 1, 2)
  if (s.relics.vowels && /[aeiou]/i.test(key)) {
   const candidates = s.enemies.filter(e => e.id !== s.boss && distance(e, s.player) < 8)
   if (candidates.length) { const e = this.pick(candidates); this.effect("hit", e, 1); this.hit(e, 1, true) }
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
   s.player.hp = Math.min(s.player.maxHp, s.player.hp + 2)
   if (level === 3) s.player.invincible = Math.max(s.player.invincible, 4)
   this.effect("heal", s.player, 2)
  } else {
   this.effect(id === "storm" ? "storm" : "slash", s.player, level === 3 ? 2 : 1)
   this.area(id === "storm" ? 12 : 4 * (1 + .4 * (level - 1)), level === 3 && id === "cleave" ? 2 : 1)
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
 private area(radius: number, layers: number, count: number = B.enemies) {
  for (const e of [...this.state.enemies].filter(e => distance(e, this.state.player) < radius).slice(0, count)) this.hit(e, layers, true)
 }
 private hit(enemy: DungeonEnemy, layers: number, preserve: boolean) {
  const s = this.state
  if (!s.enemies.includes(enemy) || !enemy.words.length) return
  const amount = Math.min(layers, Math.max(0, enemy.words.length - (preserve && enemy.id === s.target ? 1 : 0)))
  if (!amount) return
  if (preserve) enemy.words.splice(enemy.id === s.target ? 1 : 0, amount)
  else enemy.words.splice(0, amount)
  this.effect("shatter", enemy, amount)
  if (!enemy.words.length) {
   if (enemy.kind === "boss") { if (s.phase !== "skills") this.staggerBoss() }
   else this.kill(enemy)
  } else if (enemy.id !== s.target) enemy.words[0] = this.modifyWord(enemy.words[0]!, enemy.kind, enemy.words.length)
 }
 private kill(enemy: DungeonEnemy) {
  const s = this.state
  s.enemies = s.enemies.filter(e => e !== enemy); s.kills++
  const boss = enemy.kind === "boss"
  const value = boss ? 250 : enemy.kind === "minotaur" ? 60 : enemy.kind === "chest" ? 50 : 25
  const drop = { id: s.nextId++, x: enemy.x, z: enemy.z, xp: value, gold: boss ? 100 : enemy.kind === "chest" ? 25 : 3, mana: enemy.kind === "mage" ? 20 : 0 }
  if (s.loot.length < B.loot) s.loot.push(drop)
  else { const existing = s.loot[0]!; existing.xp += drop.xp; existing.gold += drop.gold; existing.mana += drop.mana }
  this.effect("hit", enemy, value)
  if (boss) {
   s.boss = null; s.stagger = 0; s.biome++; s.phase = "arena"; s.notice = "Boss defeated — a new depth opens. Legendary draft!"
   s.pendingDrafts++;s.legendaryDrafts++; this.collectLoot(true); this.openDraft()
  } else if (enemy.kind === "bomber" || enemy.kind === "barrel") {
   this.effect("storm", enemy, 1)
   for (const e of [...s.enemies]) if (distance(e, enemy) < 4) this.hit(e, 1, true)
  }
  this.refreshQueue()
 }
 private staggerBoss() {
  const s = this.state
  s.phase = "overdrive"; s.stagger = B.stagger; s.target = null; s.prefix = ""; s.command = ""; s.cursor = 0
  s.paragraph = this.pick(bossPassages[s.language]); s.notice = "ARMOR BREAK — every letter is a strike!"
 }
 private moveEnemy(e:DungeonEnemy,dt:number) {
  const player=this.state.player
  if(e.waypoint&&(distance(e,e.waypoint)<.3||reachable(e,player)))delete e.waypoint
  let goal=e.waypoint??player,d=Math.max(.01,distance(e,goal))
  let next={x:e.x+(goal.x-e.x)/d*e.speed*dt,z:e.z+(goal.z-e.z)/d*e.speed*dt}
  if(!dungeonWalkable(next)){
   const bx=Math.floor(next.x/T.chunkSize)*T.chunkSize,bz=Math.floor(next.z/T.chunkSize)*T.chunkSize
   const centers=[{x:bx+T.ruinX,z:bz+T.ruinZ},{x:bx+T.ruinX+16,z:bz+T.ruinZ+16}]
   const center=centers.find(p=>Math.abs(next.x-p.x)<=T.halfWidth&&Math.abs(next.z-p.z)<=T.halfDepth)!
   const corners=[-1,1].flatMap(x=>[-1,1].map(z=>({x:center.x+x*(T.halfWidth+.8),z:center.z+z*(T.halfDepth+.8)})))
   e.waypoint=corners.filter(p=>distance(e,p)>.5&&reachable(e,p)).sort((a,b)=>distance(e,a)+distance(a,player)-distance(e,b)-distance(b,player))[0]
   goal=e.waypoint!;d=Math.max(.01,distance(e,goal));next={x:e.x+(goal.x-e.x)/d*e.speed*dt,z:e.z+(goal.z-e.z)/d*e.speed*dt}
  }
  if(dungeonWalkable(next)){e.x=next.x;e.z=next.z}
 }
 gainXp(value: number) {
  const s = this.state
  const bonus = s.relics.magnet && runWpm(s) > 60 ? 1.2 : 1
  s.xp += Math.floor(value * bonus); s.totalXp += Math.floor(value * bonus)
  while (s.xp >= xpThreshold(s.level)) { s.xp -= xpThreshold(s.level); s.level++; s.pendingDrafts++ }
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
  if (!s.pendingDrafts || s.phase === "overdrive" || s.phase === "dead" || s.phase === "draft") return
  s.afterDraft = s.phase; s.phase = "draft"; s.command = ""
  const eligible = (Object.keys(dungeonUpgrades) as UpgradeId[]).filter(id => this.upgradeLevel(id) < dungeonUpgrades[id].max&&(!s.legendaryDrafts||relicIds.includes(id as RelicId)))
  s.offers = []
  while (eligible.length && s.offers.length < 3) { const index = Math.floor(this.random() * eligible.length); s.offers.push(eligible.splice(index, 1)[0]!) }
  // shortcut: after all finite upgrades, repeat the three active upgrades as restorative boons.
  for (const id of skillIds) if (s.offers.length < 3 && !s.offers.includes(id)) s.offers.push(id)
 }
 upgradeLevel(id: UpgradeId) { return skillIds.includes(id as SkillId) ? this.state.skills[id as SkillId].level : this.state.relics[id as RelicId] }
 chooseUpgrade(id: UpgradeId) {
  const s = this.state
  if (s.phase !== "draft" || !s.offers.includes(id)) return false
  if (skillIds.includes(id as SkillId)) { s.skills[id as SkillId].level = Math.min(3, s.skills[id as SkillId].level + 1); s.player.hp = Math.min(s.player.maxHp, s.player.hp + 1); s.player.mana = Math.min(100, s.player.mana + 15) }
  else s.relics[id as RelicId]++
  s.pendingDrafts--;s.legendaryDrafts=Math.max(0,s.legendaryDrafts-1); s.phase = s.afterDraft; s.command = ""; s.offers = []; s.notice = `${dungeonUpgrades[id].name} acquired.`
  this.openDraft(); return true
 }
 damage(amount: number) {
  const s = this.state
  if (s.player.invincible > 0 || s.phase === "dead") return
  s.player.hp = Math.max(0, s.player.hp - amount); s.player.invincible = B.contactGrace; this.effect("hit", s.player, -amount)
  if (s.player.hp === 0) { s.phase = "dead"; s.notice = "The keep claimed this run. Your best is saved." }
 }
 advance(seconds: number) {
  const s = this.state
  if (!["arena", "skills", "overdrive"].includes(s.phase) || !Number.isFinite(seconds) || seconds <= 0) return
  const real = Math.min(seconds, .1), dt = real * (s.phase === "skills" ? .5 : 1)
  s.time += real; s.worldTime += dt; s.player.invincible = Math.max(0, s.player.invincible - dt)
  s.player.mana = Math.min(100, s.player.mana + real * B.manaRegen * (s.relics.overclock && runWpm(s) > 100 ? 2 : 1))
  s.effects = s.effects.filter(fx => { fx.life -= dt; return fx.life > 0 })
  if (s.phase === "overdrive") {
   s.stagger = Math.max(0, s.stagger - real)
   if (!s.stagger) {
    const boss = s.enemies.find(e => e.id === s.boss)!
    boss.words = [...dungeonWords[s.language].boss]; s.phase = "arena"; this.openDraft()
   }
   return
  }
  if (s.time >= s.nextBoss && s.boss === null) {
   const boss = this.spawn("boss", { x: s.player.x + 5, z: s.player.z - 4 })
   if (boss) { s.nextBoss += B.bossInterval; if (s.phase === "skills") { s.phase = "arena"; s.command = "" } }
  }
  s.spawnAt -= dt
  if (s.spawnAt <= 0) {
   const roster: EnemyKind[] = s.time < 150 ? ["skeleton", "goblin", "skeleton", "chest", "barrel"] : ["skeleton", "goblin", "guard", "minotaur", "bomber", "mage"]
   this.spawn(this.pick(roster)); s.spawnAt = Math.max(.45, B.spawnInterval / (1 + s.time / 180 + s.level * .06))
  }
  for (const e of [...s.enemies]) {
   if (e.frozen > 0) { e.frozen -= dt; continue }
   const d = distance(e, s.player)
   if (e.speed && d > .8) {
    this.moveEnemy(e,dt)
   }
   if (e.speed && d <= 1) this.damage(1)
   if (e.kind === "bomber" || e.kind === "mage") {
    e.attack -= dt
    if (e.attack <= 0) {
     if (e.kind === "bomber") {
      if (d < 4) this.damage(2)
      if (e.id === s.target) this.cancel()
      s.enemies = s.enemies.filter(enemy => enemy !== e); this.effect("storm", e, -2)
     } else {
      if (s.projectiles.length < B.projectiles) s.projectiles.push({ id: s.nextId++, x: e.x, z: e.z, vx: (s.player.x - e.x) / Math.max(.1, d) * 2, vz: (s.player.z - e.z) / Math.max(.1, d) * 2, life: 8 })
      e.attack = 8
     }
    }
   }
   if (d > 28 && e.id !== s.target && e.id !== s.boss) s.enemies = s.enemies.filter(enemy => enemy !== e)
  }
  s.projectiles = s.projectiles.filter(p => { p.x += p.vx * dt; p.z += p.vz * dt; p.life -= dt; if (distance(p, s.player) < .6) { this.damage(1); return false }; return p.life > 0 })
  this.collectLoot(); this.openDraft(); this.refreshQueue()
 }
 serialize() { return JSON.stringify(this.state) }
}

export function restoreDungeonRun(raw: string | null): SurvivalRun | null {
 if (!raw || raw.length > 500_000) return null
 try {
  const s: DungeonState = JSON.parse(raw)
  if(s?.version===1&&s.legendaryDrafts===undefined)s.legendaryDrafts=0
  const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value)
  if (!s || s.version !== 1 || typeof s.seed !== "string" || s.seed.length > 200 || !["en", "id"].includes(s.language) || !["ready", "arena", "skills", "draft", "overdrive", "paused", "dead"].includes(s.phase)) return null
  const base = createDungeonState(s.seed, s.language)
  for (const [key, value] of Object.entries(base)) if (typeof value === "number" && (!finite(s[key as keyof DungeonState]) || Number(s[key as keyof DungeonState]) < 0)) return null
  if(![s.rng,s.nextId,s.biome,s.level,s.totalXp,s.gold,s.kills,s.words,s.correct,s.errors,s.streak,s.bestStreak,s.pendingDrafts,s.legendaryDrafts].every(Number.isSafeInteger)||s.legendaryDrafts>s.pendingDrafts||s.level<1||s.level>1_000_000||s.pendingDrafts>1000||s.time>1_000_000_000||s.worldTime>s.time||s.xp>=xpThreshold(s.level)||s.xp>s.totalXp||s.streak>s.bestStreak||s.bestStreak>s.correct)return null
  if (!s.player || ![s.player.x, s.player.z, s.player.hp, s.player.maxHp, s.player.mana, s.player.invincible, s.player.dashAt, s.player.dashFrom?.x, s.player.dashFrom?.z].every(finite) || s.player.hp < 0 || s.player.hp > s.player.maxHp || s.player.maxHp > 100 || s.player.mana < 0 || s.player.mana > 100) return null
  if(![s.player.x,s.player.z,s.player.dashFrom.x,s.player.dashFrom.z].every(n=>Math.abs(n)<=1_000_000)||s.player.maxHp<1||!dungeonWalkable(s.player))return null
  if (!Array.isArray(s.enemies) || s.enemies.length > B.enemies || !Array.isArray(s.loot) || s.loot.length > B.loot || !Array.isArray(s.projectiles) || s.projectiles.length > B.projectiles || !Array.isArray(s.effects) || s.effects.length > B.effects) return null
  if (s.enemies.some(e => !e || !Object.hasOwn(dungeonWords.en, e.kind) || ![e.id, e.x, e.z, e.speed, e.frozen, e.attack, e.health, e.maxHealth].every(finite) || !Array.isArray(e.words) || e.words.length > 5 || e.words.some(w => typeof w !== "string" || !w.length || w.length > 40))) return null
  if (new Set(s.enemies.map(e => e.id)).size !== s.enemies.length || s.loot.some(e => !e || ![e.id, e.x, e.z, e.xp, e.gold, e.mana].every(finite) || e.xp < 0 || e.gold < 0 || e.mana < 0)) return null
  if(s.enemies.some(e=>e.id>=s.nextId||!Number.isSafeInteger(e.id)||e.id<1||Math.abs(e.x)>1_000_000||Math.abs(e.z)>1_000_000||e.speed<0||e.speed>10)||s.loot.some(e=>e.xp>100_000_000||e.gold>100_000_000||e.mana>100_000))return null
  if(s.enemies.some(e=>!e.words.length&&e.kind!=="boss"||e.health<=0||e.maxHealth<=0)||[...s.loot,...s.projectiles,...s.effects].some(e=>Math.abs(e.x)>1_000_000||Math.abs(e.z)>1_000_000))return null
  if(s.enemies.some(e=>e.waypoint&&(![e.waypoint.x,e.waypoint.z].every(finite)||Math.abs(e.waypoint.x)>1_000_000||Math.abs(e.waypoint.z)>1_000_000||!dungeonWalkable(e.waypoint))))return null
  if (s.projectiles.some(e => !e || ![e.id, e.x, e.z, e.vx, e.vz, e.life].every(finite)) || s.effects.some(e => !e || ![e.id, e.x, e.z, e.life, e.value].every(finite) || !["slash", "hit", "storm", "heal", "pickup", "shatter", "magnet"].includes(e.kind))) return null
  if (!s.skills || skillIds.some(id => !s.skills[id] || !Number.isInteger(s.skills[id].level) || s.skills[id].level < 1 || s.skills[id].level > 3 || !finite(s.skills[id].cooldown) || s.skills[id].cooldown < 0) || !s.relics || relicIds.some(id => !Number.isInteger(s.relics[id]) || s.relics[id] < 0 || s.relics[id] > dungeonUpgrades[id].max)) return null
  if (!Array.isArray(s.offers) || s.offers.length > 3 || s.offers.some(id => !Object.hasOwn(dungeonUpgrades, id)) || typeof s.prefix !== "string" || typeof s.command !== "string" || s.command.length > 40 || typeof s.paragraph !== "string" || s.paragraph.length > 100_000 || !Number.isInteger(s.cursor) || s.cursor > s.paragraph.length || typeof s.notice !== "string") return null
  if (!Array.isArray(s.queue) || s.queue.length > 6 || s.queue.some(id => !s.enemies.some(e => e.id === id)) || ![4, 6].includes(s.labelLimit)) return null
  if(new Set(s.queue).size!==s.queue.length||new Set(s.offers).size!==s.offers.length)return null
  const phase: RunPhase = s.phase === "paused" ? s.resumePhase : s.phase
  if (!["arena", "skills", "draft", "overdrive", "ready", "dead"].includes(phase) || !["arena", "skills", "overdrive"].includes(s.afterDraft)) return null
  if (s.target !== null && !s.enemies.some(e => e.id === s.target && e.words[0]?.startsWith(s.prefix)&&s.prefix.length<e.words[0].length) || s.target === null && s.prefix.length > 0) return null
  if (s.boss !== null && !s.enemies.some(e => e.id === s.boss && e.kind === "boss") || phase === "overdrive" && (s.boss === null || s.stagger <= 0) || phase === "draft" && (!s.offers.length || s.pendingDrafts < 1)) return null
  s.resumePhase = phase; if (phase !== "dead" && phase !== "ready") s.phase = "paused"
  return new SurvivalRun(s.seed, s.language, s)
 } catch { return null }
}
