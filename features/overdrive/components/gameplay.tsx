import { Hud } from "./hud"
import { GameplayLayer } from "./gameplay-layer"

export function Gameplay() {
  return (
    <main
      data-overdrive-gameplay
      tabIndex={0}
      className="relative h-full min-h-0 w-full min-w-0 overflow-hidden outline-none"
    >
      <GameplayLayer />
      <Hud />
    </main>
  )
}
