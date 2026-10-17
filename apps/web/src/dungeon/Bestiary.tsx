import { useEffect, useMemo, useState } from "react"
import type { EnemyKind } from "@typecade/contracts"
import { bestiary, enemyLunges, enemyProfiles } from "@typecade/content"
import { Glyph } from "./Glyph"
import { DungeonDialog } from "./ui/DungeonDialog"
import { GemDivider } from "./ui/Ornament"

type Role = (typeof bestiary)[number]["role"]
type Filter = "All" | Role

const filters: Filter[] = ["All", "Horde", "Swift", "Ranged", "Caster", "Brute", "Elite", "Boss", "Object"]

const roleColor: Record<Role, string> = {
  Horde: "#c9b48a", Swift: "#7fe0a0", Ranged: "#f0c46a", Caster: "#c58bff", Brute: "#e58a5a", Elite: "#ff6b6b", Boss: "#ffd36b", Object: "#7fd6ff",
}

const formatUnlock = (seconds: number) => seconds === 0 ? "From the start" : `From ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

function usePortraits() {
  const [portraits, setPortraits] = useState<Partial<Record<EnemyKind, string>>>({})
  useEffect(() => {
    let active = true
    void import("../game/portraits")
      .then(({ renderPortraits }) => renderPortraits(bestiary.map(entry => entry.kind)))
      .then(result => { if (active) setPortraits(result) })
      .catch(() => { /* Portraits are decorative; cards fall back to role glyphs. */ })
    return () => { active = false }
  }, [])
  return portraits
}

function ThreatPips({ threat }: { threat: number }) {
  return <span className="threat-pips" aria-label={`Threat ${threat} of 5`}>{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < threat ? "on" : ""} />)}</span>
}

function BestiaryCard({ entry, portrait }: { entry: (typeof bestiary)[number]; portrait?: string }) {
  const profile = enemyProfiles[entry.kind]
  const charges = entry.kind in enemyLunges
  return (
    <article className={`bestiary-card role-${entry.role.toLowerCase()}`} style={{ ["--role" as string]: roleColor[entry.role] }}>
      <div className="bestiary-portrait">
        {portrait ? <img src={portrait} alt="" /> : <Glyph name={entry.role === "Object" ? "gem" : "skull"} />}
        <span className="bestiary-role">{entry.role}</span>
      </div>
      <h3>{entry.name}</h3>
      {entry.role !== "Object" && <ThreatPips threat={entry.threat} />}
      <p>{entry.lore}</p>
      <footer>
        <span>{formatUnlock(entry.unlock)}</span>
        {profile?.tag && <span>{profile.tag}</span>}
        {charges && <span>CHARGES</span>}
      </footer>
    </article>
  )
}

/** Encyclopedia of every foe and object, with in-engine portraits. */
export function Bestiary({ onClose }: { onClose: () => void }) {
  const [filter, setFilter] = useState<Filter>("All")
  const portraits = usePortraits()
  const entries = useMemo(() => bestiary.filter(entry => filter === "All" || entry.role === filter), [filter])
  return (
    <DungeonDialog title="Bestiary" onCancel={onClose} className="bestiary-dialog" tone="info">
      <span className="eyebrow">{bestiary.length} ENTRIES · NEW FOES ARRIVE AS THE RUN GOES ON</span>
      <nav className="bestiary-filters" aria-label="Filter by role">
        {filters.map(option => <button key={option} className={option === filter ? "active" : ""} aria-pressed={option === filter} onClick={() => setFilter(option)}>{option}</button>)}
      </nav>
      <GemDivider />
      <div className="bestiary-grid">{entries.map(entry => <BestiaryCard key={entry.kind} entry={entry} portrait={portraits[entry.kind]} />)}</div>
      <button className="primary-action" onClick={onClose}>Close bestiary</button>
    </DungeonDialog>
  )
}
