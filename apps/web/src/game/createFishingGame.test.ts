import { describe, expect, it, vi } from "vitest"
import type { GameEventBridge } from "../bridge/game-event-bridge"

const phaserMock = vi.hoisted(() => ({ configs: [] as unknown[], scenes: [] as unknown[][] }))

vi.mock("phaser", () => ({
	default: {
		AUTO: 7,
		Scale: { RESIZE: 3 },
		Game: class {
		scene = { add: (...args: unknown[]) => phaserMock.scenes.push(args) }
			constructor(config: unknown) { phaserMock.configs.push(config) }
		},
	},
}))
vi.mock("./FishingScene", () => ({ FishingScene: class { constructor(readonly bridge: unknown) {} } }))

import { createFishingGame } from "./createFishingGame"

describe("createFishingGame", () => {
	it("uses fallback dimensions when the parent has not been laid out", () => {
		phaserMock.configs.length = 0
		phaserMock.scenes.length = 0
		const parent = { clientWidth: 0, clientHeight: 0 } as HTMLElement
		const bridge = {} as GameEventBridge

		createFishingGame(parent, bridge)

		expect(phaserMock.configs[0]).toMatchObject({
			type: 7,
			parent,
			width: 1280,
			height: 720,
			backgroundColor: "#051326",
			scale: { mode: 3, parent, width: "100%", height: "100%" },
			render: { antialias: false, pixelArt: true, roundPixels: true, preserveDrawingBuffer: true },
			fps: { target: 60, forceSetTimeOut: false },
			scene: [],
		})
		expect(phaserMock.scenes[0]).toHaveLength(4)
		expect(phaserMock.scenes[0]?.[0]).toBe("FishingScene")
		expect(phaserMock.scenes[0]?.[2]).toBe(true)
		expect(phaserMock.scenes[0]?.[3]).toEqual({ bridge })
	})

	it("keeps measured dimensions when available", () => {
		phaserMock.configs.length = 0
		const parent = { clientWidth: 900, clientHeight: 500 } as HTMLElement

		createFishingGame(parent, {} as GameEventBridge)

		expect(phaserMock.configs[0]).toMatchObject({ width: 900, height: 500 })
	})
})
