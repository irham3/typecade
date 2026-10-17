import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect,it,vi } from "vitest"
import { bestiary } from "@typecade/content"
import { Bestiary } from "./Bestiary"

const portraits=vi.hoisted(()=>({render:vi.fn()}))
vi.mock("../game/portraits",()=>({renderPortraits:portraits.render}))

it("filters every enemy role, shows portraits and preserves the close action",async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 portraits.render.mockResolvedValue(Object.fromEntries(bestiary.map(entry=>[entry.kind,"data:image/png;base64,iVBORw0KGgo="])))
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host),close=vi.fn()
 try{
  await act(async()=>root.render(<Bestiary onClose={close}/>))
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,50))})
  expect(host.querySelectorAll("article")).toHaveLength(bestiary.length)
  expect(host.querySelectorAll("img")).toHaveLength(bestiary.length)
  for(const button of host.querySelectorAll<HTMLButtonElement>("nav button")){
   await act(()=>button.click());expect(button.getAttribute("aria-pressed")).toBe("true")
   const role=button.textContent;expect(host.querySelectorAll("article")).toHaveLength(role==="All"?bestiary.length:bestiary.filter(entry=>entry.role===role).length)
  }
  await act(()=>host.querySelector<HTMLButtonElement>(".primary-action")!.click());expect(close).toHaveBeenCalledOnce()
 }finally{await act(()=>root.unmount());host.remove()}
})

it("keeps the guide usable when portraits fail or finish after it is closed",async()=>{
 const host=document.createElement("div");document.body.append(host)
 let root=createRoot(host)
 try{
  portraits.render.mockRejectedValueOnce(new Error("No GPU"))
  await act(async()=>root.render(<Bestiary onClose={()=>{}}/>))
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,50))})
  expect(host.querySelectorAll("article")).toHaveLength(bestiary.length);expect(host.querySelectorAll("img")).toHaveLength(0)
  await act(()=>root.unmount());root=createRoot(host)
  let finish!:(value:object)=>void;portraits.render.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}))
  await act(async()=>root.render(<Bestiary onClose={()=>{}}/>));await act(async()=>{await new Promise(resolve=>setTimeout(resolve,50))})
  await act(()=>root.unmount());await act(async()=>finish({}))
 }finally{host.remove()}
})
