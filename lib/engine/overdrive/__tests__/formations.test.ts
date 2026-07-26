import { describe, expect, it } from "vitest"
import { createRng } from "../../rng"
import {
	FORMATION_VARIANTS_BY_STAGE,
	createFormationSchedule,
} from "../formations"
import { createRun } from "../run"

const words = ["signal", "vector", "system", "kernel", "packet", "cipher"]

describe("createFormationSchedule", () => {
	it("returns the same schedule for the same seed and stage", () => {
		const first = createFormationSchedule("warmup", 2, createRng("formation"), 24)
		const second = createFormationSchedule("warmup", 2, createRng("formation"), 24)
		expect(first).toEqual(second)
	})

	it("changes at least one slot for a different seed", () => {
		const first = createFormationSchedule("rush", 3, createRng("first"), 24)
		const second = createFormationSchedule("rush", 3, createRng("second"), 24)
		expect(first.some((variant, index) => variant !== second[index])).toBe(true)
	})

	it.each(["warmup", "rush", "glitch"] as const)(
		"keeps %s variants inside one stage family",
		(stage) => {
			const schedule = createFormationSchedule(stage, 4, createRng(stage), 24)
			expect(schedule).toHaveLength(24)
			expect(schedule.every((variant) => (
				FORMATION_VARIANTS_BY_STAGE[stage].includes(variant)
			))).toBe(true)
		},
	)

	it("starts Zone 1 with the primary silhouette and introduces alternatives", () => {
		const schedule = createFormationSchedule("warmup", 1, createRng("beginner"), 24)
		expect(schedule[0]).toBe("packet-stalker")
		expect(new Set(schedule).size).toBeGreaterThan(1)
	})

	it("avoids adjacent duplicates when another variant is available", () => {
		const schedule = createFormationSchedule("glitch", 5, createRng("spacing"), 24)
		for (let index = 1; index < schedule.length; index += 1) {
			expect(schedule[index]).not.toBe(schedule[index - 1])
		}
	})
})

describe("run formation persistence", () => {
	it("reproduces schedules for equal run seeds", () => {
		const first = createRun({ seed: "run-formation", words })
		const second = createRun({ seed: "run-formation", words })
		first.start()
		second.start()
		expect(first.snapshot().formationSchedule)
			.toEqual(second.snapshot().formationSchedule)
	})

	it("round-trips the active schedule through the versioned save", () => {
		const run = createRun({ seed: "saved-formation", words })
		run.start()
		const schedule = run.snapshot().formationSchedule
		const restored = createRun({ seed: "saved-formation", words })
		expect(restored.loadState(run.exportState())).toBe(true)
		expect(restored.snapshot().formationSchedule).toEqual(schedule)
	})

	it("recreates the initial schedule when a seeded run restarts", () => {
		const run = createRun({ seed: "restart-formation", words })
		run.start()
		const first = run.snapshot().formationSchedule
		run.restart()
		expect(run.snapshot().formationSchedule).toEqual(first)
	})
})
