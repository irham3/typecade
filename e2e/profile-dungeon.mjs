import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import os from "node:os"
import { chromium, expect } from "@playwright/test"

const url=process.env.PROFILE_URL??"http://localhost:4173"
const seconds=Number(process.env.PROFILE_SECONDS??900)
assert(Number.isFinite(seconds)&&seconds>0&&seconds<=1800)
const output="test-results/dungeon-profile"
await mkdir(output,{recursive:true})
const browser=await chromium.launch({args:process.platform==="win32"?["--enable-gpu","--use-angle=d3d11"]:[]})
const page=await browser.newPage({viewport:{width:1440,height:900}})
page.setDefaultTimeout(15000)
const cdp=await page.context().newCDPSession(page)
const browserCdp=await browser.newBrowserCDPSession()
const gpu=await browserCdp.send("SystemInfo.getInfo")
const errors=[]
page.on("pageerror",error=>errors.push(error.message))
page.on("console",message=>{if(message.type()==="error")errors.push(message.text())})
const samples=[]
const intervals={}
const renderer=()=>page.getByTestId("dungeon-canvas")
const memory=async()=>{await cdp.send("HeapProfiler.collectGarbage");return (await cdp.send("Runtime.getHeapUsage")).usedSize}
const sample=async(label)=>{
 const state=await page.evaluate(()=>{
  const node=document.querySelector('[data-testid="dungeon-canvas"]')
  const saved=JSON.parse(localStorage.getItem("typecade:dungeon:run:v1")??"null")
  return {calls:Number(node.dataset.drawCalls),geometries:Number(node.dataset.geometries),textures:Number(node.dataset.textures),time:saved?.time??0,level:saved?.level??1,biome:saved?.biome??0,enemies:saved?.enemies.length??0,loot:saved?.loot.length??0,projectiles:saved?.projectiles.length??0,effects:saved?.effects.length??0,wpm:document.querySelector(".metric-values b")?.textContent}
 })
 assert(state.enemies<=128&&state.loot<=256&&state.projectiles<=64&&state.effects<=128)
 assert(state.calls<=120,`Draw budget: ${state.calls}`)
 const record={label,wall:Math.round((Date.now()-started)/1000),...state,heap:await memory()}
 samples.push(record);console.log(JSON.stringify(record))
}
const started=Date.now()
try{
 await page.addInitScript(()=>{
  window.profileFrames=[];window.profileRenderFrames=[];window.profileCollect=false
  let previous=performance.now(),frameNumber=0,lastFrame=-1,lastRender=0
  const frame=now=>{frameNumber++;if(window.profileCollect&&window.profileFrames.length<120000)window.profileFrames.push(now-previous);previous=now;requestAnimationFrame(frame)}
  requestAnimationFrame(frame)
  const clear=WebGL2RenderingContext.prototype.clear
  WebGL2RenderingContext.prototype.clear=function(...args){
   if(frameNumber!==lastFrame){
    lastFrame=frameNumber
    if(window.profileCollect&&!document.querySelector("dialog[open]")){const now=performance.now();if(lastRender&&window.profileRenderFrames.length<120000)window.profileRenderFrames.push(now-lastRender);lastRender=now}
    else lastRender=0
   }
   return clear.apply(this,args)
  }
 })
 await page.goto(url)
 await expect(renderer()).toHaveAttribute("data-renderer-state","ready")
 const gpuRenderer=await renderer().locator("canvas").evaluate(canvas=>{const gl=canvas.getContext("webgl2"),debug=gl.getExtension("WEBGL_debug_renderer_info");return debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)})
 const collect=()=>page.evaluate(()=>{window.profileFrames=[];window.profileRenderFrames=[];window.profileCollect=true})
 const finishFrames=async(label)=>{
  intervals[label]=await page.evaluate(()=>{window.profileCollect=false;const summary=values=>{values.sort((a,b)=>a-b);return {p50:values[Math.floor((values.length-1)*.5)],p95:values[Math.floor((values.length-1)*.95)],samples:values.length}};return {rafMs:summary(window.profileFrames),renderMs:summary(window.profileRenderFrames)}})
 }
 await page.getByRole("button",{name:"Enter the keep"}).click();await page.getByRole("button",{name:"Begin run"}).click()
 await collect()
 let active=0,lastClock=0,nextSample=30,deaths=0,lastCast=-30,emptySince=0,longestEmptyArenaMs=0
 const casts={heal:0,storm:0}
 while(active<seconds){
  assert(Date.now()-started<seconds*2000+120000,"Active simulation failed to make progress")
  const ui=await page.evaluate(()=>{
   const clock=document.querySelector(".hud-topline strong")?.textContent??"00:00"
   const [m,s]=clock.split(":").map(Number)
   const locked=document.querySelector(".enemy-label.locked"),target=locked??document.querySelector(".enemy-label")
   return {clock:m*60+s,upgrade:document.querySelector('[data-testid="upgrade-keyword"]')?.textContent,word:target?.getAttribute("data-word")?.slice(locked?.querySelector(".typed")?.textContent?.length??0),boss:[...document.querySelectorAll('.boss-passage .next,.boss-passage .ghost')].map(n=>n.textContent).join("").slice(0,8),hp:document.querySelectorAll('.hearts .filled').length,heal:document.querySelector('.skill-heal:not(.unavailable)')!==null,storm:document.querySelector('.skill-storm:not(.unavailable)')!==null,healWord:document.querySelector(".skill-heal strong")?.textContent,stormWord:document.querySelector(".skill-storm strong")?.textContent,labels:document.querySelectorAll('.enemy-label').length,dead:[...document.querySelectorAll("dialog button")].some(b=>b.textContent==="Try another run"),paused:[...document.querySelectorAll("dialog button")].some(b=>b.textContent==="Resume run")}
  })
  active+=Math.max(0,ui.clock-lastClock);lastClock=ui.clock
  if(!ui.labels&&!ui.boss&&!ui.upgrade&&!ui.dead&&!ui.paused){if(!emptySince)emptySince=Date.now();longestEmptyArenaMs=Math.max(longestEmptyArenaMs,Date.now()-emptySince)}else emptySince=0
  if(ui.dead){deaths++;await page.getByRole("button",{name:"Try another run"}).click();await page.getByRole("button",{name:"Begin run"}).click();lastClock=0;lastCast=-30}
  else if(ui.paused)await page.getByRole("button",{name:"Resume run"}).click()
  else if(ui.upgrade)await page.keyboard.type(ui.upgrade,{delay:65})
  else if(ui.boss)await page.keyboard.type(ui.boss,{delay:65})
  else if(ui.hp<=3&&ui.heal){await page.keyboard.press("Tab");await page.keyboard.type(ui.healWord,{delay:65});casts.heal++}
  else if(ui.labels>=6&&ui.storm&&ui.clock-lastCast>=20){await page.keyboard.press("Tab");await page.keyboard.type(ui.stormWord,{delay:65});lastCast=ui.clock;casts.storm++}
  else if(ui.word)await page.keyboard.type(ui.word,{delay:65})
  else await page.waitForTimeout(100)
  if(active>=nextSample){await sample("survival");nextSample+=30}
 }
 await finishFrames("survival")
 await page.screenshot({path:`${output}/survival.png`})
 await page.keyboard.press("Escape");await sample("survival-final")
 await page.getByRole("button",{name:"Save and return to title"}).click()
 const navigate=async()=>{await page.getByRole("button",{name:"Typing Dojo"}).click();await page.getByRole("button",{name:"Main menu",exact:true}).click();await page.getByRole("button",{name:"Multiplayer",exact:true}).click();await page.getByRole("button",{name:"Main menu",exact:true}).click()}
 console.log("Starting navigation profile");await navigate();await navigate();const before=await memory()
 for(let i=0;i<6;i++){await navigate();console.log(`Navigation ${i+1}/6`)}
 const after=await memory();assert(after-before<8*1024*1024,`Retained heap grew ${after-before}`)
 const capped=await page.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem("typecade:dungeon:run:v1"))
  s.phase="paused";s.resumePhase=s.afterDraft="arena";s.target=null;s.prefix=s.command=s.paragraph="";s.cursor=s.stagger=s.pendingDrafts=s.legendaryDrafts=0;s.offers=[];s.player.x=s.player.z=0;s.player.hp=s.player.maxHp;s.player.mana=100;s.player.invincible=60;s.nextId=1000;s.boss=128;s.skills.storm.cooldown=s.skills.cleave.cooldown=0;s.skills.storm.level=s.skills.cleave.level=1
  const kinds=["skeleton","goblin","guard","mage","minotaur","barrel","chest","bomber"],words=["slash","dash","BLOCK","hex_bolt!","CRUSH","IGNITE","OPEN","detonate-3"]
  s.enemies=Array.from({length:128},(_,i)=>({id:i+1,kind:i===127?"boss":kinds[i%8],x:Math.cos(i)*5,z:Math.sin(i)*5,words:i===127?["BREAK","CRUSH","ARMOR"]:[words[i%8],"ARMOR","BREAK"],speed:0,frozen:0,attack:20,health:i===127?260:3,maxHealth:i===127?260:3}))
  s.queue=[1,2,3,4,5,6]
  s.loot=Array.from({length:256},(_,i)=>({id:200+i,x:Math.cos(i)*4,z:Math.sin(i)*4,xp:1,gold:1,mana:0}))
  s.projectiles=Array.from({length:64},(_,i)=>({id:500+i,x:Math.cos(i)*3,z:Math.sin(i)*3,vx:0,vz:0,life:8}))
  s.effects=Array.from({length:128},(_,i)=>({id:600+i,kind:"shatter",x:Math.cos(i)*3,z:Math.sin(i)*3,life:8,value:1}))
  localStorage.setItem("typecade:dungeon:run:v1",JSON.stringify(s));return s
 })
 assert(capped.enemies.length===128)
 await page.reload();await expect(renderer()).toHaveAttribute("data-renderer-state","ready");await page.getByRole("button",{name:/Continue run/}).click();await page.getByRole("button",{name:"Resume run"}).click()
 await collect();await page.keyboard.press("Tab");await page.keyboard.type(capped.language==="id"?"BADAI":"STORM");await page.keyboard.press("Tab");await page.keyboard.type(capped.language==="id"?"SAPU":"CLEAVE");await page.screenshot({path:`${output}/crowded-burst.png`});await page.waitForTimeout(4000);await finishFrames("crowded-boss");await page.screenshot({path:`${output}/crowded-boss.png`});await page.keyboard.press("Escape");await sample("crowded-boss")
 await page.getByRole("button",{name:"Settings",exact:true}).click();await page.getByLabel("Reduced Effects",{exact:true}).check();await page.getByRole("button",{name:"Done",exact:true}).click();await page.getByRole("button",{name:"Resume run"}).click()
 await collect();await page.waitForTimeout(3000);await finishFrames("reduced");await page.keyboard.press("Escape");await sample("reduced")
 assert(errors.length===0,errors.join("\n"))
 const report={url,browser:browser.version(),hardware:{platform:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,cores:os.cpus().length,memoryGiB:Math.round(os.totalmem()/1024**3),gpuRenderer,gpu:gpu.gpu.devices},activeSeconds:active,wallSeconds:Math.round((Date.now()-started)/1000),deaths,casts,longestEmptyArenaMs,intervals,navigation:{cycles:6,before,after,retained:after-before},samples,errors}
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2))
 console.log(JSON.stringify({complete:true,activeSeconds:active,deaths,intervals,retainedHeap:after-before}))
}finally{await browser.close()}
