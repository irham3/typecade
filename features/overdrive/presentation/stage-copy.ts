import type { StageType } from "@/lib/engine/overdrive"

export type StagePresentationCopy = {
  label: string
  instruction: string
  accent: "green" | "pink" | "red"
}

export const STAGE_COPY = {
  warmup: {

    label: "WARM-UP",
    instruction: "Build Mult. Mistakes reset it.",
    accent: "green",
  },
  rush: {
    label: "RUSH",
    instruction: "Keep the chain alive.",
    accent: "pink",
  },
  glitch: {
    label: "GLITCH",
    instruction: "Survive the corrupted pattern.",
    accent: "red",
  },
} satisfies Record<StageType, StagePresentationCopy>
