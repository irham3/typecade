import type { StageType } from "@/lib/engine/overdrive"

export type StagePresentationCopy = {
  label: string
  instruction: string
  accent: "green" | "pink" | "red"
}

export const STAGE_COPY = {
  warmup: {
    label: "WARM-UP",
    instruction: "Clean words raise Mult.",
    accent: "green",
  },
  rush: {
    label: "RUSH",
    instruction: "Keep the clean-word streak.",
    accent: "pink",
  },
  glitch: {
    label: "GLITCH",
    instruction: "Glitch rules are active.",
    accent: "red",
  },
} satisfies Record<StageType, StagePresentationCopy>
