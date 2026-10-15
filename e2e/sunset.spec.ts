import { expect, test } from "@playwright/test"

for (const [name,width,height] of [["desktop",1366,768],["phone",390,844],["small-phone",320,640],["landscape",800,360]] as const) {
 test(`sunset fishing target selection and readable labels on ${name}`,async({page},info)=>{
  await page.setViewportSize({width,height});const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text())})
  await page.goto("/");await expect(page.getByTestId("three-gameplay")).toHaveAttribute("data-renderer-state","ready")
  if(name==="desktop") await page.screenshot({path:info.outputPath("sunset-menu.png")})
  await page.getByRole("button",{name:"Adventure",exact:true}).click();await page.getByRole("button",{name:"Set Sail",exact:true}).click()
  const labels=page.getByTestId("shoal-picker").locator("button");await expect(labels).toHaveCount(3)
  for(let i=0;i<3;i++)await expect(labels.nth(i)).toBeInViewport({ratio:1})
  const rects=await labels.evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}))
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)expect(Math.max(0,Math.min(rects[i]!.right,rects[j]!.right)-Math.max(rects[i]!.x,rects[j]!.x))*Math.max(0,Math.min(rects[i]!.bottom,rects[j]!.bottom)-Math.max(rects[i]!.y,rects[j]!.y))).toBe(0)
  await labels.nth(1).click();await expect(page.getByLabel("Adventure typing input")).toBeFocused();await expect(labels.nth(1)).toHaveAttribute("aria-pressed","true")
  await page.getByLabel("Adventure text format").selectOption("word");await expect(page.getByLabel("Adventure typing input")).toBeFocused()
  const passage=page.getByTestId("typing-target");const word=await passage.textContent();expect(word!.trim().split(/\s+/)).toHaveLength(1)
  await page.getByLabel("Adventure typing input").pressSequentially(word![0]!);await expect(labels.nth(0)).toBeDisabled();await expect(page.getByLabel("Adventure text format")).toBeDisabled()
  await page.screenshot({path:info.outputPath(`sunset-adventure-${name}.png`)})
  await page.getByLabel("Adventure typing input").pressSequentially(word!.slice(1));await expect(page.getByTestId("result-toast")).toContainText("Catch secured")
  await expect(page.getByTestId("result-toast")).toHaveCount(0,{timeout:5000})
  await page.getByLabel("Adventure text format").selectOption("sentence");const sentence=await passage.textContent();expect(sentence!.split(/\s+/).length).toBeGreaterThan(1)
  await page.getByLabel("Adventure text format").selectOption("passage");expect((await passage.textContent())!.length).toBeGreaterThanOrEqual(sentence!.length)
  expect(errors).toEqual([])
 })
}

test("releases Adventure resources across repeated navigation",async({page,browserName},info)=>{
 test.skip(browserName!=="chromium","Heap measurement uses Chromium CDP")
 await page.goto('/');await page.getByRole('button',{name:'Adventure',exact:true}).click();await page.getByRole('button',{name:'Set Sail',exact:true}).click()
 await expect(page.getByTestId('three-gameplay')).toHaveAttribute('data-renderer-state','ready')
 const cdp=await page.context().newCDPSession(page);await cdp.send('HeapProfiler.collectGarbage');const before=(await cdp.send('Runtime.getHeapUsage')).usedSize
 for(let i=0;i<6;i++) {
  await page.getByRole('button',{name:'Pause game',exact:true}).click();await page.getByTestId('pause-panel').getByRole('button',{name:'Main menu',exact:true}).click();await page.getByRole('button',{name:'Practice',exact:true}).click();await expect(page.getByTestId('three-gameplay').locator('canvas')).toHaveCount(0)
  await page.getByRole('button',{name:'Main menu',exact:true}).click();await page.getByRole('button',{name:'Adventure',exact:true}).click();await page.getByRole('button',{name:'Set Sail',exact:true}).click();await expect(page.getByTestId('three-gameplay').locator('canvas')).toHaveCount(1);await expect(page.getByTestId('three-gameplay')).toHaveAttribute('data-renderer-state','ready')
 }
 await cdp.send('HeapProfiler.collectGarbage');const after=(await cdp.send('Runtime.getHeapUsage')).usedSize
 await info.attach('heap-after-navigation.json',{body:JSON.stringify({before,after,delta:after-before,navigationCycles:6}),contentType:'application/json'})
 expect(after-before).toBeLessThan(8*1024*1024)
 const buffer=await page.getByTestId('three-gameplay').locator('canvas').evaluate((canvas:HTMLCanvasElement)=>({width:canvas.width,height:canvas.height}));expect(buffer.width).toBeLessThanOrEqual(640);expect(buffer.height).toBeLessThanOrEqual(480)
})
