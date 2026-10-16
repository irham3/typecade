import { act } from "react"
import { userEvent } from "vitest/browser"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { App, runTime } from "./App"
import { SurvivalRun } from "@typecade/game-rules"
import { combatLessonWords, dungeonUpgrades, skillRules } from "@typecade/content"
import type { DungeonEvents } from "@typecade/contracts"
import type { GameEventBridge } from "./bridge/game-event-bridge"
const scene=vi.hoisted(()=>({destroy:vi.fn(),bridge:null as GameEventBridge<DungeonEvents>|null,fail:false,ready:undefined as Promise<void>|undefined}))
vi.mock("./game/DungeonScene",()=>({DungeonScene:class {ready=scene.ready??Promise.resolve();constructor(_host:HTMLElement,bridge:GameEventBridge<DungeonEvents>){if(scene.fail)throw new Error("WebGL unavailable");scene.bridge=bridge;bridge.emit("renderer",{status:"ready",calls:1,geometries:1,textures:1})}destroy(){scene.destroy()}}}))
let host:HTMLDivElement,root:Root
beforeEach(()=>{scene.fail=false;scene.ready=undefined;scene.bridge=null;Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();host=document.createElement("div");document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(()=>root.unmount());host.remove();localStorage.clear();history.replaceState(null,"","/");vi.restoreAllMocks()})
async function mount(){
 await act(()=>root.render(<App/>))
 for(let i=0;i<30;i++){
  if(host.querySelector('[data-testid="dungeon-canvas"]')?.getAttribute("data-renderer-state")!=="loading")return
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10))})
 }
 throw new Error("Renderer did not settle")
}
async function click(text:string){const button=[...host.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent?.includes(text))!;expect(button).toBeTruthy();await act(()=>button.click())}
it("offers a skippable, replayable combat tutorial without replacing the saved run",async()=>{
 const saved=new SurvivalRun("keep-my-save");saved.state.time=2;const raw=saved.serialize();localStorage.setItem("typecade:dungeon:run:v1",raw)
 await mount();await click("Combat tutorial");expect(host.textContent).toContain("SAFE TRAINING");await click("Skip tutorial")
 expect(host.textContent).toContain("Every word.");expect(localStorage.getItem("typecade:dungeon:run:v1")).toBe(raw)
 await click("Typing Dojo");await click("Combat tutorial");expect(host.textContent).toContain("Your word is your movement");await click("Skip tutorial");expect(host.textContent).toContain("Typing Dojo");await click("Main menu")
 await click("Enter the keep");await click("Try combat tutorial");await click("Skip tutorial");expect(host.textContent).toContain("The keep is listening.")
})
for(const language of ["en","id"] as const)it(`teaches each real combat action and displays hit and upgrade feedback in ${language}`,async()=>{
 await mount();const select=host.querySelector<HTMLSelectElement>('[aria-label="Word language"]')!;await act(()=>{select.value=language;select.dispatchEvent(new Event("change",{bubbles:true}))});await click("Combat tutorial")
 const words=combatLessonWords[language]
 const type=async(word:string)=>act(()=>{for(const key of (["Tab","Enter"].includes(word)?[word]:word))host.querySelector<HTMLInputElement>('[data-testid="dungeon-input"]')!.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true}))})
 await type(words.strike);expect(host.textContent).toContain("Enemy defeated.");await type("Enter")
 await type(words.armor[0]!);await act(()=>scene.bridge!.emit("renderer",{status:"lost",calls:0,geometries:0,textures:0}));await click("Restore scene");await click("Resume run");expect(host.textContent).toContain("Two words, two armor layers");await type(words.armor[1]!);await click("Next lesson")
 await type(words.treasure);expect(host.textContent).toContain("Chest opened.");await click("Next lesson")
 await type(words.barrel);expect(host.textContent).toContain("One word, one chain reaction.");await click("Next lesson")
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,850))});expect(host.querySelector(".damage-response")?.textContent).toContain("-2 HP")
 await type("Tab");await type(skillRules.heal[language]);expect(host.textContent).toContain("Two hearts restored.");await click("Next lesson")
 await type("Tab");await type(skillRules.storm[language]);expect(host.textContent).toContain("storm removed one layer");await click("Next lesson")
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,850))});expect(host.querySelectorAll(".upgrade-card")).toHaveLength(3);expect(host.textContent).toContain("RANK")
 const keyword=host.querySelector('[data-testid="upgrade-keyword"]')!.textContent!
 await act(()=>{for(const key of keyword)host.querySelector<HTMLInputElement>('[aria-label="Upgrade typing input"]')!.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true}))})
 expect(host.querySelector(".upgrade-acquired")?.textContent).toContain("UPGRADE ACTIVE");expect(host.textContent).toContain("Upgrade applied.")
 expect(Object.values(dungeonUpgrades).some(offer=>host.textContent?.includes(offer.name))).toBe(true)
 await click("Finish tutorial");await click("Combat tutorial");expect(host.textContent).toContain("SAFE TRAINING · 1/7")
 const hidden=vi.spyOn(document,"hidden","get").mockReturnValue(true);await act(()=>document.dispatchEvent(new Event("visibilitychange")));expect(host.textContent).toContain("Take a breath.");hidden.mockReturnValue(false);await act(()=>document.dispatchEvent(new Event("visibilitychange")));await click("Resume run");await click("Skip tutorial")
})
it("announces reinforcements during a temporarily empty arena",async()=>{
 const r=new SurvivalRun("empty-ui");r.start();r.state.enemies=[];r.state.queue=[];r.state.time=r.state.worldTime=1;r.state.spawnAt=100
 localStorage.setItem("typecade:dungeon:run:v1",r.serialize());await mount();await click("Continue run");await click("Resume run")
 expect(host.textContent).toContain("REINFORCEMENTS APPROACHING")
})
it("explains max-rank restorative drafts and applies their actual heart and mana recovery",async()=>{
 const r=new SurvivalRun("boon-ui"),s=r.state;r.start();s.time=10;s.phase="draft";s.pendingDrafts=1;s.offers=["cleave","storm","heal"];s.player.hp=3;s.player.mana=50
 s.skills.cleave.level=s.skills.storm.level=s.skills.heal.level=3
 localStorage.setItem("typecade:dungeon:run:v1",r.serialize());await mount();await click("Continue run");await click("Resume run")
 expect(host.textContent).toContain("MAX RANK");for(const key of "BLADE")await act(()=>host.querySelector<HTMLInputElement>('[aria-label="Upgrade typing input"]')!.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true})))
 expect(host.querySelector(".hearts")?.getAttribute("aria-label")).toBe("4 of 6 hearts");expect(host.textContent).toContain("Restore up to 1 heart and 15 mana.")
})
it("opens a live game shell, settings, account and both secondary modes",async()=>{
 localStorage.setItem("typecade:ocean-typing-rpg:m1","old data")
 await mount();await act(()=>host.querySelector("a")!.click());expect(host.textContent).toContain("A fighting chance.");expect(runTime(125)).toBe("02:05")
 await act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Settings"]')!.click());expect(host.querySelector("dialog")?.textContent).toContain("Reduced Effects")
 await act(()=>host.querySelector<HTMLInputElement>('[aria-label="Reduced Effects"]')!.click());await act(()=>host.querySelector("dialog")!.dispatchEvent(new Event("cancel",{cancelable:true})))
 expect(host.getAttribute("data-reduced-effects")).not.toBe("false");await click("Account");expect(host.textContent).toContain("Local progress");await act(()=>host.querySelector("dialog")!.dispatchEvent(new Event("cancel",{cancelable:true})))
 await click("Typing Dojo");expect(host.textContent).toContain("Typing Dojo");await click("Main menu");await click("Multiplayer");expect(host.textContent).toContain("Gather at the keep");await click("Main menu")
 expect(localStorage.getItem("typecade:ocean-typing-rpg:m1")).toBe("old data")
})
it("starts, types, pauses and resumes without letting global keys alter the run",async()=>{
 await mount();await click("Enter the keep");await click("Begin run")
 const input=host.querySelector<HTMLInputElement>('[data-testid="dungeon-input"]')!;expect(input).toBe(document.activeElement)
 await act(()=>window.dispatchEvent(new KeyboardEvent("keydown",{key:"a"})))
 await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true,cancelable:true})));expect(host.querySelector(".skill-dock")?.className).toContain("casting")
 await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true,cancelable:true})))
 await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})));expect(host.textContent).toContain("Take a breath.")
 await click("Settings");await click("Done");await click("Resume run");expect(host.querySelector('[data-testid="dungeon-input"]')).toBe(document.activeElement)
 await act(()=>host.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})));await click("Save and return")
})
it("restores draft and boss phases with real scoped typing",async()=>{
 const run=new SurvivalRun("draft");run.start();run.gainXp(130);run.advance(.01);localStorage.setItem("typecade:dungeon:run:v1",run.serialize())
 await mount();await click("Continue run");await click("Resume run");expect(host.querySelectorAll(".upgrade-card")).toHaveLength(3)
 const keyword=host.querySelector('[data-testid="upgrade-keyword"]')!.textContent!
 await act(()=>{for(const key of keyword)host.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true}))})
 expect(host.querySelector(".upgrade-card")).toBeNull()
 await act(()=>scene.bridge!.emit("renderer",{status:"lost",calls:0,geometries:0,textures:0}));expect(host.textContent).toContain("Restore scene");await click("Restore scene");expect(host.textContent).toContain("Take a breath.")
})
it("loads touch settings, casts evolved skills and keeps forms and browser shortcuts usable",async()=>{
 localStorage.setItem("typecade:dungeon:settings:v1",JSON.stringify({reduced:true,volume:.5,keyboard:true}))
 const r=new SurvivalRun("evolved");r.start();r.state.time=5;r.state.streak=r.state.correct=r.state.bestStreak=60;r.state.player.hp=3;r.state.skills.cleave.level=3;r.state.skills.storm.level=3;r.state.skills.heal.level=3;r.state.enemies=[];r.spawn("minotaur",{x:2,z:0});r.refreshQueue()
 localStorage.setItem("typecade:dungeon:run:v1",r.serialize());await mount()
 await click("Sound on");await click("Sound off")
 const language=host.querySelector("select")!;await act(()=>{language.value="id";language.dispatchEvent(new Event("change",{bubbles:true}))})
 await click("Continue run");await click("Resume run");expect(host.querySelectorAll(".combat-keyboard")).toHaveLength(1)
 await act(()=>host.querySelector<HTMLButtonElement>('[aria-label="CLEAVE skill"]')!.click());await act(()=>host.querySelector<HTMLButtonElement>('[aria-label="CLEAVE skill"]')!.click())
 const input=host.querySelector("input")!;for(const key of "CLEAVE")await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true})))
 expect(host.textContent).toContain("3w COOLDOWN");expect(host.textContent).toContain("EVO")
 await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",repeat:true,bubbles:true,cancelable:true})))
 for(const options of [{ctrlKey:true},{metaKey:true},{altKey:true}])await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true,cancelable:true,...options})))
 await act(()=>host.querySelector<HTMLButtonElement>('.combat-keyboard [aria-label="q"]')!.click());await act(()=>host.querySelector<HTMLButtonElement>('.combat-keyboard>button')!.click())
 await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})));await click("Settings")
 const volume=host.querySelector<HTMLInputElement>('[aria-label="Sound volume"]')!;await act(()=>userEvent.fill(volume,"0.7"))
 await act(()=>userEvent.fill(host.querySelector<HTMLInputElement>('[aria-label="Music volume"]')!,"0.35"));await act(()=>userEvent.fill(host.querySelector<HTMLInputElement>('[aria-label="Effects volume"]')!,"0.8"))
 expect(JSON.parse(localStorage.getItem("typecade:dungeon:settings:v1")!)).toMatchObject({volume:.7,music:.35,effects:.8})
 await act(()=>host.querySelector<HTMLInputElement>('[aria-label="On-screen keyboard"]')!.click());await click("Done");await click("Save and return")
})
it("renders armor breaks, typed upgrades and final results from valid checkpoints",async()=>{
 const r=new SurvivalRun("boss-ui"),s=r.state;r.start();s.time=s.worldTime=300;s.nextBoss=600;const boss=r.spawn("boss",{x:2,z:0})!;boss.words=[];s.phase="overdrive";s.stagger=10;s.paragraph="strike BLIZZARD ";s.player.hp=2
 localStorage.setItem("typecade:dungeon:run:v1",r.serialize());await mount();await click("Continue run");await click("Resume run");expect(host.textContent).toContain("ARMOR BREAK")
 const input=host.querySelector<HTMLInputElement>('[data-testid="dungeon-input"]')!;await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"s",bubbles:true})))
 await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})));await click("Save and return")
 await act(()=>root.unmount());root=createRoot(host);r.state.phase="arena";r.state.relics.lightning=1;r.state.player.hp=1;r.state.player.invincible=0;r.state.boss=null;r.state.enemies=[];r.spawn("skeleton",{x:0,z:0});r.refreshQueue();localStorage.setItem("typecade:dungeon:run:v1",r.serialize());await mount();await click("Continue run");await click("Resume run");await act(async()=>{await new Promise(resolve=>setTimeout(resolve,180))});expect(host.textContent).toContain("The keep remembers");expect(host.querySelector('[aria-label="Run build"]')?.textContent).toContain("Chain Lightning");await click("Try another run");await click("Back to title")
})
it("explains renderer initialization errors and accepts a clean retry",async()=>{
 localStorage.setItem("typecade:dungeon:settings:v1","{");scene.fail=true;await mount();await click("Enter the keep");expect(host.textContent).toContain("scene needs a moment")
 scene.fail=false;await click("Restore scene");await act(async()=>{await new Promise(resolve=>setTimeout(resolve,20))});expect(host.textContent).toContain("Begin run")
})
it("keeps typed draft choices frozen and resumes the resulting build",async()=>{
 const r=new SurvivalRun("offer-ui"),s=r.state;r.start();s.time=10;s.phase="draft";s.offers=["heal","storm","cleave"];s.pendingDrafts=s.legendaryDrafts=1;s.level=2
 localStorage.setItem("typecade:dungeon:run:v1",r.serialize());await mount();await click("Continue run");await click("Resume run")
 const key=async(key:string)=>act(()=>host.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true})))
 await key("F");expect(host.querySelector('.upgrade-card:nth-child(2) .typed')!.textContent).toBe("F")
 for(const k of "ROST")await key(k);expect(host.querySelector(".upgrade-card")).toBeNull()
 await act(()=>host.querySelector<HTMLButtonElement>('[aria-label="Pause game"]')!.click());await click("Save and return")
})
it("handles deep links, invalid settings bounds and late renderer failures after disposal",async()=>{
 history.replaceState(null,"","/?race=ABCDEFGH");await mount();expect(host.textContent).toContain("Gather at the keep");await click("Main menu")
 await act(()=>root.unmount());root=createRoot(host);localStorage.setItem("typecade:dungeon:settings:v1",JSON.stringify({reduced:false,volume:2}));
 let reject!:(error:Error)=>void;scene.ready=new Promise((_resolve,fail)=>{reject=fail});await mount();await act(()=>root.unmount());root=createRoot(host);await act(async()=>reject(new Error("Late initialization")))
 scene.ready=undefined;scene.bridge=null;act(()=>root.render(<App/>));act(()=>root.unmount());root=createRoot(host);await act(async()=>{await Promise.resolve()});expect(scene.bridge).toBeNull()
})
