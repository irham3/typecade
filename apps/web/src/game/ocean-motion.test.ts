import { describe, expect, it } from "vitest"
import { shoalLayout, waveHeight } from "./ocean-motion"
describe("isometric coast framing", () => {
 it("separates all three target anchors on desktop and small screens", () => {
  for (const [w,h] of [[1366,768],[390,844],[320,640],[800,360],[667,375]]) {
   const slots=shoalLayout(w,h)
   expect(slots).toHaveLength(3)
   for (const a of slots) { expect(a.x*w).toBeGreaterThan(40); expect(a.y*h).toBeGreaterThan(90) }
   for (let i=0;i<3;i++) for(let j=i+1;j<3;j++) expect(Math.hypot((slots[i]!.x-slots[j]!.x)*w,(slots[i]!.y-slots[j]!.y)*h)).toBeGreaterThan(40)
  }
 })
 it("keeps hull bob bounded", () => { for(let t=0;t<20;t+=.1) expect(Math.abs(waveHeight(2,3,t))).toBeLessThanOrEqual(.1) })
})
