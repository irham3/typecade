import { afterEach, describe, expect, it } from "vitest"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { FishArtwork, PixelIcon } from "./PixelArt"
let root:Root;let host:HTMLDivElement
afterEach(async()=>{await act(()=>root.unmount());host.remove()})
describe("sunset pixel artwork",()=>{
 it("names standalone fish artwork and handles an unknown glyph without a broken asset",async()=>{
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(()=>root.render(<><FishArtwork assetKey="missing" alt="Fish specimen"/><PixelIcon file="unknown"/></>));expect(host.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Fish specimen');expect(host.querySelectorAll('svg')).toHaveLength(2);expect(host.querySelector('img')).toBeNull()
 })
})
