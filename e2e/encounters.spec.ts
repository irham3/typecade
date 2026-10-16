import {expect,test} from "@playwright/test"
import {SurvivalRun} from "../packages/game-rules/src/survival"

test("typed supplies equip shield and a real sentry beside distinct flying and ranged enemies",async({page},info)=>{
 const r=new SurvivalRun("supplies-e2e"),s=r.state;r.start();s.time=s.worldTime=180;s.nextBoss=s.spawnAt=3600;s.player.invincible=100;s.player.hp=3;s.player.mana=10;s.enemies=[];s.queue=[]
 for(const [kind,x,z]of [["shield",1,0],["potion",3,0],["mana",5,0],["sentry",2,3],["bat",4,-2],["mage",-4,0]] as const){const e=r.spawn(kind,{x,z})!;if(e.speed)e.frozen=100}
 r.refreshQueue();await page.addInitScript(raw=>localStorage.setItem("typecade:dungeon:run:v1",raw),r.serialize());await page.setViewportSize({width:1440,height:900});await page.goto("/")
 await page.getByRole("button",{name:/Continue run/}).click();await page.getByRole("button",{name:"Resume run"}).click()
 await expect(page.locator(".kind-bat")).toContainText("AIR");await expect(page.locator(".kind-mage")).toContainText("AIR")
 for(const kind of ["shield","potion","mana","sentry"]){
  const target=page.locator(`.enemy-label.kind-${kind}`);await expect(target).toBeVisible();await page.keyboard.type((await target.getAttribute("data-word"))!,{delay:35})
  await expect(page.locator(`.equipment-badge.item-${kind}`)).toBeVisible()
 }
 await expect(page.getByLabel("Shield",{exact:true})).toHaveAttribute("value","2");await expect(page.locator(".item-sentry")).toContainText("ACTIVE")
 await expect(page.locator(".item-potion")).toContainText("USED");await page.keyboard.press("Escape");await page.screenshot({path:info.outputPath("equipped-supplies.png")})
 await page.getByRole("button",{name:"Resume run"}).click();await page.keyboard.press("Escape");await page.getByRole("button",{name:"Save and return to title"}).click();await page.reload();await page.getByRole("button",{name:/Continue run/}).click();await page.getByRole("button",{name:"Resume run"}).click();await expect(page.locator(".item-shield")).toContainText("2/4")
})
