import { useState } from "react"
import type { CSSProperties } from "react"
import type { TalentId } from "@typecade/contracts"
import { talentBranchColors, talentById, talentTree } from "@typecade/content"
import { nextTalentCost, rankOf, spentEmbers, talentStatus } from "@typecade/game-rules"
import { talentStore, useTalents } from "../profile/talentStore"
import { Glyph } from "./Glyph"

const branchLabel = { vitality: "Vitality", focus: "Focus", arsenal: "Arsenal" } as const
const amount = (value: number) => value.toLocaleString("en-US")

/**
 * Permanent skill tree bought with Embers earned by every run. One root, three branches;
 * a node opens once its parent has a rank. Fully keyboard operable (buttons in reading order).
 */
export function SkillTree({ onClose }: { onClose: () => void }) {
  const profile = useTalents()
  const [selected, setSelected] = useState<TalentId>("heart")
  const [message, setMessage] = useState("")
  const node = talentById(selected)!
  const status = talentStatus(profile, selected), rank = rankOf(profile.ranks, selected), cost = nextTalentCost(profile, selected)
  const buy = () => {
    const result = talentStore.buy(selected)
    setMessage(result.ok ? `${node.name} rank ${rankOf(result.profile.ranks, selected)} learned. It applies from your next run.` : result.reason === "locked" ? `Learn ${talentById(node.requires!)!.name} first.` : result.reason === "embers" ? `You need ${amount((cost ?? 0) - profile.embers)} more Embers.` : "Already at max rank.")
  }
  const reset = () => { talentStore.reset(); setMessage("All Embers refunded. Plan a new path.") }
  return (
    <section className="skill-tree" aria-label="Skill tree">
      <header className="armory-head">
        <h2>Skill Tree</h2>
        <p className="tree-embers" aria-label={`${profile.embers} Embers`}><Glyph name="flame" />{amount(profile.embers)}</p>
        <button className="armory-close" onClick={onClose}>Back</button>
      </header>
      <p className="tree-intro">Every run earns Embers, win or lose. Spend them here: bonuses apply from your next run. Typing stays the only way to fight.</p>
      <div className="tree-grid" role="list">
        {(["vitality", "focus", "arsenal"] as const).map((branch, column) => <span key={branch} className="tree-branch" style={{ gridColumn: column + 1, "--branch": talentBranchColors[branch] } as CSSProperties}>{branchLabel[branch]}</span>)}
        {talentTree.map(entry => {
          const state = talentStatus(profile, entry.id), owned = rankOf(profile.ranks, entry.id)
          return (
            <div key={entry.id} role="listitem" className={`tree-cell ${entry.requires ? "has-parent" : ""}`} style={{ gridColumn: entry.column + 1, gridRow: entry.row + 2, "--branch": talentBranchColors[entry.branch] } as CSSProperties}>
              <button className={`tree-node state-${state} ${entry.id === selected ? "selected" : ""} ${owned ? "learned" : ""}`} aria-pressed={entry.id === selected} onClick={() => { setSelected(entry.id); setMessage("") }} aria-label={`${entry.name}, rank ${owned} of ${entry.costs.length}`}>
                <span className="tree-node-name">{entry.name}</span>
                <small className="level-pips">{entry.costs.map((_, i) => <i key={i} className={i < owned ? "on" : ""} />)}</small>
              </button>
            </div>
          )
        })}
      </div>
      <footer className="armory-detail">
        <div>
          <strong>{node.name} · {rank}/{node.costs.length}</strong>
          <p>{node.effect}</p>
          {node.requires && rankOf(profile.ranks, node.requires) < 1 && <p className="tree-lock">Requires {talentById(node.requires)!.name}.</p>}
        </div>
        {status === "maxed" ? <button disabled>Max rank</button>
          : <button className="primary-action" onClick={buy} disabled={status !== "available"}><Glyph name="flame" />{status === "locked" ? "Locked" : `Learn · ${amount(cost!)}`}</button>}
        <p className="armory-message" role="status">{message}</p>
        <p className="tree-footnote">Lifetime {amount(profile.lifetime)} Embers · {amount(spentEmbers(profile))} spent {spentEmbers(profile) > 0 && <button className="quiet" onClick={reset}>Refund all</button>}</p>
      </footer>
    </section>
  )
}
