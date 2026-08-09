import type { Container } from "pixi.js"

export class ActorPool<T extends Container> {
  private active: T[] = []
  private available: T[] = []

  constructor(
    private readonly factory: () => T,
    private readonly reset?: (node: T) => void
  ) {}

  get activeCount() {
    return this.active.length
  }

  allocate(root: Container): T {
    let node: T
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

  freeAll() {
    for (const node of this.active) {
      node.visible = false
      if (node.parent) node.parent.removeChild(node)
      if (this.reset) this.reset(node)
      this.available.push(node)
    }
    this.active = []
  }

  destroy() {
    for (const node of this.active) node.destroy()
    for (const node of this.available) node.destroy()
    this.active = []
    this.available = []
  }
}
