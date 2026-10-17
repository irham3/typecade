import type { DungeonState } from "@typecade/contracts"
import { skillRules } from "@typecade/content"

/**
 * Bottom-centre readout of what is being typed: the typed letters, then the rest of the word
 * they currently point at (or of the skill name in skill mode). Purely derived from state.
 */
export function TypingBar({ view }: { view: DungeonState }) {
  const skillMode = view.phase === "skills"
  const typed = skillMode ? view.command : view.prefix
  const target = skillMode ? null : view.enemies.find(enemy => enemy.id === view.target)
  const goal = skillMode
    ? Object.values(skillRules).map(rule => rule[view.language]).find(name => typed && name.startsWith(typed)) ?? ""
    : target?.words[0] ?? ""
  const matches = skillMode || !typed ? 0 : view.queue.filter(id => view.enemies.find(enemy => enemy.id === id)?.words[0]?.startsWith(typed)).length
  return (
    <div className={`typing-bar ${typed ? "active" : ""} ${skillMode ? "skill-mode" : ""}`} role="status" aria-live="off" aria-label={typed ? `Typed ${typed}` : "Nothing typed"}>
      {typed
        ? <><span className="typed">{typed}</span><span className="caret" aria-hidden="true" /><span className="rest">{goal.slice(typed.length)}</span>{matches > 1 && <small>{matches} match</small>}</>
        : <span className="placeholder">{skillMode ? "type a skill name" : "type a word"}</span>}
    </div>
  )
}
