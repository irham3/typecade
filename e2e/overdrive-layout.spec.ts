import { test, expect } from "@playwright/test"

for (const viewport of [
  { name:"desktop", width:1440, height:900 },
  { name:"laptop", width:1366, height:768 },
  { name:"tablet", width:820, height:1180 },
  { name:"mobile", width:390, height:844 },
]) {
  test(`Pixi layout fills ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({width:viewport.width,height:viewport.height})
    await page.goto("/overdrive")
    await page.getByRole("button",{name:"Play"}).click()
    const root=page.locator("[data-overdrive-root]")
    const game=page.locator("[data-overdrive-game]")
    const host=page.locator("[data-pixi-host]")
    const canvas=host.locator("canvas")
    await expect(canvas).toHaveCount(1)
    await expect(root).toHaveCSS("overflow","hidden")
    const boxes=await Promise.all([root.boundingBox(),game.boundingBox(),host.boundingBox(),canvas.boundingBox()])
    const [rootBox,gameBox,hostBox,canvasBox]=boxes
    expect(rootBox?.width).toBeGreaterThanOrEqual(viewport.width-1)
    expect(gameBox?.width).toBeGreaterThanOrEqual(viewport.width-1)
    expect(hostBox?.width).toBeGreaterThan(viewport.width<768?340:480)
    expect(hostBox?.height).toBeGreaterThanOrEqual(viewport.width<768?320:360)
    expect(Math.abs((canvasBox?.width??0)-(hostBox?.width??0))).toBeLessThanOrEqual(1)
    expect(Math.abs((canvasBox?.height??0)-(hostBox?.height??0))).toBeLessThanOrEqual(1)
    const overflow=await page.evaluate(()=>({x:document.documentElement.scrollWidth-innerWidth,y:document.documentElement.scrollHeight-innerHeight}))
    expect(overflow.x).toBeLessThanOrEqual(1)
    expect(overflow.y).toBeLessThanOrEqual(1)
    await page.screenshot({path:`test-results/overdrive-${viewport.name}.png`,fullPage:true})
  })
}
