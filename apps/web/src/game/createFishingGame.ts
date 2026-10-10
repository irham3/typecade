import { FishingScene } from "./FishingScene"
import type { GameEventBridge } from "../bridge/game-event-bridge"

export function createFishingGame(parent: HTMLElement, bridge: GameEventBridge): FishingScene {
	return new FishingScene(parent, bridge)
}
