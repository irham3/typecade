import {expect,it,vi} from "vitest"
import { renderPortraits } from "./portraits"

it("falls back to glyphs and releases the portrait renderer when image export fails",async()=>{
 const exportImage=vi.spyOn(HTMLCanvasElement.prototype,"toDataURL").mockImplementationOnce(()=>{throw new Error("Canvas unavailable")})
 try{expect(await renderPortraits(["skeleton"])).toEqual({})}finally{exportImage.mockRestore()}
})
