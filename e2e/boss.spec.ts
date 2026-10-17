import { expect,test } from "@playwright/test"
import { SurvivalRun } from "../packages/game-rules/src/survival"
test("boss retaliation preserves the complete line and banks drafts until its final letter",async({page},info)=>{
 const r=new SurvivalRun("boss-combo-e2e","id"),s=r.state;r.start();s.time=s.worldTime=301;s.nextBoss=600;s.spawnAt=100;s.enemies=[];s.queue=[]
 const boss=r.spawn("boss",{x:4,z:0})!;boss.words=[];boss.health=1;s.phase="overdrive";s.stagger=.3;s.paragraph="selesaikan baris ini BLIZZARD";s.pendingDrafts=1;s.player.invincible=0
 await page.addInitScript(raw=>{if(!sessionStorage.getItem("boss-seeded")){localStorage.setItem("typecade:dungeon:run:v1",raw);sessionStorage.setItem("boss-seeded","1")}},r.serialize())
 await page.goto("/");await page.getByRole("button",{name:/Continue run/}).click();await page.getByRole("button",{name:"Resume run"}).click()
 await page.keyboard.type("selesaikan ");await expect(page.getByTestId("boss-passage").locator(".done")).toHaveCount(11)
 await page.waitForTimeout(1100)
 await expect(page.getByTestId("upgrade-keyword")).toHaveCount(0);await expect(page.getByTestId("boss-passage")).toContainText("selesaikan baris ini BLIZZARD")
 await page.screenshot({path:info.outputPath("boss-counter.png")})
 await page.keyboard.type("baris ini BLIZZAR");await expect(page.getByLabel("Boss health")).toHaveAttribute("value","1");await expect(page.getByTestId("upgrade-keyword")).toHaveCount(0)
 await page.keyboard.type("D");await expect(page.getByTestId("upgrade-keyword")).toHaveCount(3);await expect(page.getByTestId("boss-passage")).toHaveCount(0)
 await page.screenshot({path:info.outputPath("boss-earned-draft.png")})
})

test("armor hits leave space and a recovery window before the next boss word",async({page},info)=>{
 const r=new SurvivalRun("boss-spacing-e2e","id"),s=r.state;r.start();s.time=s.worldTime=301;s.nextBoss=600;s.spawnAt=100;s.enemies=[];s.queue=[]
 const boss=r.spawn("boss",{x:4,z:0})!;boss.words=["ARMOR","BREAK"];boss.attack=0;s.player.invincible=0;r.refreshQueue()
 await page.addInitScript(raw=>localStorage.setItem("typecade:dungeon:run:v1",raw),r.serialize())
 await page.goto("/");await page.getByRole("button",{name:/Continue run/}).click();await page.getByRole("button",{name:"Resume run"}).click()
 await page.keyboard.type("ARMOR");await expect(page.getByTestId("enemy-label")).toContainText("BREAK")
 await page.keyboard.press("Escape")
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("typecade:dungeon:run:v1")!))
 expect(Math.hypot(saved.player.x-saved.enemies[0].x,saved.player.z-saved.enemies[0].z)).toBeGreaterThan(3)
 expect(saved.enemies[0].motion).toBe("recover");expect(saved.player.hp).toBe(6)
 await page.getByRole("button",{name:"Resume run"}).click();await page.waitForTimeout(800);await page.keyboard.press("Escape")
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("typecade:dungeon:run:v1")!).player.hp)).toBe(6)
 await page.getByRole("button",{name:"Resume run"}).click();await page.keyboard.type("BREAK");await expect(page.getByTestId("boss-passage")).toBeVisible()
 await page.screenshot({path:info.outputPath("boss-safe-spacing.png")})
})

test("a moving boss reacts to typing while a real barricade takes the horde's attacks",async({page},info)=>{
 test.setTimeout(60000)
 const r=new SurvivalRun("active-duel-e2e","id"),s=r.state;r.start();s.time=s.worldTime=301;s.nextBoss=600;s.spawnAt=100;s.enemies=[];s.queue=[];s.player.invincible=100
 const boss=r.spawn("boss",{x:4,z:0})!;boss.words=["ARMOR"];boss.health=1;r.refreshQueue()
 await page.addInitScript(raw=>{if(!sessionStorage.getItem("duel-seed")){localStorage.setItem("typecade:dungeon:run:v1",raw);sessionStorage.setItem("duel-seed","1")}},r.serialize())
 await page.goto("/");await page.getByRole("button",{name:/Continue run/}).click();await page.getByRole("button",{name:"Resume run"}).click();await page.keyboard.type("ARMOR");await expect(page.getByLabel("Barricade health")).toBeVisible()
 const read=async()=>{await page.keyboard.press("Escape");const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("typecade:dungeon:run:v1")!));await page.getByRole("button",{name:"Resume run"}).click();return state}
 const before=await read(),enemy=before.enemies.find((e:{id:number})=>e.id===before.boss),first=before.paragraph.slice(0,4)
 await page.keyboard.type(first);const hit=await read(),after=hit.enemies.find((e:{id:number})=>e.id===hit.boss)
 expect(Math.hypot(after.x-hit.player.x,after.z-hit.player.z)).toBeGreaterThan(Math.hypot(enemy.x-before.player.x,enemy.z-before.player.z))
 await page.keyboard.type("?");await expect(page.locator(".boss-hud")).toContainText("BOSS RUSH");await page.waitForTimeout(500)
 const rushed=await read();expect(rushed.bossArena.rage).toBeGreaterThan(0);expect(rushed.cursor).toBe(4)
 await page.screenshot({path:info.outputPath("living-boss-barricade.png")})
 await expect(page.getByLabel("Barricade health")).toHaveAttribute("value","0",{timeout:30000});await expect(page.getByTestId("boss-passage")).toBeVisible();await expect(page.getByTestId("upgrade-keyword")).toHaveCount(0)
 await page.screenshot({path:info.outputPath("boss-barricade-breached.png")})
 const last=await read();await page.keyboard.type(last.paragraph.slice(last.cursor));await expect(page.getByTestId("upgrade-keyword")).toHaveCount(3)
})
