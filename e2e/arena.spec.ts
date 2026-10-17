import { expect, test, type Browser, type Page } from "@playwright/test"

async function party(browser:Browser,host:Page,mode:"sprint"|"clash"|"raid",seconds?:number,customText?:string) {
 await host.addInitScript(()=>{try{localStorage.setItem("typecade:dungeon:settings:v1",JSON.stringify({reduced:true,volume:0}))}catch{}});await host.goto("/");await host.getByRole("button",{name:"Multiplayer",exact:true}).click()
 await host.getByLabel("Multiplayer mode").selectOption(mode)
 await host.locator(".race-config").getByLabel("Your name").fill("Blue")
 await host.getByLabel("Language",{exact:true}).selectOption("en")
 await host.getByLabel("Text format",{exact:true}).selectOption(seconds?"time":"custom")
 if(seconds)await host.getByRole("spinbutton",{name:/^Seconds/}).fill(String(seconds))
 else await host.getByRole("textbox",{name:"Custom text",exact:true}).fill(customText??Array(100).fill("hit").join(" "))
 await host.getByRole("spinbutton",{name:/^Players/}).fill("4")
 await host.getByRole("button",{name:"Create room"}).click();await expect(host.getByText("Waiting at the gate")).toBeVisible()
 const code=new URL(host.url()).searchParams.get("race")!,contexts=[],pages=[host]
 for(const name of ["Red","Green","Gold"]){const context=await browser.newContext({viewport:{width:800,height:600}});await context.addInitScript(()=>{try{localStorage.setItem("typecade:dungeon:settings:v1",JSON.stringify({reduced:true,volume:0}))}catch{}});contexts.push(context);const page=await context.newPage();pages.push(page);await page.goto(`/?race=${code}`);await page.locator(".race-join").getByLabel("Your name").fill(name);await page.getByRole("button",{name:"Join room"}).click();await expect(page.getByText("Waiting at the gate")).toBeVisible()}
 for(const page of pages)await page.getByRole("button",{name:"I'm ready"}).click()
 await host.getByRole("button",{name:mode==="raid"?"Start raid":mode==="clash"?"Start clash":"Start race"}).click()
 await Promise.all(pages.map(page=>expect(page.getByTestId("race-play")).toBeVisible({timeout:15000})))
 await host.bringToFront()
 return {pages,close:async()=>{for(const context of contexts)await context.close()}}
}

test("four knights finish a real castle course, including a reloaded client",async({page,browser},info)=>{
 test.setTimeout(120000)
 const group=await party(browser,page,"sprint",undefined,"hit DODGE IGNITE")
 try{
  await group.pages[1]!.reload();await expect(group.pages[1]!.getByTestId("race-play")).toBeVisible()
  for(const peer of group.pages){await peer.bringToFront();await peer.getByLabel("Race typing input").pressSequentially("hit DODGE IGNITE",{delay:70})}
  await Promise.all(group.pages.map(peer=>expect(peer.locator(".race-results")).toContainText("Winner: Blue")))
  await page.screenshot({path:info.outputPath("castle-results.png")})
 }finally{await group.close()}
})

test("four independent browsers execute attacks, shields, skills and a synchronized PvP result",async({page,browser},info)=>{
 test.setTimeout(180000)

 const group=await party(browser,page,"clash",undefined,"BLOCK "+Array(100).fill("hit").join(" "))
 try{
  await expect(page.locator(".party-name")).toHaveCount(4)
  await page.getByLabel("Race typing input").focus();await page.keyboard.type("B",{delay:50});await page.keyboard.press("Tab");await page.keyboard.type("STORM",{delay:70})
  await expect(group.pages[1]!.getByLabel("Red health")).toHaveAttribute("value","80")
  await expect(page.getByTestId("race-passage").locator(".done")).toHaveText(["B"])
  await expect(page.locator(".party-skill-dock")).not.toHaveClass(/casting/);await page.getByLabel("Race typing input").pressSequentially("LOCK ",{delay:60})
  const rival=group.pages[1]!;await rival.bringToFront();await rival.getByLabel("Race typing input").pressSequentially("BLOCK ",{delay:60})
  await page.bringToFront();await page.getByLabel("Race typing input").pressSequentially("hit ",{delay:60})
  await expect(rival.getByLabel("Red health")).toHaveAttribute("value","80")
  await expect(page.locator(".battle-action-log")).toContainText("BLOCK")
  await page.getByLabel("Race typing input").pressSequentially("hit ",{delay:60});await expect(rival.getByLabel("Red health")).toHaveAttribute("value","76")
  await page.screenshot({path:info.outputPath("bridge-clash.png")})
  for(let i=0;i<30&&await page.getByTestId("race-play").isVisible();i++)await page.keyboard.type("hit ",{delay:50})
  await Promise.all(group.pages.map(peer=>expect(peer.locator(".race-results")).toContainText("Winner: Blue")))
 }finally{await group.close()}
})

test("four independent browsers play actual raid roles and defeat five boss layers",async({page,browser},info)=>{
 test.setTimeout(180000)
 const group=await party(browser,page,"raid")
 try{
  await expect(page.locator(".raid-boss-status")).toContainText("HP ×5")
  await expect(group.pages[2]!.locator(".battle-party")).toContainText("HEALER")
  await expect(group.pages[3]!.locator(".battle-party")).toContainText("TANK")
  const tank=group.pages[3]!,healer=group.pages[2]!
  await expect(page.getByLabel("Gold health")).not.toHaveAttribute("value","100",{timeout:12000})
  await healer.bringToFront();await healer.getByLabel("Race typing input").pressSequentially("hit ",{delay:60})
  await expect(page.locator(".battle-action-log")).toContainText("HEAL")
  await tank.bringToFront();await tank.getByLabel("Race typing input").pressSequentially("hit ",{delay:60})
  await healer.bringToFront();await healer.getByLabel("Race typing input").pressSequentially("hit ",{delay:60})
  await expect(page.locator(".battle-action-log")).toContainText("HEAL")
  await page.screenshot({path:info.outputPath("coop-raid.png")})
  for(let round=0;round<24&&await page.getByTestId("race-play").isVisible();round++)for(const [index,peer] of group.pages.entries()){
   if(!await peer.getByTestId("race-play").isVisible())break
   await peer.bringToFront();await peer.getByLabel("Race typing input").focus()
   if(index<2&&round%5===0){await peer.keyboard.press("Tab");await expect(peer.locator(".party-skill-dock")).toHaveClass(/casting/);await peer.keyboard.type("STORM",{delay:50});await expect(peer.locator(".party-skill-dock")).not.toHaveClass(/casting/)}
   if(await peer.getByTestId("race-play").isVisible())await peer.keyboard.type("hit ",{delay:50})
  }
  await Promise.all(group.pages.map(peer=>expect(peer.locator(".race-results")).toContainText("Party victory")))
 }finally{await group.close()}
})

test("a real four-player raid reaches its shared deadline and records a loss",async({page,browser})=>{
 const group=await party(browser,page,"raid",3)
 try{await Promise.all(group.pages.map(peer=>expect(peer.locator(".race-results")).toContainText("The keep held")))}finally{await group.close()}
})
