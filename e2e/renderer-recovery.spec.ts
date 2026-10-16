import { expect, test } from "@playwright/test"
test("recovers the dungeon context and retains the locked prefix",async({page})=>{
 await page.goto("/");const renderer=page.getByTestId("dungeon-canvas");await expect(renderer).toHaveAttribute("data-renderer-state","ready")
 await page.getByRole("button",{name:"Enter the keep"}).click();await page.getByRole("button",{name:"Begin run"}).click()
 const word=(await page.getByTestId("enemy-label").first().getAttribute("data-word"))!
 await page.keyboard.type(word[0]!);await expect(page.locator(".enemy-label.locked .typed")).toHaveText(word[0]!)
 await renderer.locator("canvas").evaluate((canvas:HTMLCanvasElement)=>canvas.getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext())
 await expect(renderer).toHaveAttribute("data-renderer-state","lost");await expect(page.getByRole("button",{name:"Restore scene"})).toBeVisible()
 const time=await page.locator(".hud-topline strong").textContent();await page.waitForTimeout(1100);await expect(page.locator(".hud-topline strong")).toHaveText(time!)
 await page.getByRole("button",{name:"Restore scene"}).click();await expect(renderer).toHaveAttribute("data-renderer-state","ready");await expect(renderer.locator("canvas")).toHaveCount(1)
 await page.getByRole("button",{name:"Resume run"}).click();await expect(page.locator(".enemy-label.locked .typed")).toHaveText(word[0]!)
 await page.keyboard.type(word.slice(1));await expect(page.locator(".health-row strong")).not.toHaveText("0g")
})
