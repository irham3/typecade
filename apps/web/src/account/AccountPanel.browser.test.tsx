import { act } from "react"
import { createRoot,type Root } from "react-dom/client"
import { afterEach,beforeEach,expect,it,vi } from "vitest"
import { userEvent } from "vitest/browser"
import { AccountPanel } from "../App"
import { SurvivalRun } from "@typecade/game-rules"
import { getAccountClient } from "./client"
import { loadDungeonAccount,uploadDungeonCheckpoint } from "./dungeon-account"
import type { Session,SupabaseClient } from "@supabase/supabase-js"

vi.mock("./client",()=>({getAccountClient:vi.fn()}))
vi.mock("./dungeon-account",async original=>({...await original<typeof import("./dungeon-account")>(),loadDungeonAccount:vi.fn(),uploadDungeonCheckpoint:vi.fn()}))
let host:HTMLDivElement,root:Root,notify:((event:string,session:Session|null)=>void)|undefined
const saved=new SurvivalRun("account").serialize(),session={user:{id:"own",email:"knight@example.com",user_metadata:{display_name:"Blue"}}} as unknown as Session
const auth={getSession:vi.fn(),onAuthStateChange:vi.fn((callback:(event:string,session:Session|null)=>void)=>{notify=callback;return{data:{subscription:{unsubscribe:vi.fn()}}}}),signInWithPassword:vi.fn(),signUp:vi.fn(),signOut:vi.fn()}
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement("div");document.body.append(host);root=createRoot(host)
 vi.mocked(getAccountClient).mockReturnValue({auth} as unknown as SupabaseClient)
 auth.getSession.mockResolvedValue({data:{session:null},error:null});auth.signInWithPassword.mockResolvedValue({error:null});auth.signUp.mockResolvedValue({error:null});auth.signOut.mockResolvedValue({error:null})
 vi.mocked(loadDungeonAccount).mockResolvedValue({checkpoint:{save_data:JSON.parse(saved),revision:1},achievements:[{achievement_id:"first_strike",unlocked_at:"now"},{achievement_id:"new_achievement",unlocked_at:"now"}],board:[{display_name:"Knight",best_seconds:60,best_level:5,best_kills:10}]})
 vi.mocked(uploadDungeonCheckpoint).mockResolvedValue(2)
})
afterEach(async()=>{await act(()=>root.unmount());host.remove();vi.clearAllMocks()})
async function mount(restore=vi.fn(()=>true)){await act(async()=>root.render(<AccountPanel onClose={vi.fn()} checkpoint={()=>saved} onRestore={restore}/>));return restore}
async function click(text:string){await act(async()=>[...host.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent?.includes(text))!.click())}
async function submit(){await act(async()=>host.querySelector("form")!.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})))}
async function fill(){await act(async()=>{await userEvent.fill(host.querySelector('[type="email"]')!,"knight@example.com");await userEvent.fill(host.querySelector('[type="password"]')!,"12345678")})}

