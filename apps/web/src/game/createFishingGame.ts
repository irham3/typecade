import Phaser from "phaser"
import { FishingScene } from "./FishingScene"
import type { GameEventBridge } from "../bridge/game-event-bridge"

export function createFishingGame(parent: HTMLElement, bridge: GameEventBridge): Phaser.Game {
	const scene = new FishingScene(bridge)
	const game = new Phaser.Game({
		type: Phaser.AUTO,
		parent,
		width: parent.clientWidth || 1280,
		height: parent.clientHeight || 720,
		backgroundColor: "#051326",
		scale: {
			mode: Phaser.Scale.RESIZE,
			parent,
			width: "100%",
			height: "100%",
		},
		render: {
			antialias: false,
			pixelArt: true,
			roundPixels: true,
			preserveDrawingBuffer: true,
		},
		fps: {
			target: 60,
			forceSetTimeOut: false,
		},
		scene: [],
	})
	game.scene.add("FishingScene", scene, true, { bridge })
	return game
}
