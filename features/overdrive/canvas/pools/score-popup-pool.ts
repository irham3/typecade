import type { Container } from "pixi.js"

export class ScorePopupPool<T extends Container> {
  private active: T[] = []
  private available: T[] = []

  constructor(
    private readonly factory: () => T,
    private readonly reset?: (node: T) => void
  ) {}

  get activeCount() {
    return this.active.length
  }

  allocate(root: Container, text: string): T {
    void text
    let node: T
    
    // Enforce 3-popup cap by recycling the oldest active popup
    if (this.active.length >= 3) {
      node = this.active.shift()!
      if (node.parent) node.parent.removeChild(node)
      if (this.reset) this.reset(node)
      this.available.push(node)
    }

    if (this.available.length > 0) {
      node = this.available.pop()!
    } else {
      node = this.factory()
    }
    
    node.visible = true
    root.addChild(node)
    this.active.push(node)
    return node
  }

  free(node: T) {
    const idx = this.active.indexOf(node)
    if (idx !== -1) {
      this.active.splice(idx, 1)
      node.visible = false
      if (node.parent) node.parent.removeChild(node)
      if (this.reset) this.reset(node)
      this.available.push(node)
    }
  }

  destroy() {
    for (const node of this.active) node.destroy()
    for (const node of this.available) node.destroy()
    this.active = []
    this.available = []
  }
}
