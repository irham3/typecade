import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import type { DungeonEvents, DungeonLanguage, SkillId } from "@typecade/contracts"
import { dungeonBiomes, dungeonUpgrades, skillRules } from "@typecade/content"
import { SurvivalRun, runAccuracy, runWpm, xpThreshold } from "@typecade/game-rules"
import { useSurvivalRun } from "./hooks/useSurvivalRun"
import { PracticeScreen } from "./practice/PracticeScreen"
import { PracticeKeyboard } from "./practice/PracticeKeyboard"
import { RaceScreen } from "./multiplayer/RaceScreen"
import { TypingInput, TypingPassage } from "./TypingField"
import { TargetLabels } from "./dungeon/TargetLabels"
import { Glyph } from "./dungeon/Glyph"
import { PartyLabels } from "./dungeon/PartyLabels"
import { partyWorld } from "./dungeon/party-world"
import type { RaceRoomSnapshot } from "@typecade/race-rules"
import { readStorage, writeStorage } from "./storage"
import { getAccountClient } from "./account/client"
import { achievementNames, loadDungeonAccount, uploadDungeonCheckpoint } from "./account/dungeon-account"
import type { User } from "@supabase/supabase-js"
type Screen = DungeonEvents["screen"]
interface Settings { reduced: boolean; volume: number; keyboard: boolean }
const settingsKey = "typecade:dungeon:settings:v1"
function loadSettings(): Settings {
 try { const s=JSON.parse(readStorage("localStorage",settingsKey)??"null");return {reduced:typeof s?.reduced==="boolean"?s.reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,volume:typeof s?.volume==="number"&&s.volume>=0&&s.volume<=1?s.volume:.28,keyboard:s?.keyboard===true} }
 catch { return {reduced:false,volume:.28,keyboard:false} }
}
export const runTime = (seconds:number) => `${Math.floor(seconds/60).toString().padStart(2,"0")}:${Math.floor(seconds%60).toString().padStart(2,"0")}`
export function App() {
 const host=useRef<HTMLDivElement>(null), inputRef=useRef<HTMLInputElement>(null)
 const [screen,setScreen]=useState<Screen>(()=>new URLSearchParams(location.search).has("race")?"multiplayer":"title")
 const [renderer,setRenderer]=useState<"loading"|"ready"|"lost"|"error">("loading")
 const [attempt,setAttempt]=useState(0), [settings,setSettings]=useState(loadSettings)
 const [panel,setPanel]=useState<"settings"|"account"|null>(null)
 const [attract]=useState(()=>new SurvivalRun("castle-title"))
 const run=useSurvivalRun(screen==="endless"&&renderer==="ready")
 const {view,bridge,pause}=run
 const [language,setLanguage]=useState<DungeonLanguage>(view.language)
 const [stats,setStats]=useState({calls:0,geometries:0,textures:0})
 const active=screen==="endless"&&["arena","skills","draft","overdrive"].includes(view.phase)&&!panel&&renderer==="ready"
 useEffect(()=>{
  let disposed=false, destroy:(()=>void)|undefined
  const unsubscribe=bridge.on("renderer",info=>{setRenderer(info.status);setStats(info)})
  void import("./game/DungeonScene").then(async({DungeonScene})=>{
   if(disposed)return
   const game=new DungeonScene(host.current!,bridge);destroy=()=>game.destroy();await game.ready
  }).catch(()=>{if(!disposed)setRenderer("error")})
  return()=>{disposed=true;unsubscribe();destroy?.()}
 },[bridge,attempt])
 useEffect(()=>{bridge.emit("screen",screen);if(screen!=="endless")bridge.emit("frame",attract.state)},[bridge,screen,attract])
 useEffect(()=>{bridge.emit("settings",settings);writeStorage("localStorage",settingsKey,JSON.stringify(settings))},[bridge,settings])
 useEffect(()=>{if(screen==="endless"&&renderer!=="ready")pause()},[renderer,screen,pause])
 const leave=()=>{run.pause();setScreen("title")}
 const fresh=()=>{run.fresh(language);setScreen("endless")}
 const type=(key:string)=>{run.input(key)}
 const castMode=()=>{if(view.phase==="arena")type("Tab");inputRef.current?.focus()}
 const boss=view.enemies.find(e=>e.id===view.boss)
 const train=useCallback((correct:number,words:number,errors:number)=>bridge.emit("training",{correct,words,errors}),[bridge])
 const party=useCallback((room:RaceRoomSnapshot|null,own:string|null,casting:boolean)=>bridge.emit("party",partyWorld(room,own,casting)),[bridge])
 const phase=view.phase
 return <main className={`dungeon-app scene-${screen}`} data-testid="dungeon-shell" data-reduced-effects={settings.reduced}>
  <div className="dungeon-canvas" ref={host} data-testid="dungeon-canvas" data-renderer-state={renderer} data-draw-calls={stats.calls} data-geometries={stats.geometries} data-textures={stats.textures}/>
  <div className="scene-shade" aria-hidden="true"/>
  {screen==="title"&&<>
   <header className="title-nav"><a href="#" className="wordmark" onClick={e=>e.preventDefault()}>TYPECADE<span>THE RUINED KEEP</span></a><div><button className="quiet" onClick={()=>setPanel("account")}>Account</button><button className="icon-button" aria-label="Settings" onClick={()=>setPanel("settings")}><Glyph name="gear"/></button></div></header>
   <section className="title-menu">
    <span className="eyebrow"><i/> A TYPING ROGUELIKE</span>
    <h1>Every word.<br/><span>A fighting chance.</span></h1>
    <p>The keep has no end. Your blade follows your words.<br className="desktop-break"/> Build your strength. Hold back the dark.</p>
    <div className="title-actions"><button className="start-button" autoFocus onClick={fresh}><Glyph name="sword"/><span>Enter the keep<small>ENDLESS SURVIVAL</small></span><kbd>↵</kbd></button>
     {view.time>0&&phase!=="dead"&&<button className="continue-button" onClick={()=>setScreen("endless")}>Continue run <span>LV {view.level} · {runTime(view.time)}</span></button>}
     <div className="secondary-modes"><button onClick={()=>setScreen("dojo")}><Glyph name="book"/>Typing Dojo</button><button onClick={()=>setScreen("multiplayer")}><Glyph name="flag"/>Multiplayer</button></div>
    </div>
    <label className="title-language">Word language <select aria-label="Word language" value={language} onChange={e=>setLanguage(e.target.value as DungeonLanguage)}><option value="en">English</option><option value="id">Bahasa Indonesia</option></select></label>
    <div className="title-footnote"><kbd>TYPE</kbd> to strike <span>·</span><kbd>TAB</kbd> to cast <span>·</span> no movement keys</div>
   </section>
   <aside className="title-world-note"><span>DEPTH 01</span><strong>The Ashen Courtyard</strong><small>A blue blade against the endless.</small></aside>
   <footer className="title-footer"><span>LOCAL BEST <strong>{runTime(run.best)}</strong></span><span>EN / ID <i/> KEYBOARD FIRST <i/> SOLO + PARTY</span><button className="quiet" onClick={()=>setSettings({...settings,volume:settings.volume?0:.28})}>{settings.volume?"Sound on":"Sound off"}</button></footer>
  </>}
  {screen==="endless"&&<>
   <header className="run-hud">
    <section className="combat-metrics"><div className="hud-topline"><button aria-label="Pause game" className="pause-button" onClick={run.pause}>Ⅱ</button><span title={dungeonBiomes[view.biome%dungeonBiomes.length]!.name}>DEPTH {String(view.biome+1).padStart(2,"0")}</span><strong>{runTime(view.time)}</strong></div><div className="metric-values"><span><b>{runWpm(view)}</b> WPM</span><span><b>{runAccuracy(view)}%</b> ACC</span><span className={view.streak>=50?"streak-hot":""}><b>{view.streak}×</b> STREAK</span></div></section>
    <section className="vitals" aria-label="Player status"><div className="health-row"><span>HP</span><div className="hearts" aria-label={`${view.player.hp} of ${view.player.maxHp} hearts`}>{Array.from({length:view.player.maxHp},(_,i)=><i key={i} className={i<view.player.hp?"filled":""}/>)}</div><strong>{view.gold}g</strong></div><div className="resource-row"><span>MP</span><meter min="0" max="100" value={view.player.mana} aria-label="Mana"/><small>{Math.floor(view.player.mana)}</small></div><div className="resource-row xp-row"><span>LV {view.level}</span><progress max={xpThreshold(view.level)} value={view.xp} aria-label="Experience"/><small>{view.xp}/{xpThreshold(view.level)}</small></div></section>
   </header>
   {boss&&<div className="boss-hud"><strong>OBSIDIAN MINOTAUR</strong><progress max={boss.maxHealth} value={Math.max(0,boss.health)} aria-label="Boss health"/><small>{phase==="overdrive"?`ARMOR BREAK · ${view.stagger.toFixed(1)}s`:`ARMOR ×${boss.words.length}`}</small></div>}
   {["arena","skills"].includes(phase)&&<TargetLabels view={view} bridge={bridge}/>}
   {active&&phase!=="draft"&&<div className="run-input-owner" onKeyDownCapture={e=>{if(e.key==="Tab"&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&["arena","skills"].includes(phase)){e.preventDefault();e.stopPropagation();if(!e.repeat)type("Tab")}}}><TypingInput inputRef={inputRef} label="Dungeon typing input" testId="dungeon-input" onType={type} onEscape={()=>type("Escape")} inputMode={settings.keyboard?"none":undefined}/></div>}
   {["arena","skills"].includes(phase)&&<footer className={`skill-dock ${phase==="skills"?"casting":""}`}>
    <p className="skill-mode-hint">{phase==="skills"?"TIME SLOWED · TYPE A SKILL · TAB TO CANCEL":view.queue.length===0?"REINFORCEMENTS APPROACHING · HOLD YOUR GROUND":"TYPE AN ENEMY WORD TO DASH · TAB FOR SKILLS"}</p>
    <div className="skill-cards">{(["cleave","storm","heal"] as SkillId[]).map((id,i)=>{
     const skill=view.skills[id], rules=skillRules[id], word=rules[view.language], typed=phase==="skills"&&word.startsWith(view.command)?view.command.length:0
     const cost=Math.max(10,rules.cost-(skill.level-1)*5), blocked=skill.cooldown>0||view.player.mana<cost||id==="heal"&&view.player.hp===view.player.maxHp
     return <button key={id} className={`skill-card skill-${id} ${blocked?"unavailable":""}`} style={{"--skill-color":["#edaa58","#64cfe9","#9bdb7a"][i]} as CSSProperties} onClick={castMode} aria-label={`${word} skill`}><Glyph name={id==="cleave"?"sword":id==="storm"?"storm":"heal"}/><span><strong><b>{word.slice(0,typed)}</b>{word.slice(typed)}</strong><small>{skill.cooldown?`${skill.cooldown}w COOLDOWN`:`${cost} MP · LV ${skill.level}`}</small></span><i>{skill.level===3?"EVO":"READY"}</i></button>
    })}</div>
    <p className="run-notice" role="status">{view.notice}</p>
   </footer>}
   {phase==="overdrive"&&<section className="boss-overdrive pixel-panel"><header><strong>ARMOR BREAK</strong><span>{view.stagger.toFixed(1)}s · EVERY LETTER STRIKES</span></header><TypingPassage text={view.paragraph} cursor={view.cursor} rollingLines={2} className="boss-passage" testId="boss-passage" fontSize={24} monospace/></section>}
   {settings.keyboard&&active&&phase!=="draft"&&<div className="combat-keyboard"><PracticeKeyboard onKey={key=>{type(key);inputRef.current?.focus()}}/><button onClick={castMode}>Tab · Skills</button></div>}
   {phase==="ready"&&!panel&&renderer==="ready"&&<DungeonDialog title="The keep is listening." className="ready-dialog" onCancel={leave}><span className="eyebrow">ENDLESS SURVIVAL · {view.language.toUpperCase()}</span><p>Type a word above a foe to dash and strike. Build a run from fallen enemies. There is no final floor.</p><ul className="control-list"><li><kbd>TYPE</kbd><span>Finish a word. Your blade does the rest.</span></li><li><kbd>TAB</kbd><span>Slow time and type a skill.</span></li><li><kbd>ESC</kbd><span>Pause safely. Backspace cancels a target.</span></li></ul><button className="primary-action" autoFocus onClick={run.start}>Begin run</button><button className="quiet" onClick={leave}>Back to title</button></DungeonDialog>}
   {phase==="paused"&&!panel&&renderer==="ready"&&<DungeonDialog title="Take a breath." onCancel={run.resume}><span className="eyebrow">RUN PAUSED · INPUT SAVED</span><p>Depth {view.biome+1} · Level {view.level} · {runTime(view.time)}</p><button className="primary-action" autoFocus onClick={run.resume}>Resume run</button><button onClick={()=>setPanel("settings")}>Settings</button><button className="quiet" onClick={leave}>Save and return to title</button></DungeonDialog>}
   {phase==="draft"&&!panel&&renderer==="ready"&&<DungeonDialog title={view.legendaryDrafts?"A relic from the fallen.":`Level ${view.level}. Choose your edge.`} className="draft-dialog" onCancel={run.pause}><span className="eyebrow">{view.legendaryDrafts?"BOSS RELIC · TYPE TO PICK":"TIME FROZEN · TYPE TO PICK"}</span><div className="upgrade-cards">{view.offers.map(id=>{const offer=dungeonUpgrades[id],word=offer[view.language],count=word.startsWith(view.command)?view.command.length:0;return <article key={id} className="upgrade-card"><Glyph name={id==="heal"?"heal":id==="storm"||id==="lightning"?"storm":id==="magnet"?"gem":"sword"}/><h3>{offer.name}</h3><p>{offer.description}</p><strong data-testid="upgrade-keyword"><span className="typed">{word.slice(0,count)}</span>{word.slice(count)}</strong></article>})}</div><TypingInput inputRef={inputRef} label="Upgrade typing input" onType={type} onEscape={run.pause}/><p className="run-notice">{view.notice}</p></DungeonDialog>}
   {phase==="dead"&&!panel&&<DungeonDialog title="The keep remembers." onCancel={leave}><span className="eyebrow">RUN ENDED · ANOTHER BLADE WILL RISE</span><div className="result-values"><div><b>{runTime(view.time)}</b><span>SURVIVED</span></div><div><b>{view.level}</b><span>LEVEL</span></div><div><b>{view.kills}</b><span>DEFEATED</span></div></div><p>{runWpm(view)} WPM · {runAccuracy(view)}% accuracy · {view.gold} gold</p><p className="result-build" aria-label="Run build">Cleave {view.skills.cleave.level} · Storm {view.skills.storm.level} · Heal {view.skills.heal.level}{Object.entries(view.relics).filter(([,level])=>level>0).map(([id])=><span key={id}>{dungeonUpgrades[id as keyof typeof dungeonUpgrades].name}</span>)}</p><p className="muted">Local best {runTime(run.best)} · Your temporary build resets for the next run.</p><button className="primary-action" autoFocus onClick={fresh}>Try another run</button><button className="quiet" onClick={leave}>Return to title</button></DungeonDialog>}
   {renderer!=="ready"&&<DungeonDialog title={renderer==="loading"?"Opening the keep…":"The scene needs a moment."} onCancel={leave}><p role="status">{renderer==="loading"?"Preparing the dungeon. The run clock is stopped.":"Your run is paused and saved. Restore the scene to continue."}</p>{renderer!=="loading"&&<button className="primary-action" onClick={()=>{setRenderer("loading");setAttempt(n=>n+1)}}>Restore scene</button>}<button onClick={leave}>Return to title</button></DungeonDialog>}
  </>}
  {screen==="dojo"&&<PracticeScreen onBack={()=>setScreen("title")} onActivity={train}/>}
  {screen==="multiplayer"&&<><PartyLabels bridge={bridge}/><RaceScreen onWorld={party} onBack={()=>{history.replaceState(null,"",location.pathname);setScreen("title")}}/></>}
  {panel==="settings"&&<DungeonDialog title="Settings" onCancel={()=>setPanel(null)}><label className="settings-row"><span>Reduced Effects<small>Less ambient motion, no outline pass or particles.</small></span><input aria-label="Reduced Effects" type="checkbox" checked={settings.reduced} onChange={e=>setSettings({...settings,reduced:e.target.checked})}/></label><label className="settings-row"><span>Sound volume</span><input aria-label="Sound volume" type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e=>setSettings({...settings,volume:Number(e.target.value)})}/></label><label className="settings-row"><span>On-screen keyboard<small>Optional touch input; physical keys remain active.</small></span><input aria-label="On-screen keyboard" type="checkbox" checked={settings.keyboard} onChange={e=>setSettings({...settings,keyboard:e.target.checked})}/></label><button className="primary-action" onClick={()=>setPanel(null)}>Done</button></DungeonDialog>}
  {panel==="account"&&<AccountPanel onClose={()=>setPanel(null)} checkpoint={run.checkpoint} onRestore={run.restore}/>}
 </main>
}
export function DungeonDialog({title,children,onCancel,className=""}:{title:string;children:ReactNode;onCancel:()=>void;className?:string}) {
 const ref=useRef<HTMLDialogElement>(null), heading=title.toLowerCase().replace(/[^a-z0-9]/g,"-")
 useEffect(()=>{const dialog=ref.current!;dialog.showModal();dialog.querySelector<HTMLElement>('input:not([disabled]),.primary-action')?.focus({preventScroll:true})},[])
 return <dialog className={`dungeon-dialog pixel-panel ${className}`} ref={ref} aria-labelledby={heading} onCancel={e=>{e.preventDefault();onCancel()}}><header><h2 id={heading}>{title}</h2><button className="dialog-close" aria-label="Close dialog" onClick={onCancel}>×</button></header>{children}</dialog>
}
export function AccountPanel({onClose,checkpoint,onRestore}:{onClose:()=>void;checkpoint:()=>string;onRestore:(raw:string)=>boolean}) {
 const [client]=useState(getAccountClient), [email,setEmail]=useState(""), [password,setPassword]=useState(""), [name,setName]=useState(""), [signup,setSignup]=useState(false)
 const [identity,setIdentity]=useState<User|null>(null)
 const requestId=useRef({value:0})
 const [cloud,setCloud]=useState<Awaited<ReturnType<typeof loadDungeonAccount>>|null>(null)
 const user=identity?.email??null
 const [busy,setBusy]=useState(false), [status,setStatus]=useState(client?"":"Account services are not configured. Local progress is available.")
 useEffect(()=>{if(!client)return;const requests=requestId.current;let active=true,sessionObserved=false;void client.auth.getSession().then(({data,error})=>{if(active&&!sessionObserved){setIdentity(data.session?.user??null);if(error)setStatus(error.message)}}).catch(()=>{if(active)setStatus("Could not restore your account session.")});const {data}=client.auth.onAuthStateChange((_event,session)=>{sessionObserved=true;if(active){requestId.current.value++;setBusy(false);setIdentity(session?.user??null);setCloud(null)}});return()=>{active=false;requests.value++;data.subscription.unsubscribe()}},[client])
 const refresh=useCallback(async()=>{const request=++requestId.current.value;setBusy(true);try{const loaded=await loadDungeonAccount(client!,identity!.id);if(request===requestId.current.value){setCloud(loaded);setStatus("Cloud record loaded. Your local run is unchanged.")}}catch(cause){if(request===requestId.current.value)setStatus(cause instanceof Error?cause.message:"Dungeon account schema is unavailable. Your local run is safe.")}finally{if(request===requestId.current.value)setBusy(false)}},[client,identity])
 const upload=async()=>{
  const request=++requestId.current.value
  setBusy(true)
  try{
   await uploadDungeonCheckpoint(client!,checkpoint(),cloud!.checkpoint?.revision??0,String(identity!.user_metadata?.display_name??"Knight"))
   if(request!==requestId.current.value)return
   const loaded=await loadDungeonAccount(client!,identity!.id)
   if(request===requestId.current.value){setCloud(loaded);setStatus("Dungeon checkpoint and community record saved.")}
  }catch(cause){if(request===requestId.current.value)setStatus(cause instanceof Error?cause.message:"Could not upload the dungeon checkpoint. Your local run is unchanged.")}
  finally{if(request===requestId.current.value)setBusy(false)}
 }
 const submit=useCallback(async()=>{
  if(!client)return
  setBusy(true)
  try { const result=signup?await client.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:location.origin,data:{display_name:name.trim()}}}):await client.auth.signInWithPassword({email:email.trim(),password});setStatus(result.error?.message??(signup?"Account created. Check your email if confirmation is required.":"Signed in.")) }
  catch {setStatus("Account service could not be reached.")}
  finally {setBusy(false)}
 },[client,email,password,name,signup])
 return <DungeonDialog title="Your account" onCancel={onClose}><p className="muted">Existing account data is kept. Dungeon records use a separate save version.</p>{user?<><p>Signed in as <strong>{user}</strong></p><div className="account-progress"><h3>Dungeon checkpoint</h3><p>Load the cloud record before uploading. Uploading also publishes your best community record.</p><button disabled={busy} onClick={()=>void refresh()}>Load cloud record</button>{cloud&&<><p>{cloud.checkpoint?`Cloud revision ${cloud.checkpoint.revision}`:"No cloud checkpoint yet."}</p><button disabled={busy} onClick={()=>void upload()}>Upload local run</button>{cloud.checkpoint&&<button disabled={busy} onClick={()=>{if(onRestore(JSON.stringify(cloud.checkpoint!.save_data)))setStatus("Cloud run restored locally. Continue it from the title.");else setStatus("Incompatible checkpoint. Your local run is unchanged.")}}>Replace local run with cloud checkpoint</button>}<h3>Achievements</h3><p>{cloud.achievements.length?cloud.achievements.map(a=>achievementNames[a.achievement_id]??a.achievement_id).join(" · "):"No dungeon achievements yet."}</p><h3>Community records</h3><small>Browser reported · casual · unverified</small><ol>{cloud.board.map((entry,i)=><li key={i}>{entry.display_name} · {runTime(entry.best_seconds)} · LV {entry.best_level} · {entry.best_kills} defeated</li>)}</ol></>}</div><button onClick={()=>{void client!.auth.signOut().then(({error})=>{if(error)setStatus(error.message)}).catch(()=>setStatus("Could not sign out."))}}>Sign out</button></>:<form onSubmit={e=>{e.preventDefault();void submit()}}>{signup&&<label>Display name<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={24} autoComplete="nickname" required/></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={signup?8:undefined} autoComplete={signup?"new-password":"current-password"} required/></label><button className="primary-action" disabled={!client||busy}>{busy?"Please wait…":signup?"Create account":"Sign in"}</button><button type="button" className="quiet" onClick={()=>setSignup(!signup)}>{signup?"I have an account":"Create an account"}</button></form>}<p role="status">{status}</p></DungeonDialog>
}
