import { expect, test } from "@playwright/test"
import { SurvivalRun } from "../packages/game-rules/src/survival"

test("successive dashes keep varied reachable words available without an unexplained wait",async({page})=>{
 const run=new SurvivalRun("flow-e2e");run.start();run.state.time=run.state.worldTime=1
 await page.addInitScript(raw=>localStorage.setItem("typecade:dungeon:run:v1",raw),run.serialize())
 await page.goto("/");await page.getByRole("button",{name:/Continue run/}).click();await page.getByRole("button",{name:"Resume run"}).click()
 const words:string[]=[]
 for(let i=0;i<20;i++){
  const draft=page.getByTestId("upgrade-keyword").first()
  if(await draft.isVisible())await page.keyboard.type((await draft.textContent())!)
  await expect.poll(()=>page.getByTestId("enemy-label").count(),{timeout:3000}).toBeGreaterThan(0)
  const word=(await page.getByTestId("enemy-label").first().getAttribute("data-word"))!
  words.push(word);await page.keyboard.type(word,{delay:20})
 }
 expect(new Set(words).size).toBeGreaterThan(12)
 await expect(page.getByRole("button",{name:"Try another run"})).toHaveCount(0)
})

test("the dungeon shell, Dojo and combat remain usable across small viewports",async({page},info)=>{
 for(const [width,height] of [[320,640],[844,390],[768,1024]]){
  await page.setViewportSize({width,height});await page.goto("/")
  await expect(page.getByTestId("dungeon-canvas")).toHaveAttribute("data-renderer-state","ready")
  await expect(page.getByRole("button",{name:"Enter the keep"})).toBeInViewport()
  await page.screenshot({path:info.outputPath(`title-${width}.png`)})
  await page.getByRole("button",{name:"Typing Dojo"}).click();await expect(page.getByTestId("practice-screen")).toBeVisible()
  await page.screenshot({path:info.outputPath(`dojo-${width}.png`)})
  await page.goto("/");await page.getByRole("button",{name:"Enter the keep"}).click();await page.getByRole("button",{name:"Begin run"}).click()
  await expect(page.getByTestId("enemy-label")).toHaveCount(width<700?4:6)
  const labels=await page.getByTestId("enemy-label").evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}}))
  for(const [i,b] of labels.entries()){expect(b.left).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width);expect(b.bottom).toBeLessThanOrEqual(height);for(const a of labels.slice(i+1))expect(b.left<a.right&&b.right>a.left&&b.top<a.bottom&&b.bottom>a.top).toBe(false)}
  await page.screenshot({path:info.outputPath(`combat-${width}.png`)})
 }
})

test("a real dungeon run supports typing, dash, skill interruption, draft and paused resume",async({page},info)=>{
 await page.setViewportSize({width:1440,height:900})
 await page.goto('/')
 await expect(page.getByTestId('dungeon-canvas')).toHaveAttribute('data-renderer-state','ready')
 await expect(page.getByRole('heading',{name:'Every word. A fighting chance.'})).toBeVisible()
 await page.screenshot({path:info.outputPath('dungeon-title.png')})
 await page.getByRole('button',{name:'Enter the keep'}).click()
 await expect(page.getByRole('button',{name:'Begin run'})).toBeFocused()
 await page.keyboard.press('Enter')
 const input=page.getByTestId('dungeon-input')
 await expect(input).toBeFocused()
 await expect(page.getByTestId('enemy-label')).toHaveCount(6)
 const target=page.getByTestId('enemy-label').first(), word=(await target.getAttribute('data-word'))!
 await page.keyboard.type(word[0]!)
 await expect(page.locator('.enemy-label.locked')).toContainText(word)
 await page.keyboard.press('Tab')
 await expect(page.locator('.skill-dock')).toHaveClass(/casting/)
 await page.keyboard.type('CLEAVE')
 await expect(page.locator('.skill-dock')).not.toHaveClass(/casting/)
 await expect(page.locator('.enemy-label.locked .typed')).toHaveText(word[0]!)
 await page.keyboard.type(word.slice(1))
 await expect(page.locator('.health-row strong')).not.toHaveText('0g')
 await page.screenshot({path:info.outputPath('dungeon-combat.png')})
 for(let i=0;i<10;i++){
  const draft=page.getByRole('dialog').filter({has:page.getByTestId('upgrade-keyword')})
  if(await draft.isVisible())break
  const next=await page.getByTestId('enemy-label').first().getAttribute('data-word')
  if(next)await page.keyboard.type(next)
 }
 await expect(page.getByTestId('upgrade-keyword').first()).toBeVisible()
 const upgrade=(await page.getByTestId('upgrade-keyword').first().textContent())!
 await page.keyboard.type(upgrade)
 await expect(page.getByTestId('upgrade-keyword')).toHaveCount(0)
 await page.keyboard.press('Escape')
 await expect(page.getByRole('button',{name:'Resume run'})).toBeFocused()
 await page.getByRole('button',{name:'Save and return to title'}).click()
 await page.reload()
 await page.getByRole('button',{name:/Continue run/}).click()
 await expect(page.getByRole('button',{name:'Resume run'})).toBeVisible()
 await page.getByRole('button',{name:'Resume run'}).click()
 await expect(page.getByTestId('dungeon-input')).toBeFocused()
})
