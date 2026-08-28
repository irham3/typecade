import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactElement, ReactNode } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

gsap.registerPlugin(useGSAP)
import {
	Anchor,
	BookOpen,
	CheckCircle2,
	ClipboardList,
	Coins,
	Fish,
	Gem,
	Hourglass,
	Pause,
	Play,
	Radar,
	Settings,
	Sparkles,
	ShoppingBag,
	Target,
	Trophy,
	X,
	Zap,
} from "lucide-react"
import type { AccountLevelProgress, FishingSkill, Rarity } from "@typecade/contracts"
import { fishSpecies, generatedFishCatalog } from "@typecade/content"
import { getAccountLevelProgress, getFishingSkillCost } from "@typecade/game-rules"
import { useOceanRun, type OceanRunView, type OceanUiFeedback, type VolumeState } from "./hooks/useOceanRun"

type Panel = "fish" | "collection" | "tasks" | "shop" | "settings" | "leaderboard" | "ranked" | null
type Screen = "menu" | "prep" | "game"

const rarityStars: Record<Rarity, number> = {
	common: 1,
	uncommon: 2,
	rare: 3,
	boss: 5,
}

function getFishArtworkPath(assetKey: string): string {
	if (assetKey === "fish_pebble_goby") {
		return "/assets/ocean/concepts/fish-catalog-v2/fish_catalog_v2_01.png"
	}
	return `/assets/ocean/sprites/fish/${assetKey}_idle_0.png`
}

