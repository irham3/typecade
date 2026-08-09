import type { Container } from "pixi.js"
import { presentationHealth } from "../../presentation/telemetry"

export class SignalNodePool<T extends Container> {
  private active: T[] = []
  private available: T[] = []

  constructor(
    private readonly factory: () => T,
    private readonly reset?: (node: T) => void
  ) {}

  get activeCount() {
    return this.active.length
  }

  render(word: string, caretIndex: number, dirty: boolean) {
    const required = word.length
    
    // Hide excess nodes
    while (this.active.length > required) {
      const node = this.active.pop()!
      node.visible = false
      if (this.reset) this.reset(node)
      this.available.push(node)
    }

    // Grow if needed
    while (this.active.length < required) {
      if (this.available.length > 0) {
        const node = this.available.pop()!
        node.visible = true
        this.active.push(node)
      } else {
        const node = this.factory()
        node.visible = true
        this.active.push(node)
      }
    }
  }

  destroy() {
    for (const node of this.active) node.destroy()
    for (const node of this.available) node.destroy()
    this.active = []
    this.available = []
  }
}
