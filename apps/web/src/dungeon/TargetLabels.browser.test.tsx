import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect,it,vi } from "vitest"
import { SurvivalRun } from "@typecade/game-rules"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { TargetLabels } from "./TargetLabels"
import { PartyLabels } from "./PartyLabels"
import "../styles.css"

it("packs projected words without overlap at desktop, portrait and small landscape sizes",async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const host=document.createElement("div");host.style.cssText="position:relative;width:1440px;height:900px";document.body.append(host)
 const root=createRoot(host),run=new SurvivalRun("labels","en"),s=run.state,bridge=new GameEventBridge()
 const intersects=(a:DOMRect,b:DOMRect)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top
 try{
  await act(()=>root.render(<TargetLabels view={s} bridge={bridge}/>))
  expect(host.querySelectorAll(".enemy-label")).toHaveLength(0)
  for(const [width,height] of [[1440,900],[320,640],[594,400],[594,320]]){
   host.style.width=`${width}px`;host.style.height=`${height}px`;run.setLabelLimit(width<700?4:6)
   await act(async()=>{root.render(<TargetLabels view={{...s}} bridge={bridge}/>);bridge.emit("projected",s.queue.map(id=>({id,x:width/2,y:height/2,visible:true})));await new Promise(resolve=>setTimeout(resolve,50))})
   await vi.waitFor(()=>{
    const labels=[...host.querySelectorAll<HTMLElement>(".enemy-label")]
    expect(labels).toHaveLength(s.queue.length)
    const boxes=labels.map(label=>label.getBoundingClientRect()),bounds=host.getBoundingClientRect()
    for(const [i,box] of boxes.entries()){expect(box.left).toBeGreaterThanOrEqual(bounds.left);expect(box.right).toBeLessThanOrEqual(bounds.right);expect(box.bottom).toBeLessThanOrEqual(bounds.bottom);expect(boxes.slice(i+1).some(other=>intersects(box,other))).toBe(false)}
   },{timeout:2000})
  }
  s.target=s.enemies[0]!.id;s.prefix=s.enemies[0]!.words[0]!.slice(0,1);await act(()=>root.render(<TargetLabels view={{...s}} bridge={bridge}/>));expect(host.textContent).toContain("LOCKED")
  s.enemies=[];for(const [i,kind] of (["boss","bomber","barrel","chest","guard","mage"] as const).entries())run.spawn(kind,{x:i,z:0});s.target=s.enemies[0]!.id;s.prefix=s.enemies[0]!.words[0]!.slice(0,1);run.refreshQueue()
  await act(()=>{root.render(<TargetLabels view={{...s,queue:[...s.queue,999]}} bridge={bridge}/>);bridge.emit("projected",s.queue.map(id=>({id,x:500,y:10,visible:false})))})
  expect(host.querySelector(".locked .typed")?.textContent).toBe(s.prefix)
  host.style.cssText="position:relative;width:120px;height:120px"
  await act(async()=>{root.render(<TargetLabels view={{...s,target:null}} bridge={bridge}/>);bridge.emit("projected",s.queue.map(id=>({id,x:100,y:100,visible:true})));await new Promise(resolve=>setTimeout(resolve,50))})
  Object.defineProperty(window,"innerWidth",{value:1000,configurable:true});await act(()=>root.render(<PartyLabels bridge={bridge}/>));await act(()=>bridge.emit("partyProjected",[{id:"own",name:"Blue",hp:100,color:0x123,role:"dps",x:50,y:50},{id:"peer",name:"Red",hp:0,color:0xe2886b,role:"tank",x:100,y:100}]))
  expect(host.querySelectorAll(".party-name")).toHaveLength(2);expect(host.textContent).toContain("DOWNED")
  const width=window.innerWidth;Object.defineProperty(window,"innerWidth",{value:390,configurable:true});await act(()=>bridge.emit("partyProjected",[{id:"a",name:"Blue",hp:1,color:0x123,role:"dps",x:50,y:50},{id:"b",name:"Red",hp:1,color:0x456,role:"tank",x:50,y:50}]))
  const names=[...host.querySelectorAll<HTMLElement>(".party-name")];expect(names[0]!.style.top).not.toBe(names[1]!.style.top);Object.defineProperty(window,"innerWidth",{value:width,configurable:true})
 }finally{await act(()=>root.unmount());host.remove();bridge.clear()}
})

