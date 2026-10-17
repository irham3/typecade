import { useEffect, useState } from "react"
import { coinBreakdown, coinTuning, type CoinSource } from "@typecade/game-rules"
import type { DungeonState } from "@typecade/contracts"
import { CoinIcon } from "./ui/CoinIcon"

const sourceLabel: Record<CoinSource, (run: Pick<DungeonState, "time" | "kills" | "level" | "gold">) => string> = {
  time: run => `Survived ${Math.floor(run.time / 60)}:${String(Math.floor(run.time % 60)).padStart(2, "0")}`,
  kills: run => `${run.kills} defeated`,
  level: run => `Level ${run.level}`,
  gold: run => `${run.gold} gold`,
}

const COUNT_MS = 900
const amount = (value: number) => value.toLocaleString("en-US")

/** Eases a number up from zero once; jumps straight to the value when motion is reduced. */
function useCountUp(target: number) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.querySelector("[data-reduced-effects=true]")) { queueMicrotask(() => setShown(target)); return }
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS)
      setShown(Math.round(target * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return shown
}

/** Coins earned this run: a large counted total, where it came from, and the new wallet. */
export function RunReward({ view, payout, wallet }: { view: DungeonState; payout: { earned: number; bonus: number } | null; wallet: number }) {
  const breakdown = coinBreakdown(view)
  const total = (payout?.earned ?? 0) + (payout?.bonus ?? 0)
  const shown = useCountUp(total)
  if (!payout) return (
    <section className="run-reward empty" aria-label="Coins earned">
      <CoinIcon className="reward-coin" />
      <p>No coins this time. Survive {coinTuning.minSeconds} seconds to earn some.</p>
    </section>
  )
  return (
    <section className="run-reward" aria-label={`${total} coins earned`}>
      <div className="reward-total">
        <CoinIcon className="reward-coin" />
        <div><small>COINS EARNED</small><b>+{amount(shown)}</b></div>
      </div>
      <ul className="reward-lines">
        {breakdown.lines.map(line => <li key={line.source}><span>{sourceLabel[line.source](view)}</span><b>+{amount(line.amount)}</b></li>)}
        {breakdown.capped && <li className="capped"><span>Run limit</span><b>{amount(coinTuning.maxPerRun)} max</b></li>}
        {payout.bonus > 0 && <li className="bonus"><span>First run today</span><b>+{amount(payout.bonus)}</b></li>}
      </ul>
      <p className="reward-wallet"><CoinIcon />{amount(wallet)} <span>in your purse</span></p>
    </section>
  )
}
