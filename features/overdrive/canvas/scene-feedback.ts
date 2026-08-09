import { Container, Graphics } from "pixi.js"
import { MOTION, V } from "./visual-assets"
import type { OverdrivePresentationEvent } from "../presentation/events"
import type { PresentationEventEnvelope } from "../presentation/scheduler-types"
import { sfx } from "../fx/sfx"

export class SceneFeedback {
  readonly typoBars = new Graphics()
  readonly lowTimeEdge = new Graphics()
  
  private width = 0
  private height = 0
  private wordShakeMs = 0
  private stageShakeMs = 0
  private hitstopMs = 0
  private typoBarsMs = 0
  private eventIndex = 0

  constructor(private readonly stage: Container, private readonly overlay: Container) {
    this.overlay.addChild(this.lowTimeEdge, this.typoBars)
  }

  resize(width: number, height: number) {
    this.width = width
    this.height = height
  }

  handle(envelope: PresentationEventEnvelope<OverdrivePresentationEvent>, reducedMotion: boolean, screenShake: boolean) {
    const event = envelope.event
    if (event.type === "rejected-character") {
      sfx.typo()
      this.wordShakeMs = reducedMotion ? 0 : MOTION.typoMs
      this.typoBarsMs = MOTION.typoMs
      this.typoBars.clear()
      for (let index = 0; index < 5; index += 1) {
        const x = ((this.eventIndex * 83 + index * 137) % Math.max(1, this.width - 96)) + 48
        const y = ((this.eventIndex * 47 + index * 79) % Math.max(1, this.height - 192)) + 96
        const barWidth = 32 + ((index * 29 + this.eventIndex * 11) % 96)
        this.typoBars.rect(x, y, barWidth, 2).fill({ color: V.red, alpha: 0.35 })
      }
      this.eventIndex += 1
      return
    }

    if (event.type === "stage-cleared") {
      sfx.stageClear()
      this.hitstopMs = reducedMotion ? 0 : MOTION.hitstopMs
      this.stageShakeMs = reducedMotion || !screenShake ? 0 : MOTION.stageShakeMs
      return
    }
  }

  update(
    delta: number, 
    timeLeftMs: number, 
    score: number, 
    quota: number
  ) {
    let hitstopConsumed = false
    if (this.hitstopMs > 0) {
      this.hitstopMs = Math.max(0, this.hitstopMs - delta)
      hitstopConsumed = true
    }

    if (this.typoBarsMs > 0) {
      this.typoBarsMs = Math.max(0, this.typoBarsMs - delta)
      this.typoBars.alpha = this.typoBarsMs / MOTION.typoMs
    } else {
      this.typoBars.clear()
    }

    if (this.stageShakeMs > 0) {
      this.stageShakeMs = Math.max(0, this.stageShakeMs - delta)
      const step = Math.floor(this.stageShakeMs / 20)
      this.stage.position.set(
        step % 2 === 0 ? 6 : -6,
        step % 3 === 0 ? 3 : -3,
      )
    } else {
      this.stage.position.set(0, 0)
    }

    const lowTime = timeLeftMs <= 10_000
    const lowTimeAlpha = lowTime
      ? 0.08 + (10_000 - timeLeftMs) / 10_000 * 0.16
      : 0
    const quotaRatio = quota <= 0
      ? 0
      : Math.min(1, score / quota)
    const overrunAlpha = quotaRatio >= 0.75
      ? (quotaRatio - 0.75) / 0.25 * 0.08
      : 0

    this.lowTimeEdge
      .clear()
      .rect(0, 0, this.width, this.height)
      .stroke({
        color: lowTime ? V.red : V.green,
        width: 8,
        alpha: Math.max(lowTimeAlpha, overrunAlpha),
      })
      
    return { hitstopConsumed, wordShakeMs: this.wordShakeMs }
  }

  consumeWordShake(delta: number) {
    if (this.wordShakeMs > 0) {
      this.wordShakeMs = Math.max(0, this.wordShakeMs - delta)
    }
    return this.wordShakeMs
  }

  destroy() {
    this.typoBars.destroy()
    this.lowTimeEdge.destroy()
  }
}
