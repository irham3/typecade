import { Container, Graphics, Text } from "pixi.js"
import type { StageType } from "@/lib/engine/overdrive"
import { SCENE, V } from "./visual-assets"
import { TextPool } from "./pools/text-pool"
import { targetChoiceCues } from "./command-rail-model"

export interface CommandRailState {
  word: string
  upcomingWords: readonly string[]
  caretIndex: number
  dirty: boolean
  overdriveCharge: number
  targetOrdinal: number
  zone: number
  stage: StageType
  armedItemIds: readonly string[]
  reducedMotion: boolean
}

export class CommandRail {
  readonly root = new Container()
  private readonly panel = new Graphics()
  private readonly charge = new Graphics()
  private readonly wordLayer = new Container()
  private readonly queueLayer = new Container()
  private readonly caret = new Graphics()
  private readonly strike = new Graphics()
  private readonly status = new Text({ text: "", style: { fontSize: 14, fill: V.text } })
  
  private width = 0
  private compact = false

  private readonly wordPool = new TextPool(
    () => new Text({ text: "", style: { fontFamily: "JetBrains Mono", fontWeight: "700" } })
  )

  constructor() {
    this.root.addChild(this.panel)
    this.root.addChild(this.charge)
    this.root.addChild(this.wordLayer)
    this.root.addChild(this.queueLayer)
    this.root.addChild(this.caret)
    this.root.addChild(this.strike)
    this.root.addChild(this.status)
    this.status.anchor.set(0.5, 1)
  }

  resize(width: number, height: number) {
    void height
    this.width = width
    this.compact = width < SCENE.compactWidth
  }

  render(state: CommandRailState) {
    const railWidth = this.compact
      ? Math.max(0, this.width - SCENE.rail.compactGutter)
      : Math.min(
          SCENE.rail.desktopMaxWidth,
          Math.max(0, this.width - SCENE.rail.desktopGutter),
        )

    this.panel
      .clear()
      .roundRect(
        -railWidth / 2,
        -SCENE.rail.height / 2,
        railWidth,
        SCENE.rail.height,
        SCENE.rail.radius,
      )
      .fill({ color: V.bg, alpha: 0.88 })
      .stroke({
        color: state.dirty ? V.red : V.line,
        width: 1,
        alpha: state.dirty ? 0.72 : 0.92,
      })

    const chargeRatio = Math.max(0, Math.min(1, state.overdriveCharge / 100))
    this.charge
      .clear()
      .roundRect(
        -railWidth / 2 + 8,
        SCENE.rail.height / 2 - 7,
        Math.max(0, railWidth - 16),
        3,
        1.5,
      )
      .fill({ color: V.panel2 })
      .roundRect(
        -railWidth / 2 + 8,
        SCENE.rail.height / 2 - 7,
        Math.max(0, railWidth - 16) * chargeRatio,
        3,
        1.5,
      )
      .fill({ color: chargeRatio >= 1 ? V.yellow : V.cyan })

    this.wordPool.freeAll()
    const fontSize = this.compact
      ? SCENE.rail.activeFont.compact
      : SCENE.rail.activeFont.desktop

    let totalWidth = 0
    const characters: Text[] = []
    
    for (const character of state.word) {
      const text = this.wordPool.allocate(this.wordLayer, character, 0)
      text.text = character
      text.style.fontSize = fontSize
      characters.push(text)
      totalWidth += text.width
    }

    let cursor = -totalWidth / 2
    let caretX = cursor
    for (const [index, text] of characters.entries()) {
      text.anchor.set(0)
      text.x = cursor
      text.y = -fontSize / 2 - 20
      text.style.fill = state.dirty
        ? V.red
        : index < state.caretIndex
          ? V.text
          : V.green
      if (index === state.caretIndex) caretX = cursor
      cursor += text.width
    }
    if (state.caretIndex >= characters.length) caretX = cursor

		const targetCues = targetChoiceCues(state.word, state.upcomingWords, {
			stage: state.stage,
			zone: state.zone,
			targetOrdinal: state.targetOrdinal,
		})
		const queueNodes = targetCues.slice(1).map((cue) => {
			const text = this.wordPool.allocate(this.queueLayer, "", 0)
			const status = cue.statuses.length > 0 ? ` · ${cue.statuses.join("/")}` : ""
			text.text = `[${cue.prefix}] ${cue.word.toUpperCase()} · HP ${cue.hp} · +${cue.reward} · ${cue.tacticalLabel}${status} · ${Math.ceil(cue.threatMs / 1_000)}S`
			text.style.fontSize = SCENE.rail.previewFont
			text.style.fill = V.mid
			text.anchor.set(0, 0.5)
			return text
		})
		if (this.compact) {
			for (const [index, text] of queueNodes.entries()) {
				text.anchor.set(0.5)
				text.position.set(0, SCENE.rail.previewY + index * SCENE.rail.previewRowGap)
			}
		} else {
			const queueWidth = queueNodes.reduce((total, text) => total + text.width, 0)
				+ Math.max(0, queueNodes.length - 1) * SCENE.rail.previewGap
			let queueX = -queueWidth / 2
			for (const text of queueNodes) {
				text.position.set(queueX, SCENE.rail.previewY)
				queueX += text.width + SCENE.rail.previewGap
			}
		}

    this.caret
      .clear()
      .rect(
        caretX,
        -fontSize / 2 - 18,
        SCENE.rail.caretWidth,
        fontSize,
      )
      .fill({ color: state.dirty ? V.red : V.green })
      
    this.strike.clear()
    if (state.dirty) {
      this.strike
        .rect(-totalWidth / 2, fontSize / 2 - 14, totalWidth, 2)
        .fill({ color: V.red })
    }

		const switchKeys = targetCues.slice(1).map((cue) => cue.prefix)
		const targetInstruction = state.caretIndex === 0 && switchKeys.length > 0
			? `TYPE ${switchKeys.join(" / ")} TO SWITCH · TARGET ROLE MATTERS`
			: ""
		const armedInstruction = state.armedItemIds.length > 0
			? `ARMED · ${state.armedItemIds.join(" · ").toUpperCase()}`
			: ""
    this.status.text = targetInstruction || armedInstruction
    this.status.style.fill = state.dirty ? V.red : V.text
    this.status.y = SCENE.rail.height / 2 + 20
  }

  setWordFade(fade: number, caretIndex: number) {
    for (let i = 0; i < this.wordLayer.children.length; i++) {
      const child = this.wordLayer.children[i]
      if (child !== this.caret) {
        child.alpha = i === caretIndex ? 1 : fade
      }
    }
  }

  setShake(x: number) {
    this.wordLayer.x = x
  }

  destroy() {
    this.wordPool.destroy()
    this.root.destroy({ children: true })
  }
}
