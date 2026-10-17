import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { DungeonState, SkillId } from "@typecade/contracts"
import { skillRules } from "@typecade/content"
import { skillRecharge } from "@typecade/game-rules"
import { Glyph } from "./Glyph"

const skillColor: Record<SkillId, string> = { cleave: "#ff7a4f", storm: "#64cfe9", heal: "#9bdb7a" }
const skillGlyph: Record<SkillId, "sword" | "storm" | "heal"> = { cleave: "sword", storm: "storm", heal: "heal" }

/**
 * One active skill, read like a mobile MOBA button: the icon darkens with a clockwise sweep while
 * recharging and shows how many more words it needs; a mana ring shows whether it is affordable;
 * pips show its rank. It pops when it becomes ready.
 */
export function SkillCard({ view, id, onCast }: { view: DungeonState; id: SkillId; onCast: () => void }) {
  const skill = view.skills[id], rules = skillRules[id], word = rules[view.language]
  const typed = view.phase === "skills" && word.startsWith(view.command) ? view.command.length : 0
  const cost = Math.max(10, rules.cost - (skill.level - 1) * 5), recharge = skillRecharge(view, id)
  const full = id === "heal" && view.player.hp === view.player.maxHp, poor = view.player.mana < cost
  const ready = skill.cooldown === 0 && !poor && !full
  const justReady = useJustReady(ready)
  const status = skill.cooldown ? `${skill.cooldown} more ${skill.cooldown === 1 ? "word" : "words"}` : poor ? `Needs ${cost} mana` : full ? "Health is full" : "Ready"
  return (
    <button className={`skill-card skill-${id} ${ready ? "ready" : "unavailable"} ${justReady ? "just-ready" : ""}`} style={{ "--skill-color": skillColor[id], "--cd": skill.cooldown / recharge, "--mana": Math.min(1, view.player.mana / cost) } as CSSProperties}
      onClick={onCast} aria-label={`${word} skill, rank ${skill.level}: ${status}`} title={`${rules.levels[skill.level - 1]} Costs ${cost} mana. Recharge: ${recharge} finished words.`}>
      <span className="skill-face">
        <span className="mana-ring" aria-hidden="true" />
        <Glyph name={skillGlyph[id]} />
        {skill.cooldown > 0 && <><span className="cooldown-sweep" aria-hidden="true" /><b className="cooldown-count" aria-hidden="true">{skill.cooldown}</b></>}
      </span>
      <span>
        <strong><b>{word.slice(0, typed)}</b>{word.slice(typed)}</strong>
        <small>{skill.cooldown ? `${skill.cooldown}W TO GO` : poor ? `${cost} MP NEEDED` : `${cost} MP`}</small>
      </span>
      <small className="skill-level" aria-hidden="true">{[1, 2, 3].map(rank => <i key={rank} className={rank <= skill.level ? "on" : ""} />)}</small>
      <i>{ready ? skill.level === 3 ? "EVO" : "READY" : full ? "FULL" : "WAIT"}</i>
    </button>
  )
}

/** True for a moment after `ready` flips on, so the card can pop. */
function useJustReady(ready: boolean) {
  const previous = useRef(ready), [pop, setPop] = useState(false)
  useEffect(() => {
    if (ready && !previous.current) { queueMicrotask(() => setPop(true)); const timer = setTimeout(() => setPop(false), 500); previous.current = ready; return () => clearTimeout(timer) }
    previous.current = ready
  }, [ready])
  return pop
}
