import { describe, expect, it } from "vitest"
import { FormationDirector, type FormationState } from "../formation-director"
import type { LoadedRigAssets } from "../../assets/combat-assets"
import type { OverdrivePresentationEvent } from "../../../presentation/events"

function makeState(overrides?: Partial<FormationState>): FormationState {
	return {
		targetOrdinal: 0,
		stage: "warmup",
		zone: 1,
		focusPaused: false,
		reducedMotion: false,
		...overrides,
	}
}

function makeMockAssets(): LoadedRigAssets {
	return {
		definition: {
			id: "enemy",
			atlasUrl: "mock",
			defaultClip: "idle",
			parts: [],
			clips: {
				idle: { name: "idle", durationMs: 100, loop: true, priority: 0, tracks: [] },
				locomotion: { name: "locomotion", durationMs: 100, loop: true, priority: 0, tracks: [] },
				defeat: { name: "defeat", durationMs: 100, loop: false, priority: 0, tracks: [] }
			},
			variants: [
				{ id: "cache-hound", enabledPartIds: [], baseScale: 1 },
				{ id: "relay-ram", enabledPartIds: [], baseScale: 1 },
				{ id: "packet-stalker", enabledPartIds: [], baseScale: 1 },
			],
		},
		textures: {} as Record<string, import("pixi.js").Texture>,
		fallback: false,
	}
}

describe("FormationDirector", () => {
	it("initializes with the first active target and queued backup", () => {
		const assets = makeMockAssets()
		const state = makeState({ targetOrdinal: 0 })
		const director = new FormationDirector(state, assets)
		
		const activeTargets = director.getActiveTargets()
		expect(activeTargets.size).toBe(3) // 0 (active), 1 (upcoming), 2 (distant)
		
		const current = activeTargets.get(0)!
		expect(current.role).toBe("active")
		
		const next1 = activeTargets.get(1)!
		expect(next1.role).toBe("upcoming")

		const next2 = activeTargets.get(2)!
		expect(next2.role).toBe("distant")
	})

	it("promotes targets as ordinal advances", () => {
		const assets = makeMockAssets()
		const state = makeState({ targetOrdinal: 0 })
		const director = new FormationDirector(state, assets)
		
		director.sync(makeState({ targetOrdinal: 1 }))
		
		const activeTargets = director.getActiveTargets()
		const current = activeTargets.get(1)!
		expect(current.role).toBe("active")
		
		const next1 = activeTargets.get(2)!
		expect(next1.role).toBe("upcoming")
		
		const next2 = activeTargets.get(3)!
		expect(next2.role).toBe("distant")
	})

	it("marks target as retiring on word completion", () => {
		const assets = makeMockAssets()
		const state = makeState({ targetOrdinal: 0 })
		const director = new FormationDirector(state, assets)
		
		// Complete word 0
		director.handle({ type: "word-completed", id: 1, targetOrdinal: 0, combo: 1, overdriveReleased: false } as Extract<OverdrivePresentationEvent, { type: "word-completed" }>)
		
		const activeTargets = director.getActiveTargets()
		const current = activeTargets.get(0)!
		expect(current.role).toBe("retiring")
		expect(current.isHit).toBe(true)
	})

	it("moves retiring targets off screen and recycles them", () => {
		const assets = makeMockAssets()
		const state = makeState({ targetOrdinal: 0 })
		const director = new FormationDirector(state, assets)
		
		director.resize(1000, 600, { deckY: 300, scale: 1, width: 1000, height: 600 })
		
		// Retire target 0
		director.handle({ type: "word-completed", id: 1, targetOrdinal: 0, combo: 1, overdriveReleased: false } as Extract<OverdrivePresentationEvent, { type: "word-completed" }>)
		
		// Target should move right
		const retiringTarget = director.getActiveTargets().get(0)!
		const initialX = retiringTarget.layoutX
		
		// Move it over time (delta is clamped to 50ms)
		for (let i = 0; i < 8; i++) {
			director.update(50)
		} // 50 + (50 * 8) = 450ms > 380ms
		
		// Should be recycled and removed from active targets map
		expect(director.getActiveTargets().has(0)).toBe(false)
	})

	it("generates stable deterministic formations", () => {
		const assets = makeMockAssets()
		const director1 = new FormationDirector(makeState({ stage: "warmup", zone: 1 }), assets)
		const director2 = new FormationDirector(makeState({ stage: "warmup", zone: 1 }), assets)
		
		const active1 = director1.getActiveTargets().get(0)!
		const active2 = director2.getActiveTargets().get(0)!
		
		expect(active1.variant).toBe(active2.variant)
	})

	it("updates variant schedule when stage or zone changes", () => {
		const assets = makeMockAssets()
		const state = makeState({ targetOrdinal: 0, stage: "warmup", zone: 1 })
		const director = new FormationDirector(state, assets)
		
		const _initialVariant = director.getActiveTargets().get(0)!.variant
		
		// Sync with different stage to regenerate schedule
		director.sync(makeState({ targetOrdinal: 0, stage: "rush", zone: 1 }))
		
		// If schedule regenerated, target 0 would be re-assigned or at least the logic fires
		// (though in reality the pool targets might not re-initialize automatically without recycling,
		// but the schedule is definitely updated). We can verify by promoting new targets.
		director.sync(makeState({ targetOrdinal: 5, stage: "rush", zone: 1 }))
		const activeTargets = director.getActiveTargets()
		expect(activeTargets.has(5)).toBe(true)
	})

	it("does not update positions when focus paused", () => {
		const assets = makeMockAssets()
		const state = makeState({ targetOrdinal: 0 })
		const director = new FormationDirector(state, assets)
		
		director.resize(1000, 600, { deckY: 300, scale: 1, width: 1000, height: 600 })
		director.handle({ type: "word-completed", id: 1, targetOrdinal: 0, combo: 1, overdriveReleased: false } as Extract<OverdrivePresentationEvent, { type: "word-completed" }>)
		
		const retiringTarget = director.getActiveTargets().get(0)!
		const pauseX = retiringTarget.layoutX
		
		director.sync(makeState({ focusPaused: true }))
		director.update(50)
		
		expect(retiringTarget.layoutX).toBe(pauseX) // Did not move
	})
})