export function App() {
	const hostRef = useRef<HTMLDivElement | null>(null)
	const [screen, setScreen] = useState<Screen>("menu")
	const {
		bridge,
		view,
		activeSkills,
		skillOffers,
		chooseRoute,
		setSkillLoadout,
		useSkill,
		setVolume,
		setReducedMotion,
		startFreshRun,
		togglePause,
	} = useOceanRun(screen === "game")
	const [panel, setPanel] = useState<Panel>(null)
	const levelProgress = getAccountLevelProgress(view.collection.xp)

	useEffect(() => {
		if (!hostRef.current) {
			return
		}
		const host = hostRef.current
		let disposed = false
		let destroyGame: (() => void) | undefined

		void import("./game/createFishingGame").then(({ createFishingGame }) => {
			if (disposed) {
				return
			}
			const game = createFishingGame(host, bridge)
			destroyGame = () => game.destroy(true)
		})

		return () => {
			disposed = true
			bridge.clear()
			destroyGame?.()
		}
	}, [bridge])

	useEffect(() => {
		bridge.emit("screen:changed", { screen })
	}, [screen, bridge])

	const caughtCount = Object.keys(view.collection.records).length
	const totalCount = fishSpecies.length

	const beginRun = () => {
		startFreshRun()
		setPanel(null)
		setScreen("game")
	}

	return (
		<main className={`game-shell screen-${screen}`} data-testid="ocean-game-shell">
			<div ref={hostRef} className="game-canvas" data-testid="phaser-gameplay" />

			{screen === "game" ? (
				<GameHud
					view={view}
					activeSkills={activeSkills}
					levelProgress={levelProgress}
					caughtCount={caughtCount}
					totalCount={totalCount}
					panel={panel}
					setPanel={setPanel}
					chooseRoute={chooseRoute}
					useSkill={useSkill}
					setVolume={setVolume}
					setReducedMotion={setReducedMotion}
					startFreshRun={beginRun}
					togglePause={togglePause}
					goToMenu={() => setScreen("menu")}
				/>
			) : null}

			{screen === "menu" ? (
				<MainMenu
					view={view}
					onStart={() => setScreen("prep")}
					onAdventure={() => setScreen("prep")}
					onRankedDuel={() => setPanel("ranked")}
					onShop={() => setPanel("shop")}
					onCollection={() => setPanel("collection")}
					onLeaderboard={() => setPanel("leaderboard")}
				/>
			) : null}

			{screen === "prep" ? (
				<PreparationScreen
					view={view}
					skillOffers={skillOffers}
					levelProgress={levelProgress}
					onBack={() => setScreen("menu")}
					onStart={beginRun}
					onChooseRoute={chooseRoute}
					onSetSkillLoadout={setSkillLoadout}
				/>
			) : null}

			{screen !== "game" && panel === "collection" ? <CollectionPanel onClose={() => setPanel(null)} collection={view.collection} /> : null}
			{screen !== "game" && panel === "shop" ? <MenuShopPanel onClose={() => setPanel(null)} /> : null}
			{screen !== "game" && panel === "leaderboard" ? <LeaderboardPanel onClose={() => setPanel(null)} /> : null}
			{screen !== "game" && panel === "ranked" ? <RankedDuelPanel onClose={() => setPanel(null)} /> : null}
			{screen !== "game" && panel === "settings" ? (
				<SettingsPanel
					volumes={view.volumes}
					reducedMotion={view.reducedMotion}
					setVolume={setVolume}
					setReducedMotion={setReducedMotion}
					onClose={() => setPanel(null)}
				/>
			) : null}
		</main>
	)
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
	useSkill,
	setVolume,
	setReducedMotion,
	startFreshRun,
	togglePause,
	goToMenu,
}: {
	view: OceanRunView
	activeSkills: readonly FishingSkill[]
	levelProgress: AccountLevelProgress
	caughtCount: number
	totalCount: number
	panel: Panel
	setPanel: (panel: Panel) => void
	chooseRoute: (nodeId: string) => void
	useSkill: (skillId: string) => boolean
	setVolume: (category: keyof VolumeState, value: number) => void
	setReducedMotion: (value: boolean) => void
	startFreshRun: () => void
	togglePause: () => void
	goToMenu: () => void
}) {
	const containerRef = useRef<HTMLDivElement>(null)

	useGSAP(() => {
		if (view.reducedMotion) return

		gsap.from(".topbar", { y: -50, opacity: 0, duration: 0.6, ease: "back.out(1.5)", delay: 0.1 })
		gsap.from(".icon-rail button", { x: -30, opacity: 0, duration: 0.4, stagger: 0.08, ease: "power2.out", delay: 0.2 })
		gsap.from(".bottom-console", { y: 60, opacity: 0, duration: 0.6, ease: "back.out(1.2)", delay: 0.3 })
		gsap.from(".skill-button", { y: 40, opacity: 0, duration: 0.4, stagger: 0.1, ease: "back.out(1.5)", delay: 0.4 })
		gsap.from(".route-strip", { y: -20, opacity: 0, duration: 0.5, ease: "power2.out", delay: 0.2 })
		gsap.from(".fish-card", { x: 50, opacity: 0, duration: 0.6, ease: "back.out(1.2)", delay: 0.3 })
	}, { scope: containerRef, dependencies: [view.reducedMotion] })

	const timeLeft = formatTime(view.encounter.timeRemainingMs)
	const tensionPercent = Math.round(view.encounter.tension)
	const progressPercent = Math.round(view.encounter.progress * 100)
	const durabilityPercent = Math.round(view.encounter.durability)
	const routeProgress = `${view.expedition.currentZoneIndex + 1}/3`
	const encounterLabel = `${getEncounterNumber(view.expedition.currentZoneIndex, view.expedition.currentEncounterIndex)}/10`

	return (
		<div className="hud" data-testid="ocean-hud" ref={containerRef}>
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
				<RailButton label="Fish" active={panel === "fish"} onClick={() => setPanel(panel === "fish" ? null : "fish")} icon={<PixelIcon file="icon_nav_fish.png" />} />
				<RailButton label="Collection" active={panel === "collection"} onClick={() => setPanel(panel === "collection" ? null : "collection")} icon={<PixelIcon file="icon_nav_collection.png" />} badge={caughtCount} />
				<RailButton label="Tasks" active={panel === "tasks"} onClick={() => setPanel(panel === "tasks" ? null : "tasks")} icon={<PixelIcon file="icon_nav_tasks.png" />} badge={view.expedition.spareLines} />
				<RailButton label="Shop" active={panel === "shop"} onClick={() => setPanel(panel === "shop" ? null : "shop")} icon={<PixelIcon file="icon_nav_shop.png" />} />
			</nav>

			<section className="route-strip panel-chrome" data-testid="route-strip">
				<strong>Zone {routeProgress}</strong>
				<span>{view.selectedRoute.name}</span>
				<span>Encounter {encounterLabel}</span>
			</section>

			<FishInfoCard fish={view.fish} record={view.collection.records[view.fish.id]} />
			{view.feedback ? <FeedbackBanner feedback={view.feedback} reducedMotion={view.reducedMotion} /> : null}

			<section className="bottom-console" data-testid="typing-console">
				<div className={`tension-wrap ${tensionPercent >= 82 ? "danger" : ""}`}>
					<PixelIcon file="icon_meter_anchor.png" className="meter-icon" />
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

				<div className="typing-panel panel-chrome">
					<div className="typing-help">
						<span>Type the highlighted passage</span>
						<kbd>Esc pause</kbd>
					</div>
					<TypingTarget text={view.targetText} cursor={view.cursor} />
					<div className="typing-input" data-testid="typing-input">
						<span>{view.currentInput || " "}</span>
						<span className="cursor" />
					</div>
				</div>

				<div className="stat-row panel-chrome">
				<Stat icon={<PixelIcon file="icon_stat_combo.png" />} label="COMBO" value={`x${Math.max(1, view.encounter.combo)}`} hot={view.encounter.combo >= 5} />
				<Stat icon={<PixelIcon file="icon_stat_accuracy.png" />} label="ACCURACY" value={`${Math.round(view.metrics.accuracy)}%`} hot={view.metrics.accuracy >= 95} />
				<Stat icon={<PixelIcon file="icon_stat_timer.png" />} label="TIME LEFT" value={timeLeft} hot={view.encounter.timeRemainingMs < 12000} />
				</div>

				<div className="progress-stack">
					<SmallMeter label="REEL" value={progressPercent} />
					<SmallMeter label="LINE" value={durabilityPercent} danger={durabilityPercent < 35} />
					<SmallMeter label="SKILL" value={Math.round(view.encounter.skillEnergy)} />
				</div>
			</section>

			<section className="skill-dock panel-chrome" data-testid="skill-dock">
				{activeSkills.map((skill, index) => (
					<SkillButton
						key={skill.id}
						skill={skill}
						index={index + 1}
						energy={view.encounter.skillEnergy}
						activePulse={view.lastSkillId === skill.id}
						onUse={useSkill}
					/>
				))}
			</section>

			{view.lastResult ? <ResultToast view={view} /> : null}

			{view.isPaused ? <PausePanel onResume={togglePause} onMainMenu={goToMenu} /> : null}

			{view.expedition.complete ? (
				<section className="complete-panel panel-chrome" data-testid="complete-panel">
					<Trophy aria-hidden="true" />
					<strong>Shallow Coast cleared</strong>
					<span>{caughtCount}/{totalCount} species recorded</span>
					<button onClick={startFreshRun}>Sail Again</button>
					<button className="secondary" onClick={goToMenu}>Main Menu</button>
				</section>
			) : null}

			{panel === "collection" ? <CollectionPanel onClose={() => setPanel(null)} collection={view.collection} /> : null}
			{panel === "tasks" ? (
				<RoutePanel
					onClose={() => setPanel(null)}
					choices={view.routeChoices}
					selectedId={view.selectedRoute.id}
					chooseRoute={chooseRoute}
					log={view.log}
					sonarRevealed={view.sonarRevealed}
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
					<Fish aria-hidden="true" />
				</div>
				<div>
					<strong>WaveRider</strong>
					<span>
						<Sparkles aria-hidden="true" /> Lv {levelProgress.level}
					</span>
					<XpBar progress={levelProgress.progress} />
				</div>
			</section>

			<LogoMark />

			<section className="currency-row">
				<div className="currency-pill panel-chrome">
					<PixelIcon file="icon_currency_coin.png" />
					<span>{view.collection.coins.toLocaleString()}</span>
				</div>
				<div className="currency-pill panel-chrome">
					<PixelIcon file="icon_currency_gem.png" />
					<span>{view.collection.materials.toLocaleString()}</span>
				</div>
				<button className="icon-button panel-chrome" aria-label={view.isPaused ? "Resume game" : "Pause game"} onClick={onPause}>
					{view.isPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
				</button>
				<button className="icon-button panel-chrome" aria-label="Settings" onClick={onSettings}>
					<PixelIcon file="icon_utility_settings.png" />
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
	onShop,
	onCollection,
	onLeaderboard,
}: {
	view: OceanRunView
	onStart: () => void
	onAdventure: () => void
	onRankedDuel: () => void
	onShop: () => void
	onCollection: () => void
	onLeaderboard: () => void
}) {
	const containerRef = useRef<HTMLElement>(null)
	const menuItems = [
		{ label: "Play", src: "/assets/ocean/mainmenu/1.play.png", onClick: onStart, primary: true },
		{ label: "Adventure", src: "/assets/ocean/mainmenu/2.adventure.png", onClick: onAdventure },
		{ label: "Ranked Duel", src: "/assets/ocean/mainmenu/3.ranked duel.png", onClick: onRankedDuel },
		{ label: "Shop", src: "/assets/ocean/mainmenu/4.duel.png", onClick: onShop },
		{ label: "Collection", src: "/assets/ocean/mainmenu/5.collection.png", onClick: onCollection },
		{ label: "Leaderboard", src: "/assets/ocean/mainmenu/6.leaderboard.png", onClick: onLeaderboard },
	]

	useGSAP(() => {
		if (view.reducedMotion) return

		gsap.from(".mainmenu-logo", { y: -22, scale: 0.96, opacity: 0, duration: 0.45, ease: "back.out(1.4)" })
		gsap.from(".mainmenu-button", { y: 16, opacity: 0, duration: 0.28, stagger: 0.055, delay: 0.16, ease: "back.out(1.2)" })
		gsap.from(".mainmenu-dock", { x: -36, opacity: 0, duration: 0.45, ease: "power2.out" })
		gsap.from(".mainmenu-ship", { x: 24, opacity: 0, duration: 0.45, delay: 0.22, ease: "power2.out" })
	}, { scope: containerRef, dependencies: [view.reducedMotion] })

	return (
		<section className="menu-layer" data-testid="main-menu" ref={containerRef}>
			<img className="mainmenu-dock" src="/assets/ocean/mainmenu/dock-mainmenu.png" alt="" aria-hidden="true" draggable={false} />
			<img className="mainmenu-ship" src="/assets/ocean/mainmenu/ship-mainmenu.png" alt="" aria-hidden="true" draggable={false} />
			<div className="mainmenu-center">
				<img className="mainmenu-logo" src="/assets/ocean/mainmenu/logo-1.png" alt="Typecade" draggable={false} />
				<nav className="mainmenu-stack" aria-label="Main menu">
					{menuItems.map((item) => (
						<button key={item.label} className={`mainmenu-button ${item.primary ? "primary" : ""}`} onClick={item.onClick} aria-label={item.label}>
							<img src={item.src} alt="" draggable={false} />
						</button>
					))}
				</nav>
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

	useGSAP(() => {
		if (view.reducedMotion) return
		gsap.from(".prep-header", { y: -30, opacity: 0, duration: 0.5, ease: "power2.out" })
		gsap.from(".prep-card", { y: 40, opacity: 0, duration: 0.6, stagger: 0.15, ease: "back.out(1.2)", delay: 0.2 })
		gsap.from(".prep-skill", { scale: 0.9, opacity: 0, duration: 0.4, stagger: 0.1, delay: 0.4, ease: "back.out(1.5)" })
		gsap.from(".route-choice-grid button", { x: -20, opacity: 0, duration: 0.4, stagger: 0.1, delay: 0.5, ease: "power2.out" })
	}, { scope: containerRef, dependencies: [view.reducedMotion] })

	return (
		<section className="prep-layer" data-testid="prep-screen" ref={containerRef}>
			<header className="prep-header">
				<button className="secondary-action small" onClick={onBack}>Back</button>
				<LogoMark />
				<button className="primary-action small" onClick={onStart}>Set Sail</button>
			</header>

			<div className="prep-grid">
				<section className="prep-card panel-chrome">
					<h2>Captain Loadout</h2>
					<div className="prep-profile">
						<div className="avatar large">
							<Fish aria-hidden="true" />
						</div>
						<div>
							<strong>Level {levelProgress.level}</strong>
							<XpBar progress={levelProgress.progress} />
							<span>{levelProgress.currentXp} XP earned</span>
						</div>
					</div>
					<div className="equipment-row">
						<EquipmentIcon file="ui_equipment_rod_tideglass.png" label="Tideglass Rod" />
						<EquipmentIcon file="ui_equipment_line_luminous.png" label="Luminous Line" />
						<EquipmentIcon file="ui_equipment_bait_moon.png" label="Moon Bait" />
					</div>
				</section>

				<section className="prep-card panel-chrome">
					<h2>Branching Route</h2>
					<div className="route-choice-grid prep-routes">
						{view.routeChoices.map((choice) => (
							<button key={choice.id} className={choice.id === view.selectedRoute.id ? "selected" : ""} onClick={() => onChooseRoute(choice.id)}>
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
					<p className="prep-hint">This run's tide rolls a different offer. Pick up to three: one active, one passive, then build the combo you want.</p>
					<div className="prep-skill-grid">
						{skillOffers.map((skill) => {
							const selected = view.expedition.selectedSkillIds.includes(skill.id)
							return <button
								key={skill.id}
								className={`prep-skill ${skill.type} ${selected ? "selected" : ""}`}
								aria-pressed={selected}
								onClick={() => {
									const next = selected
										? view.expedition.selectedSkillIds.filter((id) => id !== skill.id)
										: [...view.expedition.selectedSkillIds, skill.id].slice(0, 3)
									onSetSkillLoadout(next)
								}}
							>
								<img src={`/assets/ocean/ui/ui_skill_${skill.id}_default.png`} alt="" />
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

function LogoMark() {
	return <img className="logo-mark-image" src="/assets/ocean/mainmenu/logo-1.png" alt="Typecade" draggable={false} />
}

function PixelIcon({ file, className = "" }: { file: string; className?: string }) {
	return <img className={`pixel-icon ${className}`} src={`/assets/ocean/reference-derived-pixel-pack/${file}`} alt="" aria-hidden="true" draggable={false} />
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

function FishInfoCard({
	fish,
	record,
}: {
	fish: { name: string; rarity: Rarity; lore: string; assetKey: string }
	record?: { largestSizeKg: number; bestQuality: number; count: number }
}) {
	return (
		<aside className={`fish-card panel-chrome rarity-${fish.rarity}`} data-testid="fish-card">
			<h2>{fish.name}</h2>
			<strong>{fish.rarity.toUpperCase()}</strong>
			<StarRow rarity={fish.rarity} />
			<div className="fish-frame">
				<img src={getFishArtworkPath(fish.assetKey)} alt="" />
			</div>
			<p>{fish.lore}</p>
			{record ? <span className="record-chip">Best {Math.round(record.bestQuality * 100)}% / {record.largestSizeKg} kg</span> : null}
		</aside>
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

function TypingTarget({ text, cursor }: { text: string; cursor: number }) {
	const chars = useMemo(() => Array.from(text), [text])
	let position = 0
	return (
		<div className="typing-target" data-testid="typing-target">
			{chars.map((char, index) => {
				const charStart = position
				position += char.length
				const className = charStart < cursor ? "done" : charStart === cursor ? "next" : "ghost"
				return (
					<span key={`${char}-${index}`} className={className}>
						{char === " " ? "\u00a0" : char}
					</span>
				)
			})}
		</div>
	)
}

function Stat({ icon, label, value, hot = false }: { icon: ReactElement; label: string; value: string; hot?: boolean }) {
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
	energy,
	activePulse,
	onUse,
}: {
	skill: FishingSkill
	index: number
	energy: number
	activePulse: boolean
	onUse: (skillId: string) => boolean
}) {
	const cost = getFishingSkillCost(skill.id)
	const usable = skill.type === "active" && energy >= cost
	const charge = skill.type === "active" && cost > 0 ? Math.min(100, Math.round(energy / cost * 100)) : 100
	const style = { "--skill-charge": `${charge}%` } as CSSProperties
	return (
		<button
			className={`skill-button ${skill.type} ${usable ? "ready" : ""} ${activePulse ? "pulse" : ""}`}
			style={style}
			onClick={() => usable && onUse(skill.id)}
			disabled={skill.type === "passive" || !usable}
			title={`${skill.name}: ${skill.description}${cost ? ` Cost ${cost} energy.` : ""}`}
		>
			<span className="skill-key">{skill.type === "active" ? index : "P"}</span>
			<img src={`/assets/ocean/ui/ui_skill_${skill.id}_default.png`} alt="" />
			<span>{skill.name}</span>
			<span className="skill-cost">{skill.type === "active" ? `${charge}%` : "PASSIVE"}</span>
		</button>
	)
}

function CollectionPanel({ collection, onClose }: { collection: OceanRunView["collection"]; onClose: () => void }) {
	return (
		<OverlayPanel title="Collection" onClose={onClose}>
			<div className="collection-summary">
				<Trophy aria-hidden="true" />
				<span>{Object.keys(collection.records).length}/{fishSpecies.length} species discovered</span>
			</div>
			<div className="collection-grid">
				{fishSpecies.map((fish) => {
					const record = collection.records[fish.id]
					return (
						<article key={fish.id} className={`collection-card rarity-${fish.rarity} ${record ? "caught" : ""}`}>
							<div className="collection-art">
								<img src={getFishArtworkPath(fish.assetKey)} alt="" />
							</div>
							<strong>{record ? fish.name : "Unknown"}</strong>
							<StarRow rarity={fish.rarity} />
							<span>{record ? `${record.largestSizeKg} kg / ${record.count}x caught` : fish.rarity}</span>
						</article>
					)
				})}
			</div>
			<div className="collection-section-heading">
				<strong>Extended Concept Catalog</strong>
				<span>40 generated species previews · collection-only for this milestone</span>
			</div>
			<div className="collection-grid generated-fish-catalog" data-testid="generated-fish-catalog">
				{generatedFishCatalog.map((fish) => (
					<article key={fish.id} className={`collection-card catalog-preview rarity-${fish.rarity}`}>
						<div className="collection-art">
							<img src={fish.spritePath} alt="" />
						</div>
						<strong>{fish.name}</strong>
						<StarRow rarity={fish.rarity} />
						<span>{fish.landmark}</span>
					</article>
				))}
			</div>
		</OverlayPanel>
	)
}

function MenuShopPanel({ onClose }: { onClose: () => void }) {
	return (
		<OverlayPanel title="Shop" onClose={onClose}>
			<div className="tasks-list">
				<article>
					<strong>Tideglass Rod</strong>
					<span>Equipment shopping is reserved for a future upgrade pass.</span>
					<em>Preview</em>
				</article>
				<article>
					<strong>Moon Bait</strong>
					<span>Rare-fish bait is planned for the full Shallow Coast economy.</span>
					<em>Preview</em>
				</article>
			</div>
		</OverlayPanel>
	)
}

function LeaderboardPanel({ onClose }: { onClose: () => void }) {
	return (
		<OverlayPanel title="Leaderboard" onClose={onClose}>
			<div className="tasks-list">
				<article>
					<strong>Shallow Coast</strong>
					<span>WaveRider local run records will live here.</span>
					<em>Local</em>
				</article>
				<article>
					<strong>Ranked Duel</strong>
					<span>Online leaderboard data is out of scope for Milestone 1.</span>
					<em>Soon</em>
				</article>
			</div>
		</OverlayPanel>
	)
}

function RankedDuelPanel({ onClose }: { onClose: () => void }) {
	return (
		<OverlayPanel title="Ranked Duel" onClose={onClose}>
			<div className="tasks-list">
				<article>
					<strong>Boat Duel</strong>
					<span>Ranked matchmaking is reserved for the later competition milestone.</span>
					<em>Locked</em>
				</article>
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
	onClose,
}: {
	choices: OceanRunView["routeChoices"]
	selectedId: string
	chooseRoute: (nodeId: string) => void
	log: string[]
	sonarRevealed: boolean
	onClose: () => void
}) {
	return (
		<OverlayPanel title="Route" onClose={onClose}>
			<div className={`sonar-banner ${sonarRevealed ? "active" : ""}`}>
				<Radar aria-hidden="true" />
				<span>{sonarRevealed ? "Sonar sweep active: catch tables revealed." : "Use Sonar to reveal exact route fish before committing."}</span>
			</div>
			<div className="route-choice-grid">
				{choices.map((choice) => (
					<button key={choice.id} className={choice.id === selectedId ? "selected" : ""} onClick={() => chooseRoute(choice.id)}>
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
			<div className="skill-list">
				{skills.map((skill) => {
					const cost = getFishingSkillCost(skill.id)
					return (
						<article key={skill.id}>
							<img src={`/assets/ocean/ui/ui_skill_${skill.id}_default.png`} alt="" />
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
				<img src={getFishArtworkPath(fish.assetKey)} alt="" />
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
	return (
		<section className="pause-overlay" data-testid="pause-panel" role="dialog" aria-modal="true" aria-labelledby="pause-title">
			<div className="pause-card panel-chrome">
				<span className="pause-kicker">EXPEDITION PAUSED</span>
				<h2 id="pause-title">Tide on hold</h2>
				<p>Your line, timer, fish, and typing target are frozen safely.</p>
				<div className="pause-actions">
					<button className="primary-action" onClick={onResume}><Play aria-hidden="true" /> Resume fishing</button>
					<button className="secondary-action" onClick={onMainMenu}>Main menu</button>
				</div>
				<small>Press Esc anytime to pause or resume.</small>
			</div>
		</section>
	)
}

function ResultToast({ view }: { view: OceanRunView }) {
	const result = view.lastResult
	if (!result) {
		return null
	}
	return (
		<section className={`result-toast panel-chrome ${result.caught ? "caught" : "escaped"}`} data-testid="result-toast">
			{result.caught ? <CheckCircle2 aria-hidden="true" /> : <X aria-hidden="true" />}
			<div>
				<strong>{result.caught ? "Catch secured" : "Line lost"}</strong>
				<span>{view.fish.name} / {result.sizeKg} kg / Q{Math.round(result.quality * 100)}</span>
				<small>+{result.rewards.coins} coins / +{result.rewards.xp} XP</small>
				<em>{view.expedition.complete ? "Expedition complete" : "Next encounter loading..."}</em>
			</div>
		</section>
	)
}

function FeedbackBanner({ feedback, reducedMotion }: { feedback: OceanUiFeedback; reducedMotion: boolean }) {
	const bannerRef = useRef<HTMLElement>(null)
	const [visibleId, setVisibleId] = useState(feedback.id)

	useEffect(() => {
		setVisibleId(feedback.id)
		const timeout = window.setTimeout(() => setVisibleId((current) => current === feedback.id ? -1 : current), 2600)
		return () => window.clearTimeout(timeout)
	}, [feedback.id])

	useGSAP(() => {
		if (reducedMotion || visibleId !== feedback.id || !bannerRef.current) return
		const timeline = gsap.timeline()
		timeline.fromTo(bannerRef.current, {
			y: -24,
			opacity: 0,
			scale: 0.82,
		}, {
			y: 0,
			opacity: 1,
			scale: 1,
			duration: 0.42,
			ease: "back.out(1.7)",
		}).to(bannerRef.current, {
			y: -10,
			opacity: 0,
			duration: 0.28,
			delay: 1.7,
			ease: "power2.in",
		})
		return () => timeline.kill()
	}, { scope: bannerRef, dependencies: [feedback.id, reducedMotion, visibleId] })

	if (visibleId !== feedback.id) {
		return null
	}

	return (
		<aside
			ref={bannerRef}
			className={`feedback-banner panel-chrome ${feedback.kind}`}
			data-testid={feedback.kind === "level" ? "level-up-banner" : "skill-feedback"}
			role="status"
			aria-live="polite"
		>
			<Sparkles aria-hidden="true" />
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
			<img src={`/assets/ocean/equipment/${file}`} alt="" />
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
	const containerRef = useRef<HTMLElement>(null)

	useGSAP(() => {
		gsap.from(containerRef.current, { scale: 0.95, opacity: 0, duration: 0.3, ease: "back.out(1.5)" })
		gsap.from(containerRef.current?.children || [], { y: 15, opacity: 0, duration: 0.3, stagger: 0.05, delay: 0.1 })
	}, { scope: containerRef })

	return (
		<section className="overlay-panel panel-chrome" data-testid="overlay-panel" ref={containerRef}>
			<header>
				<strong>{title}</strong>
				<button onClick={onClose} aria-label="Close">
					<X aria-hidden="true" />
				</button>
			</header>
			{children}
		</section>
	)
}

function formatTime(ms: number): string {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
	const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0")
	const seconds = (totalSeconds % 60).toString().padStart(2, "0")
	return `${minutes}:${seconds}`
}

function getEncounterNumber(zoneIndex: number, encounterIndex: number): number {
	const offsets = [0, 3, 6]
	return (offsets[zoneIndex] ?? 0) + encounterIndex + 1
}
