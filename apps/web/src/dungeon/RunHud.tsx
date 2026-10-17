import type { CSSProperties } from "react"
import type { DungeonState, RelicId, SupplyKind, WeaponId } from "@typecade/contracts"
import { dungeonBiomes, dungeonSupplies, dungeonUpgrades, weaponRules } from "@typecade/content"
import { runAccuracy, runWpm, waveAt, weaponIds, xpThreshold } from "@typecade/game-rules"
import { Glyph } from "./Glyph"
import { CoinIcon } from "./ui/CoinIcon"

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`

const weaponGlyph: Record<WeaponId, Parameters<typeof Glyph>[0]["name"]> = { orbit: "orbit", nova: "nova", meteor: "meteor", frost: "frost" }
const relicGlyph: Record<RelicId, Parameters<typeof Glyph>[0]["name"]> = { magnet: "gem", lightning: "bolt", vowels: "flame", switch: "switch", overclock: "clock", glasses: "eye", execute: "finish" }

function CombatMetrics({ view, onPause }: { view: DungeonState; onPause: () => void }) {
  const depth = dungeonBiomes[view.biome % dungeonBiomes.length]!
  const hot = view.streak >= 50
  return (
    <section className="combat-metrics hud-plate">
      <div className="hud-topline">
        <button aria-label="Pause game" className="pause-button" onClick={onPause}>Ⅱ</button>
        <span title={depth.name}>DEPTH {String(view.biome + 1).padStart(2, "0")}</span>
        <WaveChip time={view.time} />
        <strong>{formatTime(view.time)}</strong>
      </div>
      <div className="metric-values">
        <span><b>{runWpm(view)}</b> WPM</span>
        <span><b>{runAccuracy(view)}%</b> ACC</span>
        <span className={hot ? "streak-hot" : ""}>{hot && <Glyph name="flame" />}<b>{view.streak}×</b> STREAK</span>
      </div>
    </section>
  )
}

const waveLabel = { opening: "WARM-UP", build: "BUILD-UP", surge: "SURGE", breather: "BREATHER" } as const

/** Current director phase, so players can read the rhythm: push during build-up, brace for surges, loot in breathers. */
function WaveChip({ time }: { time: number }) {
  const wave = waveAt(time)
  return <span className={`wave-chip wave-${wave.phase}`} style={{ "--progress": wave.progress } as CSSProperties}>{waveLabel[wave.phase]}</span>
}

function HeroMedallion({ view }: { view: DungeonState }) {
  const progress = view.xp / xpThreshold(view.level)
  return (
    <div className="hero-medallion" style={{ "--xp": progress } as CSSProperties} aria-hidden="true">
      <span className="medallion-ring" />
      <span className="medallion-face"><Glyph name="shield" /></span>
      <b>{view.level}</b>
    </div>
  )
}

function Vitals({ view }: { view: DungeonState }) {
  const { player } = view
  return (
    <section className="vitals hud-plate" aria-label="Player status">
      <HeroMedallion view={view} />
      <div className="vitals-bars">
        <div className="health-row">
          <span>HP</span>
          <div className="hearts" aria-label={`${player.hp} of ${player.maxHp} hearts`}>{Array.from({ length: player.maxHp }, (_, i) => <i key={i} className={i < player.hp ? "filled" : ""} />)}</div>
          <strong className="gold-count" aria-label={`${view.gold} gold`}><CoinIcon />{view.gold}</strong>
        </div>
        <div className="resource-row mana-row"><span>MP</span><meter min="0" max="100" value={player.mana} aria-label="Mana" /><small>{Math.floor(player.mana)}</small></div>
        <div className="resource-row shield-row"><span>SH</span><meter min="0" max="4" value={player.shield} aria-label="Shield" /><small>{player.shield}/4</small></div>
        <div className="resource-row xp-row"><span>LV {view.level}</span><progress max={xpThreshold(view.level)} value={view.xp} aria-label="Experience" /><small>{view.xp}/{xpThreshold(view.level)}</small></div>
      </div>
    </section>
  )
}

export function RunHud({ view, onPause }: { view: DungeonState; onPause: () => void }) {
  return <header className="run-hud"><Vitals view={view} /><CombatMetrics view={view} onPause={onPause} /></header>
}

function WeaponBadge({ id, view }: { id: WeaponId; view: DungeonState }) {
  const weapon = view.weapons[id], rule = weaponRules[id]
  const charge = id === "orbit" ? 1 : 1 - Math.max(0, Math.min(1, weapon.timer / rule.interval[weapon.level - 1]!))
  return (
    <span className={`equipment-badge weapon-badge weapon-${id} ${weapon.level >= rule.max ? "evolved" : ""}`} title={dungeonUpgrades[id].description} style={{ "--charge": charge, "--accent": `#${rule.color.toString(16).padStart(6, "0")}` } as CSSProperties}>
      <span className="weapon-icon"><Glyph name={weaponGlyph[id]} /></span>
      <span>{rule.name}<small className="level-pips">{Array.from({ length: rule.max }, (_, i) => <i key={i} className={i < weapon.level ? "on" : ""} />)}</small></span>
    </span>
  )
}

/** Owned weapons, supplies and relics, each with live status. */
export function BuildStrip({ view }: { view: DungeonState }) {
  const supplies = (Object.keys(dungeonSupplies) as SupplyKind[]).filter(id => view.supplies[id] > 0)
  const relics = (Object.entries(view.relics) as [RelicId, number][]).filter(([, rank]) => rank > 0)
  const supplyStatus = (id: SupplyKind) => id === "shield" ? `${view.player.shield}/4 SHIELD` : id === "sentry" ? view.sentry ? `${Math.ceil(view.sentry.life)}s ACTIVE` : "EXPIRED" : `USED ×${view.supplies[id]}`
  return (
    <aside className="build-strip" aria-label="Acquired equipment" tabIndex={0}>
      {weaponIds.filter(id => view.weapons[id].level > 0).map(id => <WeaponBadge key={id} id={id} view={view} />)}
      {supplies.map(id => {
        const item = dungeonSupplies[id]
        return <span className={`equipment-badge item-${id}`} key={id} title={`${item.name} · ${item.benefit} · Collected ${view.supplies[id]}`}><Glyph name={item.icon} /><span>{item.name}<small>{supplyStatus(id)}</small></span></span>
      })}
      {relics.map(([id, rank]) => (
        <span className="equipment-badge relic-badge" key={id} title={dungeonUpgrades[id].description}>
          <Glyph name={relicGlyph[id]} />
          <span>{dungeonUpgrades[id].name}<small>{id === "lightning" || id === "vowels" ? view.procs[id] > 0 ? `${view.procs[id].toFixed(1)}s RECHARGE` : "AUTO · READY" : `ACTIVE · RANK ${rank}`}</small></span>
        </span>
      ))}
    </aside>
  )
}
