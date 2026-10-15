import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactElement, ReactNode } from "react"
import type { AccountLevelProgress, CatchResult, FishingSkill, Rarity } from "@typecade/contracts"
import { fishSpecies, fishingSkills, getRouteNodesForZone, shallowCoastZoneOrder } from "@typecade/content"
import { getFishingSkillBlockReason, getAccountLevelProgress, getFishingSkillCost, getFishingSkillUnlockLevel, getAdventureCondition, getEncounterIndexInRun } from "@typecade/game-rules"
import { useOceanRun, type OceanRunView, type OceanUiFeedback, type VolumeState } from "./hooks/useOceanRun"
import { RaceScreen } from "./multiplayer/RaceScreen"
import { PracticeScreen } from "./practice/PracticeScreen"
import { PracticeKeyboard } from "./practice/PracticeKeyboard"
import { TypingInput, TypingPassage } from "./TypingField"
import { oceanAchievements } from "./account/ocean-account"
import type { OceanAccountState } from "./account/useOceanAccount"
import { FishArtwork, PixelIcon, LogoMark } from "./PixelArt"
import { shoalLayout } from "./game/ocean-motion"
import type { FishingTextMode } from "@typecade/game-rules"
type Panel = "fish" | "collection" | "tasks" | "shop" | "settings" | null
type Screen = "menu" | "practice" | "prep" | "game" | "race"
export function handleAccountCloseKey(key: string, onClose: () => void): void {
	if (key === "Escape") onClose()
}
const rarityStars: Record<Rarity, number> = {
	common: 1,
	uncommon: 2,
	rare: 3,
	boss: 5,
}
export function App() {
	const hostRef = useRef<HTMLDivElement | null>(null)
	const [screen, setScreen] = useState<Screen>(() => new URLSearchParams(location.search).has("race") ? "race" : "menu")
	const [panel, setPanel] = useState<Panel>(null)
	const [accountOpen, setAccountOpen] = useState(false)
	const [rendererState, setRendererState] = useState<"loading" | "ready" | "error">("loading")
	const [rendererAttempt, setRendererAttempt] = useState(0)
	const {
		bridge,
		account,
		view,
		activeSkills,
		skillOffers,
		chooseRoute,
		chooseTarget,
		setSkillLoadout,
		useSkill,
		setVolume,
		setReducedMotion,
		continueVoyage,
		startFreshRun,
		togglePause,
		typeKey,
	} = useOceanRun(screen === "game" && panel === null && rendererState === "ready")
	const visualScreen = screen === "game" && view.isRefitting ? "prep" : screen
	const rendererEnabled = screen !== "race" && screen !== "practice"
	const levelProgress = getAccountLevelProgress(view.collection.xp)
	useEffect(() => {
		if (!hostRef.current || !rendererEnabled) {
			return
		}
		const host = hostRef.current
		let disposed = false
		let destroyGame: (() => void) | undefined
		const fail = () => { if (!disposed) setRendererState("error") }
		host.addEventListener("renderer:error", fail)
		void import("./game/createFishingGame").then(async ({ createFishingGame }) => {
			if (disposed) {
				return
			}
			const game = createFishingGame(host, bridge)
			setRendererState("loading")
			destroyGame = () => game.destroy()
			await game.ready
			if (!disposed) setRendererState("ready")
		}).catch(fail)
		return () => {
			disposed = true
			host.removeEventListener("renderer:error", fail)
			destroyGame?.()
		}
	}, [bridge, rendererEnabled, rendererAttempt])
	useEffect(() => {
		bridge.emit("screen:changed", { screen: visualScreen })
	}, [visualScreen, bridge])
	const caughtCount = Object.keys(view.collection.records).length
	const totalCount = fishSpecies.length
	const beginRun = () => {
		startFreshRun()
		setPanel(null)
		setScreen("game")
	}
	return (
		<main className={`game-shell screen-${visualScreen}`} data-testid="ocean-game-shell" data-reduced-effects={view.reducedMotion}>
			<div ref={hostRef} className="game-canvas" data-testid="three-gameplay" data-renderer-state={rendererState} />
			{visualScreen === "game" && rendererState !== "ready" ? (
				<div className="renderer-status" role="status">
					<p>{rendererState === "error" ? "The ocean could not load. Your voyage is paused." : "Preparing the ocean…"}</p>
					{rendererState === "error" ? <button onClick={() => { setRendererState("loading"); setRendererAttempt(attempt => attempt + 1) }}>Retry</button> : null}
					<button className="secondary-action" onClick={() => setScreen("menu")}>Main Menu</button>
				</div>
			) : null}
			{visualScreen === "game" ? (
				<div inert={rendererState !== "ready"}><GameHud
					view={view}
					activeSkills={activeSkills}
					levelProgress={levelProgress}
					caughtCount={caughtCount}
					totalCount={totalCount}
					panel={panel}
					setPanel={setPanel}
					chooseRoute={chooseRoute}
					chooseTarget={chooseTarget}
					useSkill={useSkill}
					setVolume={setVolume}
					setReducedMotion={setReducedMotion}
					startFreshRun={beginRun}
					togglePause={togglePause}
					typeKey={typeKey}
					goToMenu={() => setScreen("menu")}
				/></div>
			) : null}
			{screen === "menu" ? (
				<MainMenu
					view={view}
					onStart={() => setScreen("practice")}
					onAdventure={() => setScreen(!view.isRefitting && !view.expedition.complete && (view.cursor > 0 || getEncounterIndexInRun(view.expedition) > 0) ? "game" : "prep")}
					onRankedDuel={() => setScreen("race")}
					onCollection={() => setPanel("collection")}
					onSettings={() => setPanel("settings")}
					onAccount={() => setAccountOpen(true)}
				/>
			) : null}
			{visualScreen === "prep" ? (
				<PreparationScreen
					view={view}
					skillOffers={skillOffers}
					levelProgress={levelProgress}
					onBack={() => setScreen("menu")}
					onStart={view.isRefitting ? () => { continueVoyage(); setScreen("game") } : beginRun}
					onChooseRoute={chooseRoute}
					onSetSkillLoadout={setSkillLoadout}
				/>
			) : null}
			{screen === "practice" ? <PracticeScreen onBack={() => setScreen("menu")} /> : null}
			{screen === "race" ? <RaceScreen onBack={() => { history.replaceState(null, "", location.pathname); setScreen("menu") }} /> : null}
			{screen !== "game" && panel === "collection" ? <CollectionPanel onClose={() => setPanel(null)} collection={view.collection} /> : null}
			{screen !== "game" && panel === "settings" ? (
				<SettingsPanel
					volumes={view.volumes}
					reducedMotion={view.reducedMotion}
					setVolume={setVolume}
					setReducedMotion={setReducedMotion}
					onClose={() => setPanel(null)}
				/>
			) : null}
			{screen !== "game" && accountOpen ? <CaptainAccountPanel account={account} onClose={() => setAccountOpen(false)} /> : null}
		</main>
	)
}
function CaptainAccountPanel({ account, onClose }: { account: OceanAccountState; onClose: () => void }) {
	const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [name, setName] = useState("")
	const unlocked = new Set(account.achievements.map(item => item.achievement_id))
	const submit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (mode === "sign-in") await account.signIn(email, password)
		else await account.signUp(email, password, name)
	}
	return <div className="captain-account-overlay" role="presentation" onKeyDown={event => handleAccountCloseKey(event.key, onClose)} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
		<section className="captain-account-panel pixel-panel" role="dialog" aria-modal="true" aria-labelledby="captain-account-title">
			<header><div><small>TYPECADE ACCOUNT</small><h2 id="captain-account-title">Captain Ledger</h2></div><button className="account-close" aria-label="Close captain account" autoFocus onClick={onClose}>×</button></header>
			{account.user ? <div className="captain-account-session"><span>Signed in as <strong>{account.user.email ?? "Ocean Captain"}</strong></span><button onClick={() => void account.signOut()}>Sign out</button></div> : <form className="captain-account-form" onSubmit={event => void submit(event)}>
				{mode === "sign-up" ? <label>Display name<input aria-label="Display name" autoComplete="nickname" value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={24} required /></label> : null}
				<label>Email<input aria-label="Email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
				<label>Password<input aria-label="Password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} minLength={mode === "sign-up" ? 8 : undefined} required /></label>
				<div className="captain-account-actions"><button className="primary-action" type="submit" disabled={account.loading || !account.client}>{account.loading ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button><button type="button" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>{mode === "sign-in" ? "Create account" : "I have an account"}</button></div>
			</form>}
			<p className="captain-account-status" role="status">{account.status || (account.user ? "Your Adventure save and achievements sync after each catch." : "Sign in to sync Adventure and unlock account achievements.")}</p>
			<div className="captain-account-columns"><section><h3>Adventure leaderboard</h3><ol>{account.leaderboard.length ? account.leaderboard.map((captain, index) => <li key={captain.user_id}><span>{index + 1}. {captain.display_name}</span><strong>{captain.xp} XP</strong></li>) : <li className="account-empty">No captains ranked yet.</li>}</ol><small>Ranks use saved Adventure XP.</small></section><section><h3>Achievements</h3><ul>{oceanAchievements.map(item => <li key={item.id} className={unlocked.has(item.id) ? "unlocked" : "locked"}><span aria-hidden="true">{unlocked.has(item.id) ? "✓" : "·"}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div></li>)}</ul></section></div>
		</section>
	</div>
}
function GameHud({
	view,
	activeSkills,
	levelProgress,
	caughtCount,
	totalCount,
	panel,
	setPanel,
	chooseRoute,
	chooseTarget,
	useSkill: activateSkill,
	setVolume,
	setReducedMotion,
	startFreshRun,
	togglePause,
	typeKey,
	goToMenu,
}: {
	view: OceanRunView
	activeSkills: readonly FishingSkill[]
	levelProgress: AccountLevelProgress
	caughtCount: number
	totalCount: number
	panel: Panel
	setPanel: (panel: Panel) => void
	chooseTarget: (fishId: string, mode?: FishingTextMode) => void
	chooseRoute: (nodeId: string) => void
	useSkill: (skillId: string) => boolean
	setVolume: (category: keyof VolumeState, value: number) => void
	setReducedMotion: (value: boolean) => void
	startFreshRun: () => void
	togglePause: () => void
	typeKey: (key: string) => void
	goToMenu: () => void
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const typingInputRef = useRef<HTMLInputElement>(null)
	const condition = getAdventureCondition(view.expedition)
	const timeLeft = formatTime(view.encounter.timeRemainingMs)
	const tensionPercent = Math.round(view.encounter.tension)
	const progressPercent = Math.floor(view.encounter.progress * 100)
	const durabilityPercent = Math.round(view.encounter.durability)
	const routeProgress = `${view.expedition.currentZoneIndex + 1}/3`
	const encounterLabel = `${getEncounterNumber(view.expedition.currentZoneIndex, view.expedition.currentEncounterIndex)}/10`
	const bossPhaseDetails = [
		{ title: "Crown Wake", detail: "Keep your rhythm. Finish every character.", compact: "Finish every character" },
		{ title: "Crown Guard", detail: "Three perfect words break the guard.", compact: "Clean words break guard" },
		{ title: "Final Pull", detail: "Every third perfect word: -8 tension.", compact: "Every third clean word: -8 tension" },
	] as const
	const bossPhaseDetail = bossPhaseDetails[view.encounter.bossPhase - 1]
	return (
		<div className="hud" data-testid="ocean-hud" data-reduced-effects={view.reducedMotion} ref={containerRef}>
			<TopBar
				view={view}
				levelProgress={levelProgress}
				onSettings={() => setPanel(panel === "settings" ? null : "settings")}
				onPause={() => {
					setPanel(null)
					togglePause()
				}}
			/>
			<nav className="icon-rail panel-chrome" aria-label="Ocean navigation">
				<RailButton label="Fish" active={panel === "fish"} onClick={() => setPanel(panel === "fish" ? null : "fish")} icon={<PixelIcon file="icon_nav_fish" />} />
				<RailButton label="Collection" active={panel === "collection"} onClick={() => setPanel(panel === "collection" ? null : "collection")} icon={<PixelIcon file="icon_nav_collection" />} badge={caughtCount} />
				<RailButton label="Route" active={panel === "tasks"} onClick={() => setPanel(panel === "tasks" ? null : "tasks")} icon={<PixelIcon file="icon_nav_tasks" />} badge={view.expedition.spareLines} />
				<RailButton label="Skills" active={panel === "shop"} onClick={() => setPanel(panel === "shop" ? null : "shop")} icon={<PixelIcon file="icon_nav_shop" />} />
			</nav>
			<section className="route-strip panel-chrome" data-testid="route-strip">
				<strong>Voyage {view.expedition.voyage} · Zone {routeProgress}</strong>
				<span>{view.selectedRoute.name}</span>
				<span>Encounter {encounterLabel}</span>
			</section>
			<ShoalPicker view={view} chooseTarget={fishId => { chooseTarget(fishId); typingInputRef.current?.focus() }} />
			<div className="catch-title"><small>{view.fish.rarity.toUpperCase()} · {view.typingMode.toUpperCase()}</small><strong>{view.fish.name}</strong></div>
			<div className="encounter-stage">
			{view.fish.id === "crown_leviathan" && bossPhaseDetail && !view.lastResult ? (
				<section className="boss-phase-callout panel-chrome" aria-live="polite" data-testid="boss-phase-callout">
					<div>
						<span>LEVIATHAN · PHASE {view.encounter.bossPhase}</span>
						<strong>{bossPhaseDetail.title}</strong>
						<p>{bossPhaseDetail.detail}</p>
					</div>
					{view.encounter.bossPhase === 2 ? (
						<div className="boss-guard-pips" aria-label={`${view.encounter.bossGuard} guard points remain`}>
							{[0, 1, 2].map((pip) => <i key={pip} className={pip < view.encounter.bossGuard ? "active" : ""} />)}
						</div>
					) : null}
				</section>
			) : null}
			{!view.lastResult && view.feedback?.kind === "skill" ? <FeedbackBanner key={view.feedback.id} feedback={view.feedback} reducedMotion={view.reducedMotion} /> : null}
			{view.lastResult ? <ResultToast view={view} result={view.lastResult} /> : null}
			{view.expedition.complete ? (
				<section className="complete-panel panel-chrome" data-testid="complete-panel">
					<PixelIcon file="icon_nav_collection" />
					<strong>Expedition ended</strong>
					<span>{caughtCount}/{totalCount} species recorded · Rewards and XP saved</span>
					<button onClick={startFreshRun}>Sail Again</button>
					<button className="secondary" onClick={goToMenu}>Main Menu</button>
				</section>
			) : null}
			</div>
			<section className="bottom-console" data-testid="typing-console">
				<div className={`tension-wrap ${tensionPercent >= 82 ? "danger" : ""}`}>
					<PixelIcon file="icon_meter_anchor" className="meter-icon" />
					<div className="meter-block">
						<div className="meter-label">
							<span>LINE TENSION</span>
							<strong>{tensionPercent}%</strong>
						</div>
						<div className="meter-track" data-testid="tension-meter">
							<div className="meter-fill tension" style={{ width: `${tensionPercent}%` }} />
						</div>
					</div>
				</div>
				<div className="typing-panel panel-chrome" data-text-mode={view.typingMode} onClick={event => { if (!(event.target as HTMLElement).closest("label")) typingInputRef.current?.focus() }}>
					<div className="typing-mode"><label>Text <select aria-label="Adventure text format" value={view.typingMode} disabled={view.cursor > 0 || view.metrics.incorrectKeystrokes > 0 || view.fish.rarity === "boss" || view.encounter.status !== "active"} onChange={event => { chooseTarget(view.fish.id, event.target.value as FishingTextMode); typingInputRef.current?.focus() }}><option value="word">Word</option><option value="sentence">Sentence</option><option value="passage">Passage</option></select></label><span>{view.fish.rarity === "boss" ? "Boss · full passage" : view.cursor > 0 ? "Target locked until next catch" : "Choose a fish, then type"}</span></div>
					<div className="adventure-target-label">
						<strong>{view.fish.name} · {view.fish.rarity} ({rarityStars[view.fish.rarity]}*)</strong>
						<span title={condition.description}>{condition.name}</span>
					</div>
					<div className="typing-help">
						<span>{view.metrics.correctKeystrokes + view.metrics.incorrectKeystrokes === 0 ? "Type here to start · Finish every character" : "Type to reel · Retype wrong keys"}</span>
						{view.fish.id === "crown_leviathan" && bossPhaseDetail ? <span className="boss-phase-inline" data-testid="boss-phase-inline" aria-live="polite">P{view.encounter.bossPhase} · {bossPhaseDetail.compact}{view.encounter.bossPhase === 2 ? ` (${view.encounter.bossGuard} left)` : ""}</span> : null}
						<kbd>Esc pause</kbd>
					</div>
					<TypingPassage text={view.targetText} cursor={view.cursor} className="typing-target" testId="typing-target" mistake={view.lastKeyWasTypo} rollingLines={2} />
					<TypingInput inputRef={typingInputRef} label="Adventure typing input" testId="typing-input" inputMode="none" onType={typeKey} onEscape={togglePause} disabled={view.isPaused || panel !== null || view.encounter.status !== "active"} />
				</div>
				<div className="stat-row panel-chrome">
				<Stat icon={<PixelIcon file="icon_stat_combo" />} label="COMBO" value={`x${view.encounter.combo}`} hot={view.encounter.combo >= 5} />
				<Stat icon={<PixelIcon file="icon_stat_accuracy" />} label="ACCURACY" value={`${Math.round(view.metrics.accuracy)}%`} hot={view.metrics.accuracy >= 95} />
				<Stat icon={<PixelIcon file="icon_stat_timer" />} label="TIME LEFT" value={timeLeft} hot={view.encounter.timeRemainingMs < 12000} />
				</div>
				<div className="progress-stack">
					<SmallMeter label="REEL" value={progressPercent} />
					<SmallMeter label="LINE" value={durabilityPercent} danger={durabilityPercent < 35} />
				</div>
				<PracticeKeyboard expectedKey={view.targetText[view.cursor]} onKey={(key) => { typingInputRef.current!.focus(); typeKey(key) }} />
			</section>
			<section className="skill-dock panel-chrome" data-testid="skill-dock">
				<div className="skill-dock-help"><strong>Energy {Math.round(view.encounter.skillEnergy)}/100</strong><span>Perfect word +14 · Click skill / Alt + slot</span></div>
				{activeSkills.map((skill, index) => (
					<SkillButton
						key={skill.id}
						skill={skill}
						index={index + 1}
						encounter={view.encounter}
						activePulse={view.lastSkillId === skill.id}
						onUse={(skillId) => { const used = activateSkill(skillId); typingInputRef.current?.focus(); return used }}
					/>
				))}
			</section>
			{view.isPaused ? <PausePanel onResume={togglePause} onMainMenu={goToMenu} /> : null}
			{panel === "collection" ? <CollectionPanel onClose={() => setPanel(null)} collection={view.collection} /> : null}
			{panel === "tasks" ? (
				<RoutePanel
					onClose={() => setPanel(null)}
					choices={view.routeChoices}
					selectedId={view.selectedRoute.id}
					chooseRoute={chooseRoute}
					log={view.log}
					sonarRevealed={view.sonarRevealed}
					locked={view.metrics.correctKeystrokes + view.metrics.incorrectKeystrokes > 0}
				/>
			) : null}
			{panel === "shop" ? <SkillsPanel onClose={() => setPanel(null)} skills={activeSkills} energy={view.encounter.skillEnergy} /> : null}
			{panel === "settings" ? (
				<SettingsPanel
					volumes={view.volumes}
					reducedMotion={view.reducedMotion}
					setVolume={setVolume}
					setReducedMotion={setReducedMotion}
					onClose={() => setPanel(null)}
				/>
			) : null}
			{panel === "fish" ? <FishPanel onClose={() => setPanel(null)} fish={view.fish} record={view.collection.records[view.fish.id]} /> : null}
		</div>
	)
}
function TopBar({ view, levelProgress, onSettings, onPause }: { view: OceanRunView; levelProgress: AccountLevelProgress; onSettings: () => void; onPause: () => void }) {
	return (
		<header className="topbar" data-testid="topbar">
			<section className="player-badge panel-chrome">
				<div className="avatar">
					<PixelIcon file="icon_nav_fish" />
				</div>
				<div>
					<strong>WaveRider</strong>
					<span>
						<PixelIcon file="icon_stat_combo" /> Lv {levelProgress.level}
					</span>
					<XpBar progress={levelProgress.progress} />
				</div>
			</section>
			<LogoMark />
			<section className="currency-row">
				<div className="currency-pill panel-chrome">
					<PixelIcon file="icon_currency_coin" />
					<span>{view.collection.coins.toLocaleString()}</span>
				</div>
				<div className="currency-pill panel-chrome">
					<PixelIcon file="icon_currency_gem" />
					<span>{view.collection.materials.toLocaleString()}</span>
				</div>
				<button className="icon-button panel-chrome" aria-label={view.isPaused ? "Resume game" : "Pause game"} onClick={onPause} disabled={view.expedition.complete}>
					<span aria-hidden="true">{view.isPaused ? "▶" : "Ⅱ"}</span>
				</button>
				<button className="icon-button panel-chrome" aria-label="Settings" onClick={onSettings}>
					<PixelIcon file="icon_utility_settings" />
				</button>
			</section>
		</header>
	)
}
function MainMenu({
	view,
	onStart,
	onAdventure,
	onRankedDuel,
	onCollection,
	onSettings,
	onAccount,
}: {
	view: OceanRunView
	onStart: () => void
	onAdventure: () => void
	onRankedDuel: () => void
	onCollection: () => void
	onSettings: () => void
	onAccount: () => void
}) {
	const containerRef = useRef<HTMLElement>(null)
	const menuItems = [
		{ label: "Adventure", icon: "icon_nav_tasks", onClick: onAdventure, primary: true },
		{ label: "Multiplayer", icon: "icon_stat_combo", onClick: onRankedDuel },
		{ label: "Practice", icon: "icon_nav_fish", onClick: onStart },
		{ label: "Collection", icon: "icon_nav_collection", onClick: onCollection },
		{ label: "Settings", icon: "icon_utility_settings", onClick: onSettings },
	]
	return (
		<section className="menu-layer" data-testid="main-menu" ref={containerRef}>
			<div className="mainmenu-center">
				<LogoMark large />
				<p className="menu-caption">A sunset sea. An endless voyage.</p>
				<nav className="mainmenu-stack" aria-label="Main menu">
					{menuItems.map((item) => (
						<button key={item.label} className={`mainmenu-button ${item.primary ? "primary" : ""}`} onClick={item.onClick} aria-label={item.label}>
							<span className="mainmenu-button-label"><PixelIcon file={item.icon} />{item.label}</span>
						</button>
					))}
				</nav>
				<aside className="menu-progress panel-chrome" aria-label="Captain progress"><strong>Captain Lv {getAccountLevelProgress(view.collection.xp).level}</strong><XpBar progress={getAccountLevelProgress(view.collection.xp).progress} /><span>{getAccountLevelProgress(view.collection.xp).nextLevelXp - view.collection.xp} XP to next level · {Object.keys(view.collection.records).length}/{fishSpecies.length} fish discovered</span><button className="account-open-button" onClick={onAccount}>{"Captain Account"}</button></aside>
			</div>
		</section>
	)
}
function PreparationScreen({
	view,
	skillOffers,
	levelProgress,
	onBack,
	onStart,
	onChooseRoute,
	onSetSkillLoadout,
}: {
	view: OceanRunView
	skillOffers: readonly FishingSkill[]
	levelProgress: AccountLevelProgress
	onBack: () => void
	onStart: () => void
	onChooseRoute: (nodeId: string) => void
	onSetSkillLoadout: (skillIds: string[]) => void
}) {
	const containerRef = useRef<HTMLElement>(null)
	return (
		<section className="prep-layer" data-testid="prep-screen" ref={containerRef}>
			<header className="prep-header">
				<button className="secondary-action small" onClick={onBack}>Back</button>
				<LogoMark />
				<button className="primary-action small" onClick={onStart}>{view.isRefitting ? "Continue voyage" : "Set Sail"}</button>
			</header>
			<div className="prep-grid">
				<section className="prep-card panel-chrome">
					<h2>{view.isRefitting ? `Harbor refit · Voyage ${view.expedition.voyage}` : "Endless Adventure"}</h2>
					<p className="prep-hint">{view.isRefitting ? "Progress saved. Refit your skills and route, then sail on. The next voyage brings stronger currents and new conditions." : "Catch ten fish, face the Leviathan, then sail into the next voyage. Each boss restores one spare line, up to three. Rewards and levels stay with your captain."}</p>
					{view.isRefitting ? <p className="prep-hint" role="status">{view.lastResult ? `Leviathan landed · +${view.lastResult.rewards.xp} XP · +${view.lastResult.rewards.coins} coins · ` : ""}{view.expedition.spareLines} spare lines ready. No timer runs in harbor.</p> : null}
					<div className="prep-profile">
						<div className="avatar large">
							<PixelIcon file="icon_nav_fish" />
						</div>
						<div>
							<strong>Level {levelProgress.level}</strong>
							<XpBar progress={levelProgress.progress} />
							<span>{levelProgress.currentXp} XP earned</span>
						</div>
					</div>
					<div className="equipment-row">
						<EquipmentIcon file="ui_equipment_rod_tideglass" label="Tideglass Rod" />
						<EquipmentIcon file="ui_equipment_line_luminous" label="Luminous Line" />
						<EquipmentIcon file="ui_equipment_bait_moon" label="Moon Bait" />
					</div>
				</section>
				<section className="prep-card panel-chrome">
					<h2>Branching Route</h2>
					<div className="route-choice-grid prep-routes">
						{getRouteNodesForZone(view.isRefitting ? shallowCoastZoneOrder[view.expedition.currentZoneIndex]! : "zone_1").map((choice) => (
							<button key={choice.id} className={choice.id === (view.isRefitting ? view.expedition.selectedRouteId : view.selectedRoute.zoneId === "zone_1" ? view.selectedRoute.id : "lagoon_gate") ? "selected" : ""} onClick={() => onChooseRoute(choice.id)}>
								<strong>{choice.name}</strong>
								<span>Risk {Math.round(choice.risk * 100)}%</span>
								<span>Reward x{choice.rewardMultiplier.toFixed(2)}</span>
							</button>
						))}
					</div>
				</section>
				<section className="prep-card panel-chrome wide">
					<div className="prep-title-row">
						<h2>Skill Draft</h2>
						<span>{view.expedition.selectedSkillIds.length}/3 equipped</span>
					</div>
					<p className="prep-hint">{fishingSkills.filter((skill) => getFishingSkillUnlockLevel(skill.id) > levelProgress.level).map((skill) => `Lv ${getFishingSkillUnlockLevel(skill.id)}: ${skill.name}`).join(" · ") || "All six skills unlocked. Try a different loadout or route to improve your catch records."}</p>
					<p className="prep-hint">Equip one to three skills. Remove a selected skill before adding a fourth. Passive skills work automatically.</p>
					<div className="prep-skill-grid">
						{skillOffers.map((skill) => {
							const selected = view.expedition.selectedSkillIds.includes(skill.id)
							return <button
								key={skill.id}
								className={`prep-skill ${skill.type} ${selected ? "selected" : ""}`}
								aria-pressed={selected}
								disabled={selected ? view.expedition.selectedSkillIds.length === 1 : view.expedition.selectedSkillIds.length >= 3}
								onClick={() => {
									const next = selected
										? view.expedition.selectedSkillIds.filter((id) => id !== skill.id)
										: [...view.expedition.selectedSkillIds, skill.id].slice(0, 3)
									onSetSkillLoadout(next)
								}}
							>
								<PixelIcon file={skill.id === "cast_net" ? "collection" : skill.id === "steel_line" ? "anchor" : skill.id === "sonar" ? "accuracy" : "combo"} />
								<div>
									<strong>{skill.name}</strong>
									<span>{skill.description}</span>
								</div>
								<em>{selected ? "EQUIPPED" : skill.type.toUpperCase()}</em>
							</button>
						})}
					</div>
				</section>
			</div>
		</section>
	)
}
function RailButton({
	label,
	icon,
	active,
	badge,
	onClick,
}: {
	label: string
	icon: ReactElement
	active: boolean
	badge?: number
	onClick: () => void
}) {
	return (
		<button className={`rail-button ${active ? "active" : ""}`} onClick={onClick} aria-label={label}>
			{icon}
			<span>{label}</span>
			{badge ? <em>{badge}</em> : null}
		</button>
	)
}
function StarRow({ rarity }: { rarity: Rarity }) {
	const filled = rarityStars[rarity]
	return (
		<div className="stars" aria-label={`${filled} star rarity`}>
			{Array.from({ length: 5 }, (_, index) => (
				<span key={index} className={index < filled ? "filled" : ""}>*</span>
			))}
		</div>
	)
}
function Stat({ icon, label, value, hot }: { icon: ReactElement; label: string; value: string; hot?: boolean }) {
	return (
		<div className={`stat ${hot ? "hot" : ""}`}>
			{icon}
			<div>
				<span>{label}</span>
				<strong>{value}</strong>
			</div>
		</div>
	)
}
function SmallMeter({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
	return (
		<div className="small-meter">
			<span>{label}</span>
			<div>
				<i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} className={danger ? "danger" : ""} />
			</div>
			<strong>{value}%</strong>
		</div>
	)
}
function SkillButton({
	skill,
	index,
	encounter,
	activePulse,
	onUse,
}: {
	skill: FishingSkill
	index: number
	encounter: OceanRunView["encounter"]
	activePulse: boolean
	onUse: (skillId: string) => boolean
}) {
	const cost = getFishingSkillCost(skill.id)
	const blockReason = getFishingSkillBlockReason(encounter, skill)
	const usable = blockReason === null
	const charge = skill.type === "active" && cost > 0 ? Math.min(100, Math.round(encounter.skillEnergy / cost * 100)) : 100
	const style = { "--skill-charge": `${charge}%` } as CSSProperties
	const contents = <>
		<span className="skill-key">{skill.type === "active" ? `Alt+${index}` : "AUTO"}</span>
		<PixelIcon file={skill.id === "cast_net" ? "collection" : skill.id === "steel_line" ? "anchor" : skill.id === "sonar" ? "accuracy" : "combo"} />
		<span>{skill.name}</span>
		<span className="skill-cost">{blockReason ?? `Ready · ${cost}E`}</span>
	</>
	const title = `${skill.name}: ${skill.description}${cost ? ` Cost ${cost} energy.` : ""}`
	if (skill.type === "passive") return <article className={`skill-button passive ${activePulse ? "pulse" : ""}`} style={style} title={title}>{contents}</article>
	return (
		<button
			className={`skill-button ${skill.type} ${usable ? "ready" : ""} ${activePulse ? "pulse" : ""}`}
			style={style}
			onClick={() => usable && onUse(skill.id)}
			disabled={!usable}
			title={title}
		>
			{contents}
		</button>
	)
}
function CollectionPanel({ collection, onClose }: { collection: OceanRunView["collection"]; onClose: () => void }) {
	return (
		<OverlayPanel title="Collection" onClose={onClose}>
			<div className="collection-summary">
				<PixelIcon file="icon_nav_collection" />
				<span>{Object.keys(collection.records).length}/{fishSpecies.length} species discovered</span>
			</div>
			<div className="collection-grid">
				{fishSpecies.map((fish) => {
					const record = collection.records[fish.id]
					return (
						<article key={fish.id} className={`collection-card rarity-${fish.rarity} ${record ? "caught" : ""}`}>
							<div className="collection-art">
								<FishArtwork assetKey={fish.assetKey} />
							</div>
							<strong>{record ? fish.name : "Unknown"}</strong>
							<StarRow rarity={fish.rarity} />
							<span>{record ? `${record.largestSizeKg} kg / ${record.count}x caught` : fish.rarity}</span>
						</article>
					)
				})}
			</div>
		</OverlayPanel>
	)
}
function RoutePanel({
	choices,
	selectedId,
	chooseRoute,
	log,
	sonarRevealed,
	locked,
	onClose,
}: {
	choices: OceanRunView["routeChoices"]
	selectedId: string
	chooseRoute: (nodeId: string) => void
	log: string[]
	sonarRevealed: boolean
	locked: boolean
	onClose: () => void
}) {
	return (
		<OverlayPanel title="Route" onClose={onClose}>
			<div className={`sonar-banner ${sonarRevealed ? "active" : ""}`}>
				<PixelIcon file="icon_nav_tasks" />
				<span>{locked ? "Route locked after typing starts." : sonarRevealed ? "Sonar sweep active: zone fish revealed." : "Use Sonar to preview the zone fish before choosing."}</span>
			</div>
			<div className="route-choice-grid">
				{choices.map((choice) => (
					<button key={choice.id} className={choice.id === selectedId ? "selected" : ""} onClick={() => chooseRoute(choice.id)} disabled={locked}>
						<strong>{choice.name}</strong>
						<span>Risk {Math.round(choice.risk * 100)}%</span>
						<span>Reward x{choice.rewardMultiplier.toFixed(2)}</span>
						<small>{sonarRevealed ? choice.fishIds.map((id) => fishSpecies.find((fish) => fish.id === id)?.name ?? id).join(" / ") : "Catch table hidden"}</small>
					</button>
				))}
			</div>
			<div className="log-list">
				{log.map((line, index) => (
					<span key={`${line}-${index}`}>{line}</span>
				))}
			</div>
		</OverlayPanel>
	)
}
function SkillsPanel({ skills, energy, onClose }: { skills: readonly FishingSkill[]; energy: number; onClose: () => void }) {
	return (
		<OverlayPanel title="Skills" onClose={onClose}>
			<p>Close this panel, then click a ready skill or press Alt + its slot number. Passive skills work automatically. Perfect words earn 14 energy; other completed words earn 7.</p>
			<div className="skill-list">
				{skills.map((skill) => {
					const cost = getFishingSkillCost(skill.id)
					return (
						<article key={skill.id}>
							<PixelIcon file={skill.id === "cast_net" ? "collection" : skill.id === "steel_line" ? "anchor" : skill.id === "sonar" ? "accuracy" : "combo"} />
							<div>
								<strong>{skill.name}</strong>
								<span>{skill.description}</span>
								<small>{skill.type === "active" ? `Cost ${cost} energy / Current ${Math.round(energy)}` : "Passive during each encounter"}</small>
							</div>
						</article>
					)
				})}
			</div>
		</OverlayPanel>
	)
}
function FishPanel({
	fish,
	record,
	onClose,
}: {
	fish: OceanRunView["fish"]
	record?: { largestSizeKg: number; bestQuality: number; count: number }
	onClose: () => void
}) {
	return (
		<OverlayPanel title={fish.name} onClose={onClose}>
			<div className={`fish-detail rarity-${fish.rarity}`}>
				<FishArtwork assetKey={fish.assetKey} />
				<StarRow rarity={fish.rarity} />
				<p>{fish.lore}</p>
				{record ? (
					<div className="fish-record-grid">
						<span>Largest <strong>{record.largestSizeKg} kg</strong></span>
						<span>Best Quality <strong>{Math.round(record.bestQuality * 100)}%</strong></span>
						<span>Caught <strong>{record.count}x</strong></span>
					</div>
				) : null}
			</div>
		</OverlayPanel>
	)
}
function SettingsPanel({
	volumes,
	reducedMotion,
	setVolume,
	setReducedMotion,
	onClose,
}: {
	volumes: VolumeState
	reducedMotion: boolean
	setVolume: (category: keyof VolumeState, value: number) => void
	setReducedMotion: (value: boolean) => void
	onClose: () => void
}) {
	return (
		<OverlayPanel title="Settings" onClose={onClose}>
			<div className="settings-grid">
				{Object.entries(volumes).map(([key, value]) => (
					<label key={key}>
						<span>{key}</span>
						<input type="range" min="0" max="1" step="0.01" value={value} onChange={(event) => setVolume(key as keyof VolumeState, Number(event.target.value))} />
					</label>
				))}
				<label className="toggle-row">
					<span>Reduced effects</span>
					<input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
				</label>
			</div>
		</OverlayPanel>
	)
}
function PausePanel({ onResume, onMainMenu }: { onResume: () => void; onMainMenu: () => void }) {
	const dialog = useRef<HTMLDialogElement>(null)
	useEffect(() => { dialog.current!.showModal() }, [])
	return (
		<dialog ref={dialog} className="pause-overlay" data-testid="pause-panel" aria-labelledby="pause-title" onCancel={(event) => { event.preventDefault(); onResume() }}>
			<div className="pause-card panel-chrome">
				<span className="pause-kicker">EXPEDITION PAUSED</span>
				<h2 id="pause-title">Tide on hold</h2>
				<p>Your line, timer, fish, and typing target are frozen safely.</p>
				<div className="pause-actions">
					<button className="primary-action" onClick={onResume}>Resume fishing</button>
					<button className="secondary-action" onClick={onMainMenu}>Main menu</button>
				</div>
				<small>Press Esc anytime to pause or resume.</small>
			</div>
		</dialog>
	)
}
function ResultToast({ view, result }: { view: OceanRunView; result: CatchResult }) {
	return (
		<section className={`result-toast panel-chrome ${result.caught ? "caught" : "escaped"}`} data-testid="result-toast">
			{result.caught ? <PixelIcon file="icon_nav_collection" /> : <span aria-hidden="true">×</span>}
			<div>
				<strong>{result.caught ? "Catch secured" : "Line lost"}</strong>
				{view.feedback?.kind === "level" && <FeedbackBanner key={view.feedback.id} feedback={view.feedback} reducedMotion={view.reducedMotion} />}
				<span>{view.fish.name} / {result.sizeKg} kg / Q{Math.round(result.quality * 100)}</span>
				<small>+{result.rewards.coins} coins / +{result.rewards.xp} XP</small>
				{result.caught && <span>{view.collection.records[result.fishId].count === 1 ? "NEW SPECIES" : `Catch #${view.collection.records[result.fishId].count}`} · {getAccountLevelProgress(view.collection.xp).nextLevelXp - view.collection.xp} XP to next level</span>}
				<em>{view.expedition.complete ? "Expedition complete" : "Next encounter loading..."}</em>
			</div>
		</section>
	)
}
export function FeedbackBanner({ feedback, reducedMotion }: { feedback: OceanUiFeedback; reducedMotion: boolean }) {
	const bannerRef = useRef<HTMLElement>(null)
	const [visible, setVisible] = useState(true)
	useEffect(() => {
		const timeout = window.setTimeout(() => setVisible(false), 2600)
		return () => window.clearTimeout(timeout)
	}, [])
	return (
		<aside
			ref={bannerRef}
			hidden={!visible}
			className={`feedback-banner panel-chrome ${feedback.kind}`} data-reduced-effects={reducedMotion}
			data-testid={feedback.kind === "level" ? "level-up-banner" : "skill-feedback"}
			role="status"
			aria-live="polite"
		>
			<PixelIcon file="icon_stat_combo" />
			<div>
				<strong>{feedback.title}</strong>
				<span>{feedback.detail}</span>
			</div>
		</aside>
	)
}
function EquipmentIcon({ file, label }: { file: string; label: string }) {
	return (
		<article>
			<PixelIcon file={file.includes("rod") ? "anchor" : file.includes("line") ? "tasks" : "gem"} />
			<span>{label}</span>
		</article>
	)
}
function XpBar({ progress }: { progress: number }) {
	return (
		<div className="xp-track" aria-label={`XP progress ${Math.round(progress * 100)} percent`}>
			<i style={{ width: `${Math.round(progress * 100)}%` }} />
		</div>
	)
}
function OverlayPanel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
	const containerRef = useRef<HTMLDialogElement>(null)
	useEffect(() => { containerRef.current!.showModal() }, [])
	return (
		<dialog className="overlay-panel panel-chrome" data-testid="overlay-panel" ref={containerRef} aria-label={title} onCancel={(event) => { event.preventDefault(); onClose() }}>
			<header>
				<strong>{title}</strong>
				<button onClick={onClose} aria-label="Close">
					<span aria-hidden="true">×</span>
				</button>
			</header>
			{children}
		</dialog>
	)
}
function formatTime(ms: number): string {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
	const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0")
	const seconds = (totalSeconds % 60).toString().padStart(2, "0")
	return `${minutes}:${seconds}`
}
function getEncounterNumber(zoneIndex: number, encounterIndex: number): number {
	return zoneIndex * 3 + encounterIndex + 1
}
function ShoalPicker({ view, chooseTarget }: { view: OceanRunView; chooseTarget: (fishId: string) => void }) {
 const [viewport, setViewport] = useState(() => ({ width: innerWidth, height: innerHeight }))
 useEffect(() => { const resize = () => setViewport({ width: innerWidth, height: innerHeight }); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize) }, [])
 const slots = shoalLayout(viewport.width, viewport.height)
 const school = fishSpecies.filter(fish => fish.habitat === view.fish.habitat && fish.rarity !== "boss").map((fish, index) => view.fish.rarity === "boss" && index === 0 ? view.fish : fish)
 const locked = view.metrics.correctKeystrokes + view.metrics.incorrectKeystrokes > 0 || view.encounter.status !== "active" || view.isPaused || view.fish.rarity === "boss"
 return <nav className="shoal-picker" aria-label="Choose a fish" data-testid="shoal-picker">{school.map((fish, index) => <button key={fish.id} aria-label={`Target ${fish.name}`} aria-pressed={fish.id === view.fish.id} disabled={locked} style={{ left: `${slots[index]!.x * 100}%`, top: `${(slots[index]!.y - (viewport.width <= 700 ? .025 : .04)) * 100}%` }} onClick={() => chooseTarget(fish.id)}><span>{fish.name}</span><small>{fish.id === view.fish.id ? "HOOKED" : "SELECT"}</small></button>)}</nav>
}