it("handles sign-in, sign-up, confirmation and errors without losing entered data",async()=>{
 await mount();await fill();await submit();expect(host.textContent).toContain("Signed in.")
 auth.signInWithPassword.mockResolvedValueOnce({error:{message:"Wrong password"}});await submit();expect(host.textContent).toContain("Wrong password")
 auth.signInWithPassword.mockRejectedValueOnce("offline");await submit();expect(host.textContent).toContain("could not be reached")
 await click("Create an account");await act(()=>userEvent.fill(host.querySelector('[autocomplete="nickname"]')!,"Blue"));await submit();expect(host.textContent).toContain("Check your email")
 expect(auth.signUp).toHaveBeenCalledWith(expect.objectContaining({options:expect.objectContaining({data:{display_name:"Blue"}})}))
 auth.signUp.mockResolvedValueOnce({error:{message:"Name unavailable"}});await submit();expect(host.textContent).toContain("Name unavailable");await click("I have an account")
})
it("loads a separately versioned record, uploads and restores only by explicit choice",async()=>{
 auth.getSession.mockResolvedValueOnce({data:{session},error:null});const restore=await mount()
 await click("Load cloud record");expect(host.textContent).toContain("First Strike");expect(host.textContent).toContain("new_achievement");expect(host.textContent).toContain("Browser reported")
 await click("Upload local run");expect(uploadDungeonCheckpoint).toHaveBeenCalledWith(expect.anything(),saved,1,"Blue")
 await click("Replace local run");expect(restore).toHaveBeenCalledWith(saved);expect(host.textContent).toContain("restored locally")
 restore.mockReturnValue(false);await click("Replace local run");expect(host.textContent).toContain("Incompatible checkpoint")
 vi.mocked(uploadDungeonCheckpoint).mockRejectedValueOnce(new Error("Save conflict"));await click("Upload local run");expect(host.textContent).toContain("Save conflict")
 vi.mocked(uploadDungeonCheckpoint).mockRejectedValueOnce("network");await click("Upload local run");expect(host.textContent).toContain("Could not upload")
 vi.mocked(loadDungeonAccount).mockResolvedValueOnce({checkpoint:null,achievements:[],board:[]});await click("Load cloud record");expect(host.textContent).toContain("No cloud checkpoint yet");expect(host.textContent).toContain("No dungeon achievements");await click("Upload local run");expect(uploadDungeonCheckpoint).toHaveBeenLastCalledWith(expect.anything(),saved,0,"Blue")
 await act(()=>notify!("SIGNED_IN",{...session,user:{...session.user,user_metadata:{}}}));await click("Load cloud record");await click("Upload local run");expect(uploadDungeonCheckpoint).toHaveBeenLastCalledWith(expect.anything(),saved,1,"Knight")
 auth.signOut.mockResolvedValueOnce({error:{message:"Sign-out denied"}});await click("Sign out");expect(host.textContent).toContain("Sign-out denied")
 auth.signOut.mockRejectedValueOnce("offline");await click("Sign out");expect(host.textContent).toContain("Could not sign out")
 await click("Sign out");await act(()=>notify!("SIGNED_OUT",null));expect(host.querySelector("form")).not.toBeNull()
})
it("keeps local progress usable when sessions or cloud loading fail",async()=>{
 auth.getSession.mockResolvedValueOnce({data:{session},error:{message:"Session warning"}});await mount();expect(host.textContent).toContain("Session warning")
 vi.mocked(loadDungeonAccount).mockRejectedValueOnce(new Error("Schema missing"));await click("Load cloud record");expect(host.textContent).toContain("Schema missing")
 vi.mocked(loadDungeonAccount).mockRejectedValueOnce("schema");await click("Load cloud record");expect(host.textContent).toContain("schema is unavailable")
 await act(()=>notify!("SIGNED_OUT",null));auth.getSession.mockRejectedValueOnce(new Error("expired"));await act(()=>root.unmount());root=createRoot(host);await mount();expect(host.textContent).toContain("Could not restore")
 await act(()=>root.unmount());root=createRoot(host);vi.mocked(getAccountClient).mockReturnValue(null);await mount();await submit();expect(host.textContent).toContain("Local progress is available")
})
it("discards a cloud response arriving after sign-out",async()=>{
 auth.getSession.mockResolvedValueOnce({data:{session},error:null});await mount()
 let finish!:(data:Awaited<ReturnType<typeof loadDungeonAccount>>)=>void
 vi.mocked(loadDungeonAccount).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}))
 await click("Load cloud record");await act(()=>notify!("SIGNED_OUT",null));await act(()=>finish({checkpoint:null,achievements:[],board:[]}))
 expect(host.textContent).not.toContain("Cloud record loaded");expect(host.querySelector("form")).not.toBeNull()
})
it("discards uploads and their follow-up responses after an account change",async()=>{
 auth.getSession.mockResolvedValueOnce({data:{session},error:null});await mount();await click("Load cloud record")
 let finish!:(value:number)=>void,reject!:(reason:unknown)=>void,loaded!:(value:Awaited<ReturnType<typeof loadDungeonAccount>>)=>void
 vi.mocked(uploadDungeonCheckpoint).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}))
 await click("Upload local run");await act(()=>notify!("SIGNED_OUT",null));await act(()=>finish(2));expect(host.textContent).not.toContain("community record saved")
 await act(()=>notify!("SIGNED_IN",session));await click("Load cloud record")
 vi.mocked(uploadDungeonCheckpoint).mockImplementationOnce(()=>new Promise((_resolve,fail)=>{reject=fail}));await click("Upload local run");await act(()=>notify!("SIGNED_OUT",null));await act(()=>reject(new Error("Late upload")));expect(host.textContent).not.toContain("Late upload")
 await act(()=>notify!("SIGNED_IN",session));await click("Load cloud record")
 vi.mocked(loadDungeonAccount).mockImplementationOnce(()=>new Promise(resolve=>{loaded=resolve}));await click("Upload local run");await act(()=>notify!("SIGNED_OUT",null));await act(()=>loaded({checkpoint:null,achievements:[],board:[]}));expect(host.textContent).not.toContain("community record saved")
})
it("ignores a late session and errors from requests invalidated by sign-out or teardown",async()=>{
 let resolve!:(value:unknown)=>void,reject!:(reason:unknown)=>void
 auth.getSession.mockImplementationOnce(()=>new Promise(done=>{resolve=done}));await mount();await act(()=>notify!("SIGNED_OUT",null));await act(()=>resolve({data:{session},error:null}));expect(host.querySelector("form")).not.toBeNull()
 await act(()=>notify!("SIGNED_IN",session));vi.mocked(loadDungeonAccount).mockImplementationOnce(()=>new Promise((_done,fail)=>{reject=fail}));await click("Load cloud record");await act(()=>notify!("SIGNED_OUT",null));await act(()=>reject(new Error("Late load")));expect(host.textContent).not.toContain("Late load")
 await act(()=>root.unmount());root=createRoot(host);auth.getSession.mockImplementationOnce(()=>new Promise((_done,fail)=>{reject=fail}));await mount();await act(()=>root.unmount());root=createRoot(host);await act(()=>{notify!("SIGNED_IN",session);reject(new Error("Disposed session"))})
})