it("names each supply benefit and makes flying, casting and charge warnings distinct",async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement("div");host.style.cssText="position:relative;width:1440px;height:900px";document.body.append(host)
 const root=createRoot(host),r=new SurvivalRun("item-labels"),s=r.state,bridge=new GameEventBridge()
 try{
  await act(()=>root.render(<TargetLabels view={s} bridge={bridge}/>))
  s.notice="Aegis Shield acquired. +2 shield"
  for(const kind of ["shield","potion","mana","sentry","bat","mage","minotaur"] as const){
   s.enemies=[];s.queue=[];const e=r.spawn(kind,{x:0,z:2})!;s.queue=[e.id];if(kind==="mage")e.attack=.5;if(kind==="minotaur"){e.motion="windup";e.motionTime=1}
   await act(()=>{root.render(<TargetLabels view={{...s}} bridge={bridge}/>);bridge.emit("projected",[{id:e.id,x:500,y:130,visible:true}])})
   expect(host.querySelector(".enemy-label")?.textContent).toMatch(kind==="shield"?/SHIELD/:kind==="potion"?/HP/:kind==="mana"?/MP/:kind==="sentry"?/SENTRY/:kind==="minotaur"?/CHARGE/:/AIR/)
   expect(parseInt(host.querySelector<HTMLElement>(".enemy-label")!.style.top)).toBeGreaterThanOrEqual(212)
   if(kind==="shield"){host.style.height="390px";await act(async()=>{root.render(<TargetLabels view={{...s}} bridge={bridge}/>);await new Promise(resolve=>setTimeout(resolve,30))});expect(parseInt(host.querySelector<HTMLElement>(".enemy-label")!.style.top)).toBeGreaterThanOrEqual(166);host.style.height="900px";await act(async()=>{await new Promise(resolve=>setTimeout(resolve,30))})}
   if(kind==="mage"){e.attack=2;await act(()=>root.render(<TargetLabels view={{...s}} bridge={bridge}/>));expect(host.textContent).toContain("MAGE")}
  }
 }finally{await act(()=>root.unmount());host.remove();bridge.clear()}
})

it("announces each new foe's behaviour and counts down casters' next shot, ward or summon",async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement("div");host.style.cssText="position:relative;width:1440px;height:900px";document.body.append(host)
 const root=createRoot(host),r=new SurvivalRun("bestiary-labels","en"),s=r.state,bridge=new GameEventBridge()
 try{
  await act(()=>root.render(<TargetLabels view={s} bridge={bridge}/>))
  for(const [kind,attack,expected] of [["wolf",3,/FAST · DIRE WOLF/],["archer",.5,/RANGED · SHOT 0\.5s/],["archer",2,/RANGED · BONE ARCHER/],["imp",.4,/HIT & RUN · SHOT/],["shaman",.6,/SUPPORT · WARD 0\.6s/],["necromancer",-1,/SUMMONER · SUMMON 0\.0s/]] as const){
   s.enemies=[];s.queue=[];const e=r.spawn(kind,{x:0,z:2})!;e.attack=attack;s.queue=[e.id]
   await act(()=>{root.render(<TargetLabels view={{...s}} bridge={bridge}/>);bridge.emit("projected",[{id:e.id,x:500,y:300,visible:true}])})
   expect(host.querySelector(".enemy-label")?.textContent).toMatch(expected)
  }
 }finally{await act(()=>root.unmount());host.remove();bridge.clear()}
})
