import { expect,test } from "@playwright/test"

test("the optional combat tutorial teaches real actions, keeps keyboard focus and can be skipped",async({page},info)=>{
 await page.setViewportSize({width:1440,height:900});await page.goto("/")
 await page.getByRole("button",{name:/^Combat tutorial/}).click()
 const panel=page.getByRole("region",{name:"Combat tutorial"}),input=page.getByTestId("dungeon-input")
 await expect(panel).toContainText("Your word is your movement");await page.screenshot({path:info.outputPath("tutorial-strike.png")})
 await page.keyboard.type("cut");await expect(panel).toContainText("Enemy defeated.");await page.getByRole("button",{name:"Next lesson · Enter"}).click();await expect(input).toBeFocused()
 await page.keyboard.type("GuardBreak");await expect(panel).toContainText("Shield broken");await page.keyboard.press("Enter")
 await expect(page.locator(".object-label.kind-chest")).toContainText("LOOT");await page.keyboard.type("OPEN");await page.keyboard.press("Enter")
 await expect(page.locator(".object-label.kind-barrel")).toContainText("OBJECT");await page.keyboard.type("IGNITE");await page.keyboard.press("Enter")
 await expect(page.locator(".hearts")).toHaveAttribute("aria-label","4 of 6 hearts");await expect(page.locator(".damage-response")).toContainText("-2 HP");await page.screenshot({path:info.outputPath("tutorial-hurt.png")})
 await page.keyboard.press("Tab");await page.keyboard.type("HEAL");await expect(panel).toContainText("Two hearts restored");await page.keyboard.press("Enter")
 await page.keyboard.press("Tab");await page.keyboard.type("STORM");await expect(panel).toContainText("storm removed one layer");await page.keyboard.press("Enter")
 await expect(page.getByTestId("upgrade-keyword")).toHaveCount(3);await page.screenshot({path:info.outputPath("tutorial-draft.png")})
 await page.keyboard.type((await page.getByTestId("upgrade-keyword").first().textContent())!);await expect(panel).toContainText("Upgrade applied");await expect(page.locator(".upgrade-acquired")).toContainText("UPGRADE ACTIVE");await page.screenshot({path:info.outputPath("tutorial-upgrade.png")})
 await page.getByRole("button",{name:"Finish tutorial"}).click();await page.getByRole("button",{name:/^Combat tutorial/}).click()
 await expect(panel).toContainText("1/7");await page.keyboard.press("Shift+Tab");await expect(page.getByRole("button",{name:"Skip tutorial"})).toBeFocused();await page.keyboard.press("Enter")
 await expect(page.getByRole("button",{name:"Enter the keep"})).toBeVisible()
})

test("tutorial controls and labels remain readable in portrait and landscape",async({page},info)=>{
 for(const [width,height]of [[390,844],[844,390]]){
  await page.setViewportSize({width,height});await page.goto("/");await page.getByRole("button",{name:/^Combat tutorial/}).click()
  await expect(page.getByRole("button",{name:"Skip tutorial"})).toBeInViewport();await expect(page.getByTestId("enemy-label")).toHaveCount(1)
  await page.screenshot({path:info.outputPath(`tutorial-${width}.png`)})
  await page.getByRole("button",{name:"Skip tutorial"}).click();await page.getByRole("button",{name:"Typing Dojo"}).click();await expect(page.getByRole("button",{name:"Combat tutorial",exact:true})).toBeInViewport()
 }
})
