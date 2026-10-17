import type { CSSProperties, ReactNode } from "react"
import type { DungeonState, RelicId, SkillId, UpgradeId, WeaponId } from "@typecade/contracts"
import { dungeonBiomes, dungeonUpgrades, skillRules, weaponRules } from "@typecade/content"
import { runAccuracy, runWpm, weaponIds } from "@typecade/game-rules"
import { Glyph } from "./Glyph"
import { DungeonDialog } from "./ui/DungeonDialog"
import { GemDivider } from "./ui/Ornament"

type GlyphName = Parameters<typeof Glyph>[0]["name"]
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`
const skillIds: SkillId[] = ["cleave", "storm", "heal"]
const isWeapon = (id: UpgradeId): id is WeaponId => (weaponIds as readonly string[]).includes(id)
const isSkill = (id: UpgradeId): id is SkillId => (skillIds as string[]).includes(id)

const upgradeGlyph: Record<UpgradeId, GlyphName> = {
  cleave: "sword", storm: "storm", heal: "heal", lightning: "bolt", magnet: "gem", switch: "switch", vowels: "flame", overclock: "clock", glasses: "eye", execute: "finish",
  orbit: "orbit", nova: "nova", meteor: "meteor", frost: "frost",
}

function StatTile({ icon, value, label }: { icon: GlyphName; value: ReactNode; label: string }) {
  return <div className="stat-tile"><Glyph name={icon} /><b>{value}</b><span>{label}</span></div>
}

function rankOf(view: DungeonState, id: UpgradeId) {
  return isSkill(id) ? view.skills[id].level : isWeapon(id) ? view.weapons[id].level : view.relics[id as RelicId]
}

/** Every owned skill, weapon and relic as an icon chip with rank pips. */
function BuildShowcase({ view }: { view: DungeonState }) {
  const owned = (Object.keys(dungeonUpgrades) as UpgradeId[]).filter(id => rankOf(view, id) > 0)
  return (
    <div className="build-showcase" aria-label="Run build">
      {owned.map(id => (
        <span key={id} className={`build-chip ${isWeapon(id) ? "chip-weapon" : isSkill(id) ? "chip-skill" : "chip-relic"}`} title={dungeonUpgrades[id].description}>
          <Glyph name={upgradeGlyph[id]} />
          <span>{isSkill(id) ? skillRules[id].en : dungeonUpgrades[id].name}</span>
          <small className="level-pips">{Array.from({ length: dungeonUpgrades[id].max }, (_, i) => <i key={i} className={i < rankOf(view, id) ? "on" : ""} />)}</small>
        </span>
      ))}
    </div>
  )
}

export function DefeatDialog({ view, best, onRetry, onLeave }: { view: DungeonState; best: number; onRetry: () => void; onLeave: () => void }) {
  const record = view.time >= best && view.time > 0
  return (
    <DungeonDialog title="Run over" onCancel={onLeave} tone="defeat" className="result-dialog">
      <span className="eyebrow">YOUR RESULTS</span>
      {record && <div className="record-ribbon"><Glyph name="crown" />NEW LOCAL RECORD</div>}
      <div className="result-hero">
        <div className="result-time"><small>SURVIVED</small><b>{formatTime(view.time)}</b><span>{dungeonBiomes[view.biome % dungeonBiomes.length]!.name} · Depth {view.biome + 1}</span></div>
      </div>
      <div className="stat-grid">
        <StatTile icon="crown" value={view.level} label="LEVEL" />
        <StatTile icon="skull" value={view.kills} label="DEFEATED" />
        <StatTile icon="bolt" value={runWpm(view)} label="WPM" />
        <StatTile icon="eye" value={`${runAccuracy(view)}%`} label="ACCURACY" />
        <StatTile icon="flame" value={view.bestStreak} label="BEST STREAK" />
        <StatTile icon="gem" value={view.gold} label="GOLD" />
      </div>
      <GemDivider label="YOUR BUILD" />
      <BuildShowcase view={view} />
      <p className="muted">Best time {formatTime(best)}. Upgrades reset when you start a new run.</p>
      <div className="dialog-actions">
        <button className="primary-action" autoFocus onClick={onRetry}><Glyph name="sword" />Try another run</button>
        <button className="quiet" onClick={onLeave}>Return to title</button>
      </div>
    </DungeonDialog>
  )
}

interface PauseDialogProps { view: DungeonState; leaveLabel: string; onResume: () => void; onSettings: () => void; onControls: () => void; onLeave: () => void }

export function PauseDialog({ view, leaveLabel, onResume, onSettings, onControls, onLeave }: PauseDialogProps) {
  return (
    <DungeonDialog title="Paused" onCancel={onResume} tone="pause" className="pause-dialog">
      <span className="eyebrow">PROGRESS SAVED · ESC TO RESUME</span>
      <div className="stat-grid compact">
        <StatTile icon="flag" value={view.biome + 1} label="DEPTH" />
        <StatTile icon="crown" value={view.level} label="LEVEL" />
        <StatTile icon="clock" value={formatTime(view.time)} label="TIME" />
        <StatTile icon="skull" value={view.kills} label="DEFEATED" />
      </div>
      <BuildShowcase view={view} />
      <div className="dialog-actions">
        <button className="primary-action" autoFocus onClick={onResume}><Glyph name="sword" />Resume run</button>
        <div className="dialog-actions-row">
          <button onClick={onSettings}><Glyph name="gear" />Settings</button>
          <button onClick={onControls}><Glyph name="book" />Controls</button>
        </div>
        <button className="quiet" onClick={onLeave}>{leaveLabel}</button>
      </div>
    </DungeonDialog>
  )
}

function UpgradeCard({ view, id, index }: { view: DungeonState; id: UpgradeId; index: number }) {
  const offer = dungeonUpgrades[id], rank = rankOf(view, id), word = offer[view.language]
  const typed = word.startsWith(view.command) ? view.command.length : 0
  const family = isWeapon(id) ? "WEAPON" : isSkill(id) ? "SKILL" : "RELIC"
  const accent = isWeapon(id) ? `#${weaponRules[id].color.toString(16).padStart(6, "0")}` : isSkill(id) ? "#ffb85a" : "#c58bff"
  return (
    <article className={`upgrade-card family-${family.toLowerCase()} ${typed ? "typing" : ""}`} style={{ "--accent": accent, animationDelay: `${index * .07}s` } as CSSProperties}>
      <span className="upgrade-family">{rank === 0 ? `NEW ${family}` : family}</span>
      <div className="upgrade-medallion"><Glyph name={upgradeGlyph[id]} /></div>
      <h3>{offer.name}</h3>
      <small className="level-pips" aria-label={`Rank ${rank} of ${offer.max}`}>{Array.from({ length: offer.max }, (_, i) => <i key={i} className={i < rank ? "on" : i === rank ? "next" : ""} />)}</small>
      <small>{rank >= offer.max ? "MAX RANK · RESTORE" : `RANK ${rank} → ${rank + 1}`}</small>
      <p>{offer.description}</p>
      <strong data-testid="upgrade-keyword"><span className="typed">{word.slice(0, typed)}</span>{word.slice(typed)}</strong>
    </article>
  )
}

export function DraftDialog({ view, input, onPause }: { view: DungeonState; input: ReactNode; onPause: () => void }) {
  const relic = view.legendaryDrafts > 0
  return (
    <DungeonDialog title={relic ? "Boss reward" : `Level ${view.level}`} className="draft-dialog" tone={relic ? "relic" : "draft"} onCancel={onPause}>
      <span className="eyebrow">{relic ? "PICK ONE RELIC · TYPE ITS KEYWORD" : "PICK ONE UPGRADE · TYPE ITS KEYWORD"}</span>
      <div className="upgrade-cards">{view.offers.map((id, index) => <UpgradeCard key={id} view={view} id={id} index={index} />)}</div>
      {input}
      <p className="run-notice">{view.notice}</p>
    </DungeonDialog>
  )
}
