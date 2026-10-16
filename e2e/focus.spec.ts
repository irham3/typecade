import { expect,test } from "@playwright/test"

test("background clicks preserve combat typing while menus keep normal focus",async({page})=>{
 await page.goto("/");await page.getByRole("button",{name:"Enter the keep"}).click();await page.getByRole("button",{name:"Begin run"}).click()
 const input=page.getByTestId("dungeon-input")
 await page.mouse.click(10,300);await expect(input).toBeFocused()
 const word=(await page.getByTestId("enemy-label").first().getAttribute("data-word"))!
 await page.keyboard.type(word[0]!);await expect(page.locator(".enemy-label.locked .typed")).toHaveText(word[0]!)
 await page.keyboard.press("Escape");await page.getByRole("button",{name:"Settings",exact:true}).click();await page.getByLabel("Reduced Effects",{exact:true}).focus();await expect(page.getByLabel("Reduced Effects",{exact:true})).toBeFocused()
 await page.getByRole("button",{name:"Done",exact:true}).click();await page.getByRole("button",{name:"Save and return to title"}).click()
 await page.getByRole("button",{name:"Multiplayer",exact:true}).click();await page.locator(".race-config").getByLabel("Your name").fill("Focus Host");await page.getByRole("spinbutton",{name:/^Players/}).fill("2");await page.getByRole("button",{name:"Create room"}).click()
 await expect(page.getByText("Waiting at the gate")).toBeVisible()
 const code=new URL(page.url()).searchParams.get("race")!
 const response=await page.request.post(`/api/rooms/${code}/join`,{data:{name:"Socket Peer"}});expect(response.ok()).toBe(true)
 const peer=await response.json() as {playerId:string;token:string}
 const socket=new WebSocket(`${new URL(page.url()).origin.replace(/^http/,"ws")}/api/rooms/${code}/ws?playerId=${peer.playerId}`,["race-v1",`token.${peer.token}`])
 try{
  await new Promise<void>((resolve,reject)=>{socket.onopen=()=>{socket.send(JSON.stringify({type:"ready",ready:true}));resolve()};socket.onerror=()=>reject(new Error("Peer could not connect"))})
  await page.getByRole("button",{name:"I'm ready"}).click();await page.getByRole("button",{name:"Start race",exact:true}).click();await expect(page.getByTestId("race-play")).toBeVisible()
  await page.mouse.click(10,300);await expect(page.getByLabel("Race typing input")).toBeFocused()
  const char=(await page.getByTestId("race-passage").locator(".next").textContent())!
  await page.keyboard.type(char);await expect(page.getByTestId("race-passage").locator(".done")).toHaveText([char])
 }finally{socket.close()}
})
