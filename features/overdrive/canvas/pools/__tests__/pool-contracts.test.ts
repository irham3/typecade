import { describe, expect, it, vi } from "vitest"
import { Container } from "pixi.js"
import { SignalNodePool } from "../signal-node-pool"
import { TextPool } from "../text-pool"
import { ScorePopupPool } from "../score-popup-pool"
import { presentationHealth } from "../../../presentation/telemetry"

describe("Pool Contracts", () => {
  it("reuses signal nodes across caret updates", () => {
    const createNode = vi.fn(() => {
      const g = new Container()
      ;(g as any).label = "signal-node"
      return g
    })
    const pool = new SignalNodePool(createNode)
    pool.render("signal", 0, false)
    expect(createNode).toHaveBeenCalledTimes(6)
    pool.render("signal", 4, false)
    expect(createNode).toHaveBeenCalledTimes(6)
    expect(pool.activeCount).toBe(6)
  })

  it("grows on longer words", () => {
    const createNode = vi.fn(() => new Container())
    const pool = new SignalNodePool(createNode)
    pool.render("longword", 0, false)
    expect(createNode).toHaveBeenCalledTimes(8)
  })

  it("hides excess nodes on shorter words", () => {
    const createNode = vi.fn(() => new Container())
    const pool = new SignalNodePool(createNode)
    pool.render("longword", 0, false)
    const activeBefore = pool.activeCount
    
    pool.render("short", 0, false)
    expect(pool.activeCount).toBe(5)
    expect(createNode).toHaveBeenCalledTimes(8) // no new creation
  })

  it("text pool reuses actors", () => {
    const reset = vi.fn()
    const pool = new TextPool(() => new Container(), reset)
    
    const root = new Container()
    pool.allocate(root, "A", 0)
    pool.allocate(root, "B", 1)
    expect(pool.activeCount).toBe(2)
    
    pool.freeAll()
    expect(pool.activeCount).toBe(0)
    
    pool.allocate(root, "C", 0)
    expect(reset).toHaveBeenCalledTimes(2)
    expect(pool.activeCount).toBe(1)
  })

  it("score popup caps at three", () => {
    const pool = new ScorePopupPool(() => new Container())
    const root = new Container()
    pool.allocate(root, "100")
    pool.allocate(root, "200")
    pool.allocate(root, "300")
    pool.allocate(root, "400")
    expect(pool.activeCount).toBe(3)
  })

  it("destroys owned objects exactly once", () => {
    const pool = new ScorePopupPool(() => new Container())
    const root = new Container()
    
    const p1 = pool.allocate(root, "1")
    const p2 = pool.allocate(root, "2")
    const destroy1 = vi.spyOn(p1, 'destroy')
    const destroy2 = vi.spyOn(p2, 'destroy')
    
    pool.destroy()
    
    expect(destroy1).toHaveBeenCalledTimes(1)
    expect(destroy2).toHaveBeenCalledTimes(1)
  })

  it("does not call factory after warmup", () => {
    const factory = vi.fn(() => new Container())
    const pool = new TextPool(factory)
    const root = new Container()
    
    // Warm up pool with a 5-character word
    pool.allocate(root, "A", 0)
    pool.allocate(root, "B", 1)
    pool.allocate(root, "C", 2)
    pool.allocate(root, "D", 3)
    pool.allocate(root, "E", 4)
    expect(factory).toHaveBeenCalledTimes(5)
    
    pool.freeAll()
    factory.mockClear()
    
    // Render another 5-character word
    pool.allocate(root, "H", 0)
    pool.allocate(root, "E", 1)
    pool.allocate(root, "L", 2)
    pool.allocate(root, "L", 3)
    pool.allocate(root, "O", 4)
    
    expect(factory).not.toHaveBeenCalled()
  })

  it("destroys owned objects exactly once", () => {
    const destroySpy = vi.fn()
    const createNode = vi.fn(() => ({ destroy: destroySpy } as unknown as Container))
    const pool = new SignalNodePool(createNode)
    
    pool.render("word", 0, false)
    pool.destroy()
    expect(destroySpy).toHaveBeenCalledTimes(4)
  })
})
