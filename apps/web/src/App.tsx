import { useCallback, useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { DungeonEvents, DungeonLanguage, SkillId } from "@typecade/contracts"
import { bossPassages, bossPassageSources, combatLessons, dungeonBalance, dungeonBiomes, skillRules } from "@typecade/content"
import { SurvivalRun, waveAt } from "@typecade/game-rules"
import { useSurvivalRun } from "./hooks/useSurvivalRun"
import { useCombatLesson } from "./hooks/useCombatLesson"
import { PracticeScreen } from "./practice/PracticeScreen"
import { PracticeKeyboard } from "./practice/PracticeKeyboard"
import { RaceScreen } from "./multiplayer/RaceScreen"
import { TypingInput, TypingPassage } from "./TypingField"
import { CombatFeedback } from "./dungeon/CombatFeedback"
import { TargetLabels } from "./dungeon/TargetLabels"
import { Glyph } from "./dungeon/Glyph"
import { ControlsGuide, HowToPlay, LessonVisual } from "./dungeon/ControlsGuide"
import { PartyLabels } from "./dungeon/PartyLabels"
import { DungeonDialog } from "./dungeon/ui/DungeonDialog"
import { MIX_VERSION, mixLevels } from "./game/audio/mixLevels"
import { TitleScreen } from "./dungeon/TitleScreen"
import { BuildStrip, RunHud } from "./dungeon/RunHud"
import { DefeatDialog, DraftDialog, PauseDialog } from "./dungeon/RunDialogs"
import { Bestiary } from "./dungeon/Bestiary"
import { TypingBar } from "./dungeon/TypingBar"
import { Armory } from "./dungeon/Armory"
import { heroProfileStore, useHeroProfile } from "./profile/heroProfileStore"
import type { HeroLoadout } from "@typecade/contracts"

export { DungeonDialog }
import { partyWorld } from "./dungeon/party-world"
import type { RaceRoomSnapshot } from "@typecade/race-rules"
import { readRunHistory } from "./run-history"
import { readStorage, writeStorage } from "./storage"
import { getAccountClient } from "./account/client"
import { achievementNames, loadDungeonAccount, uploadDungeonCheckpoint } from "./account/dungeon-account"
import type { User } from "@supabase/supabase-js"
type Screen = DungeonEvents["screen"]
interface Settings { reduced: boolean; volume: number; music: number; effects: number; keyboard: boolean; mix: number }
const settingsKey = "typecade:dungeon:settings:v1"
const introKey = "typecade:dungeon:intro-hidden:v1"
/** Saves from the old quiet mix (no `mix` version) are lifted to the new default once; an explicit mute is kept. */
function migratedVolume(saved: { volume?: unknown; mix?: unknown } | null) {
 const volume=typeof saved?.volume==="number"&&saved.volume>=0&&saved.volume<=1?saved.volume:mixLevels.defaultVolume
 return saved?.mix===MIX_VERSION||volume===0?volume:Math.max(volume,mixLevels.defaultVolume)
}
function loadSettings(): Settings {
 try { const s=JSON.parse(readStorage("localStorage",settingsKey)??"null");return {reduced:typeof s?.reduced==="boolean"?s.reduced:matchMedia("(prefers-reduced-motion: reduce)").matches,volume:migratedVolume(s),music:typeof s?.music==="number"&&s.music>=0&&s.music<=1?s.music:.85,effects:typeof s?.effects==="number"&&s.effects>=0&&s.effects<=1?s.effects:1,keyboard:s?.keyboard===true,mix:MIX_VERSION} }
 catch { return {reduced:false,volume:mixLevels.defaultVolume,music:.85,effects:1,keyboard:false,mix:MIX_VERSION} }
}
export const runTime = (seconds:number) => `${Math.floor(seconds/60).toString().padStart(2,"0")}:${Math.floor(seconds%60).toString().padStart(2,"0")}`
export function App() {
 const host=useRef<HTMLDivElement>(null), inputRef=useRef<HTMLInputElement>(null)
 const [screen,setScreen]=useState<Screen>(()=>new URLSearchParams(location.search).has("race")?"multiplayer":"title")
 const [renderer,setRenderer]=useState<"loading"|"ready"|"lost"|"error">("loading")
 const [attempt,setAttempt]=useState(0), [settings,setSettings]=useState(loadSettings)
 const [panel,setPanel]=useState<"settings"|"account"|"history"|"controls"|"howto"|"bestiary"|null>(null)
 const [introHidden,setIntroHidden]=useState(()=>readStorage("localStorage",introKey)==="1")
 const hideIntro=(hidden:boolean)=>{setIntroHidden(hidden);writeStorage("localStorage",introKey,hidden?"1":"0")}
 const [skipIntro,setSkipIntro]=useState(false)
 const [attract]=useState(()=>new SurvivalRun("castle-title"))
 const savedRun=useSurvivalRun(screen==="endless"&&renderer==="ready")
 const [language,setLanguage]=useState<DungeonLanguage>("id")
 const lesson=useCombatLesson(screen==="tutorial",language,savedRun.bridge)
 const run=screen==="tutorial"?{...savedRun,view:lesson.view,input:lesson.input,pause:lesson.pause,resume:lesson.resume}:savedRun
 const {view,bridge,pause}=run
 const [lessonBack,setLessonBack]=useState<"title"|"dojo"|"endless">("title")
 const tutorial=(back:"title"|"dojo"|"endless")=>{setLessonBack(back);setScreen("tutorial")}
 const [stats,setStats]=useState({calls:0,geometries:0,textures:0})
 const active=["endless","tutorial"].includes(screen)&&["arena","skills","draft","overdrive"].includes(view.phase)&&!panel&&renderer==="ready"
 useEffect(()=>{
  let disposed=false, destroy:(()=>void)|undefined
  const unsubscribe=bridge.on("renderer",info=>{setRenderer(info.status);setStats(info)})
  void import("./game/DungeonScene").then(async({DungeonScene})=>{
   if(disposed)return
   const game=new DungeonScene(host.current!,bridge);destroy=()=>game.destroy();await game.ready
  }).catch(()=>{if(!disposed)setRenderer("error")})
  return()=>{disposed=true;unsubscribe();destroy?.()}
 },[bridge,attempt])
 useEffect(()=>{bridge.emit("screen",screen);if(screen!=="endless"&&screen!=="tutorial")bridge.emit("frame",attract.state)},[bridge,screen,attract])
 useEffect(()=>{bridge.emit("settings",settings);writeStorage("localStorage",settingsKey,JSON.stringify(settings))},[bridge,settings])
 useEffect(()=>{if((screen==="endless"||screen==="tutorial")&&renderer!=="ready")pause()},[renderer,screen,pause])
 const leave=()=>{if(screen==="tutorial")setScreen(lessonBack);else{run.pause();setScreen("title")}}
 const fresh=()=>{savedRun.fresh(language);setScreen("endless")}
 const type=(key:string)=>{run.input(key)}
 const castMode=()=>{if(view.phase==="arena")type("Tab");inputRef.current?.focus()}
 const boss=view.enemies.find(e=>e.id===view.boss)
 // Remounting on each boss arrival or duel replays the CSS announcement; it fades out on its own.
 const banner=screen==="endless"&&view.boss!==null?view.phase==="overdrive"?{key:`duel:${view.boss}:${view.paragraph}`,title:"BOSS DUEL",detail:"Type the full passage to finish the boss"}:{key:`boss:${view.boss}`,title:"BOSS INCOMING",detail:"Obsidian Minotaur · break its armor to start the duel"}:surgeBanner(screen==="endless",view.time,view.notice)
 const train=useCallback((correct:number,words:number,errors:number)=>bridge.emit("training",{correct,words,errors}),[bridge])
 const party=useCallback((room:RaceRoomSnapshot|null,own:string|null,casting:boolean)=>bridge.emit("party",partyWorld(room,own,casting)),[bridge])
 const phase=view.phase
 const profile=useHeroProfile()
 const preview=useCallback((loadout:HeroLoadout)=>bridge.emit("appearance",loadout),[bridge])
 useEffect(()=>{bridge.emit("appearance",profile.loadout)},[bridge,profile.loadout])
 // Pay each finished endless run once (keyed by seed); the result screen shows what was earned.
 const [payout,setPayout]=useState<{earned:number;bonus:number}|null>(null)
 useEffect(()=>{if(screen==="endless"&&phase==="dead"){const result=heroProfileStore.payOut(view.seed,view);if(result.earned||result.bonus)queueMicrotask(()=>setPayout({earned:result.earned,bonus:result.bonus}))}else if(phase!=="dead")queueMicrotask(()=>setPayout(null))},[screen,phase,view])
 return <main className={`dungeon-app scene-${screen}`} data-testid="dungeon-shell" data-reduced-effects={settings.reduced}>
  <div className="dungeon-canvas" ref={host} data-testid="dungeon-canvas" data-renderer-state={renderer} data-draw-calls={stats.calls} data-geometries={stats.geometries} data-textures={stats.textures}/>
  <div className="scene-shade" aria-hidden="true"/>
  {screen==="title"&&<TitleScreen language={language} onLanguage={setLanguage} onStart={fresh} onContinue={view.time>0&&phase!=="dead"?()=>setScreen("endless"):null} continueLabel={`LV ${view.level} · ${runTime(view.time)}`} onDojo={()=>setScreen("dojo")} onMultiplayer={()=>setScreen("multiplayer")} onTutorial={()=>tutorial("title")} onPanel={setPanel} onArmory={()=>setScreen("armory")} coins={profile.coins} bestTime={runTime(run.best)} soundOn={settings.volume>0} onToggleSound={()=>setSettings({...settings,volume:settings.volume?0:mixLevels.defaultVolume})}/>}
  {(screen==="endless"||screen==="tutorial")&&<>
   <RunHud view={view} onPause={run.pause}/>
   <BuildStrip view={view}/>
   {screen==="tutorial"&&<section className="lesson-panel pixel-panel" aria-label="Combat tutorial"><header><span>SAFE TRAINING · {lesson.step+1}/{combatLessons.length}</span><button onClick={leave}>Skip tutorial</button></header><h2>{lesson.lesson.title}</h2><LessonVisual kind={lesson.lesson.id} language={language}/><p>{lesson.complete?lesson.lesson.success:lesson.lesson.help.replace("HEAL",skillRules.heal[language]).replace("STORM",skillRules.storm[language])}</p>{lesson.complete&&(lesson.step<combatLessons.length-1?<button className="primary-action" onClick={()=>{lesson.next();inputRef.current?.focus()}}>Next lesson · Enter</button>:<button className="primary-action" onClick={leave}>Finish tutorial</button>)}</section>}
   <CombatFeedback view={view} bridge={bridge}/>
   {view.effects.filter(fx=>fx.kind==="hit"&&fx.value<0).slice(-1).map(fx=><div key={fx.id} className="damage-response" aria-hidden="true"><span>-{Math.abs(fx.value)} HP</span></div>)}
   <div className="depth-weather" aria-hidden="true">{dungeonBiomes[view.biome%dungeonBiomes.length]!.name}</div>
   {banner&&<div key={banner.key} className="boss-banner" role="status"><strong>{banner.title}</strong><span>{banner.detail}</span></div>}
   {boss&&<div className="boss-hud"><strong>OBSIDIAN MINOTAUR</strong><progress max={boss.maxHealth} value={Math.max(0,boss.health)} aria-label="Boss health"/><small>{phase==="overdrive"?`COMBO ${view.cursor}/${view.paragraph.length} · ${boss.motion==="windup"?"HAMMER WINDUP":view.bossArena?.rage?"BOSS RUSH":"KEEP YOUR DISTANCE"}`:`ARMOR ×${boss.words.length}${view.pendingDrafts?" · UPGRADES BANKED":""}`}</small></div>}
   {["arena","skills"].includes(phase)&&<TargetLabels view={view} bridge={bridge} tutorial={screen==="tutorial"}/>}
   {active&&phase!=="draft"&&<div className="run-input-owner" onKeyDownCapture={e=>{if(e.key==="Tab"&&!e.shiftKey&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&["arena","skills"].includes(phase)){e.preventDefault();e.stopPropagation();if(!e.repeat)type("Tab")}}}><TypingInput inputRef={inputRef} label="Dungeon typing input" testId="dungeon-input" onType={type} onEscape={()=>type("Escape")} inputMode={settings.keyboard?"none":undefined}/></div>}
   {["arena","skills"].includes(phase)&&<footer className={`skill-dock ${phase==="skills"?"casting":""}`}>
    <TypingBar view={view}/>
    <button type="button" className="skill-key-hint" onClick={()=>{type("Tab");inputRef.current?.focus()}} aria-label={phase==="skills"?"Press Tab to go back":"Press Tab to use skills"}><kbd>TAB</kbd><span>{phase==="skills"?"Back":"Skills"}</span></button>
    <p className="skill-mode-hint">{phase==="skills"?"Time slowed · type a skill name":view.queue.length===0?screen==="tutorial"?"Follow the lesson":"More enemies incoming":"Type an enemy's word to attack"}</p>
    <div className="skill-cards">{(["cleave","storm","heal"] as SkillId[]).map((id,i)=>{
     const skill=view.skills[id], rules=skillRules[id], word=rules[view.language], typed=phase==="skills"&&word.startsWith(view.command)?view.command.length:0
     const cost=Math.max(10,rules.cost-(skill.level-1)*5), blocked=skill.cooldown>0||view.player.mana<cost||id==="heal"&&view.player.hp===view.player.maxHp
     return <button key={id} className={`skill-card skill-${id} ${blocked?"unavailable":""}`} style={{"--skill-color":["#edaa58","#64cfe9","#9bdb7a"][i]} as CSSProperties} onClick={castMode} aria-label={`${word} skill`} title={`${rules.description} Costs ${cost} mana. Cooldown: ${rules.words} completed words.`}><Glyph name={id==="cleave"?"sword":id==="storm"?"storm":"heal"}/><span><strong><b>{word.slice(0,typed)}</b>{word.slice(typed)}</strong><small>{skill.cooldown?`${skill.cooldown}w COOLDOWN`:`${cost} MP · LV ${skill.level}`}</small></span><i>{blocked?"LOCKED":skill.level===3?"EVO":"READY"}</i></button>
    })}</div>
    <p className="run-notice" role="status">{view.notice}</p>
   </footer>}
   {phase==="overdrive"&&<section className="boss-overdrive pixel-panel"><header><strong>BREAK COMBO · FINISH THE LINE</strong><span>{view.bossArena?.hp?`BARRICADE ${view.bossArena.hp}/${dungeonBalance.barrierHp}`:"HORDE CAN REACH YOU"} · {view.cursor}/{view.paragraph.length}</span></header><p className="boss-instruction">Steady typing holds the boss back; pausing lets it close in and typos make it rush. Finish words to sidestep and guard; the horde is attacking your barricade.</p>{view.bossArena&&<div className={`barricade-status ${view.bossArena.hp===0?"breached":""}`}><Glyph name="shield"/><span>{view.bossArena.hp>0?"BARRICADE · HOLD THE LINE":"BREACHED · THE HORDE IS INSIDE"}</span><progress aria-label="Barricade health" max={dungeonBalance.barrierHp} value={view.bossArena.hp}/><strong>{view.bossArena.hp}/{dungeonBalance.barrierHp}</strong></div>}<TypingPassage text={view.paragraph} cursor={view.cursor} rollingLines={2} className="boss-passage" testId="boss-passage" fontSize={24} monospace/>{quoteSource(view.language,view.paragraph)&&<small className="boss-source">— {quoteSource(view.language,view.paragraph)}</small>}</section>}
   {settings.keyboard&&active&&phase!=="draft"&&<div className="combat-keyboard"><PracticeKeyboard onKey={key=>{type(key);inputRef.current?.focus()}}/><button onClick={castMode}>Tab · Skills</button></div>}
   {phase==="ready"&&!panel&&renderer==="ready"&&screen==="endless"&&!introHidden&&<DungeonDialog title="How to play" className="howto-dialog" onCancel={leave}><span className="eyebrow">QUICK GUIDE</span><HowToPlay language={view.language}/><label className="intro-optout"><input type="checkbox" checked={skipIntro} onChange={e=>setSkipIntro(e.target.checked)}/><span>Do not show this before runs<small>You can reopen it from the ready screen.</small></span></label><button className="primary-action" autoFocus onClick={()=>{if(skipIntro)hideIntro(true);else setIntroHidden(true);run.start()}}>Begin run</button><button onClick={()=>{if(skipIntro)hideIntro(true);else setIntroHidden(true);tutorial("endless")}}>Play the interactive tutorial</button><div className="dialog-links"><button className="quiet" onClick={()=>setPanel("controls")}>Keyboard controls</button><button className="quiet" onClick={leave}>Back to title</button></div></DungeonDialog>}
   {phase==="ready"&&!panel&&renderer==="ready"&&(screen!=="endless"||introHidden)&&<DungeonDialog title="Ready" className="ready-dialog" onCancel={leave}><span className="eyebrow">ENDLESS SURVIVAL · {view.language.toUpperCase()}</span><p>Type the word above an enemy to dash and hit it. Level up, pick upgrades and see how long you last.</p><ul className="control-list"><li><kbd>TYPE</kbd><span>Match the displayed case. Finish a word to strike.</span></li><li><kbd>BACKSPACE</kbd><span>Erase the last letter.</span></li><li><kbd>TAB</kbd><span>Slow time and type a skill.</span></li><li><kbd>ESC</kbd><span>Pause safely.</span></li></ul><button className="primary-action" autoFocus onClick={run.start}>Begin run</button><button onClick={()=>tutorial("endless")}>Try combat tutorial</button><div className="dialog-links"><button className="quiet" onClick={()=>setPanel("howto")}>How to play</button><button className="quiet" onClick={()=>setPanel("controls")}>Keyboard controls</button><button className="quiet" onClick={leave}>Back to title</button></div></DungeonDialog>}
   {phase==="paused"&&!panel&&renderer==="ready"&&<PauseDialog view={view} leaveLabel={screen==="tutorial"?"Exit tutorial":"Save and return to title"} onResume={run.resume} onSettings={()=>setPanel("settings")} onControls={()=>setPanel("controls")} onLeave={leave}/>}
   {phase==="draft"&&!panel&&renderer==="ready"&&<DraftDialog view={view} onPause={run.pause} input={<TypingInput inputRef={inputRef} label="Upgrade typing input" onType={type} onEscape={run.pause}/>}/>}
   {phase==="dead"&&!panel&&<DefeatDialog view={view} best={run.best} payout={payout} wallet={profile.coins} onRetry={fresh} onLeave={leave}/>}
   {renderer!=="ready"&&<DungeonDialog title={renderer==="loading"?"Loading…":"Graphics paused"} onCancel={leave}><p role="status">{renderer==="loading"?"Loading the dungeon. The run timer is stopped.":"Your run is paused and saved. Restore the scene to continue."}</p>{renderer!=="loading"&&<button className="primary-action" onClick={()=>{setRenderer("loading");setAttempt(n=>n+1)}}>Restore scene</button>}<button onClick={leave}>Return to title</button></DungeonDialog>}
  </>}
  {screen==="armory"&&<Armory onPreview={preview} onClose={()=>setScreen("title")}/>}
  {screen==="dojo"&&<PracticeScreen onBack={()=>setScreen("title")} onActivity={train} onTutorial={()=>tutorial("dojo")}/>}
  {screen==="multiplayer"&&<><PartyLabels bridge={bridge}/><RaceScreen onWorld={party} onBack={()=>{history.replaceState(null,"",location.pathname);setScreen("title")}}/></>}
  {panel==="history"&&<DungeonDialog title="Run history" onCancel={()=>setPanel(null)} className="history-dialog" tone="info"><p>Your last 50 runs on this browser. Saved runs update when you resume them.</p><div className="history-list">{readRunHistory().length?readRunHistory().map(r=><article key={r.id}><header><strong>{r.mode.toUpperCase()} · LV {r.level}</strong><span>{r.status.toUpperCase()} · {r.language.toUpperCase()}</span></header><p>{new Date(r.at).toLocaleString()} · {runTime(r.seconds)}</p><div><b>{r.kills} defeated</b><span>{r.wpm} WPM · {r.accuracy}% ACC · {r.gold}g</span></div></article>):<p>No runs yet. Enter the keep to begin your first record.</p>}</div><button onClick={()=>setPanel(null)}>Back to game</button></DungeonDialog>}
  {panel==="settings"&&<DungeonDialog title="Settings" onCancel={()=>setPanel(null)} tone="info" className="settings-dialog"><label className="settings-row"><span>Reduced Effects<small>Less ambient motion, no outline pass or particles.</small></span><input aria-label="Reduced Effects" type="checkbox" checked={settings.reduced} onChange={e=>setSettings({...settings,reduced:e.target.checked})}/></label><label className="settings-row"><span>Master volume<small>Music starts after your first click or key press.</small></span><input aria-label="Sound volume" type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e=>setSettings({...settings,volume:Number(e.target.value)})}/></label>{(["music","effects"] as const).map(bus=><label className="settings-row" key={bus}><span>{bus==="music"?"Music & ambience":"Sound effects"}<small>{bus==="music"?"Background music; changes with depth and boss fights.":"Hits, enemy sounds, pickups and the low-health warning."}</small></span><input aria-label={bus==="music"?"Music volume":"Effects volume"} type="range" min="0" max="1" step="0.05" value={settings[bus]} onChange={e=>setSettings({...settings,[bus]:Number(e.target.value)})}/></label>)}<label className="settings-row"><span>On-screen keyboard<small>Optional touch input; physical keys remain active.</small></span><input aria-label="On-screen keyboard" type="checkbox" checked={settings.keyboard} onChange={e=>setSettings({...settings,keyboard:e.target.checked})}/></label><button className="primary-action" onClick={()=>setPanel(null)}>Done</button></DungeonDialog>}
  {panel==="controls"&&<DungeonDialog title="Keyboard controls" className="controls-dialog" tone="info" onCancel={()=>setPanel(null)}><span className="eyebrow">EVERYTHING WORKS FROM THE KEYBOARD</span><ControlsGuide language={screen==="title"?language:view.language}/><button className="primary-action" onClick={()=>setPanel(null)}>Done</button></DungeonDialog>}
  {panel==="howto"&&<DungeonDialog title="How to play" className="howto-dialog" onCancel={()=>setPanel(null)}><span className="eyebrow">THE FOUR KEYS YOU NEED</span><HowToPlay language={view.language}/><label className="intro-optout"><input type="checkbox" checked={!introHidden} onChange={e=>hideIntro(!e.target.checked)}/><span>Show this before every run</span></label><button className="primary-action" onClick={()=>setPanel(null)}>Done</button></DungeonDialog>}
  {panel==="bestiary"&&<Bestiary onClose={()=>setPanel(null)}/>}
  {panel==="account"&&<AccountPanel onClose={()=>setPanel(null)} checkpoint={run.checkpoint} onRestore={run.restore}/>}
 </main>
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

/** Announces each wave surge once (keyed by cycle); the pack name comes from the simulation's notice. */
function surgeBanner(endless: boolean, time: number, notice: string) {
 const wave=waveAt(time)
 if(!endless||wave.phase!=="surge")return null
 return {key:`surge:${wave.cycle}`,title:"SURGE",detail:notice.startsWith("SURGE")?notice.replace(/^SURGE — /,""):"The horde surges · hold the line"}
}

/** Attribution for the current boss line, when it is one of the authored quotations. */
function quoteSource(language: DungeonLanguage, paragraph: string) {
 const index=bossPassages[language].findIndex(line=>line.split(" BLIZZARD")[0]+" BLIZZARD"===paragraph)
 return index<0?"":bossPassageSources[language][index]!
}
