import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactElement, ReactNode } from "react"
import {
	Anchor,
	BookOpen,
	CheckCircle2,
	ClipboardList,
	Coins,
	Compass,
	Fish,
	Gem,
	Hourglass,
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
import { fishSpecies } from "@typecade/content"
import { getAccountLevelProgress, getFishingSkillCost } from "@typecade/game-rules"
import { useOceanRun, type OceanRunView, type VolumeState } from "./hooks/useOceanRun"

type Panel = "fish" | "collection" | "tasks" | "shop" | "settings" | null
type Screen = "menu" | "prep" | "game"

const rarityStars: Record<Rarity, number> = {
	common: 1,
	uncommon: 2,
	rare: 3,
	boss: 5,
}

export function App() {
	const hostRef = useRef<HTMLDivElement | null>(null)
	const [screen, setScreen] = useState<Screen>("menu")
	const {
		bridge,
		view,
		activeSkills,
		chooseRoute,
		useSkill,
		setVolume,
		setReducedMotion,
		startFreshRun,
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
					goToMenu={() => setScreen("menu")}
				/>
			) : null}

			{screen === "menu" ? (
				<MainMenu
					view={view}
					levelProgress={levelProgress}
					caughtCount={caughtCount}
					totalCount={totalCount}
					onStart={() => setScreen("prep")}
					onContinue={() => setScreen("game")}
					onCollection={() => setPanel("collection")}
					onSettings={() => setPanel("settings")}
				/>
			) : null}

			{screen === "prep" ? (
				<PreparationScreen
					view={view}
					activeSkills={activeSkills}
					levelProgress={levelProgress}
					onBack={() => setScreen("menu")}
					onStart={beginRun}
					onChooseRoute={chooseRoute}
				/>
			) : null}

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
	goToMenu: () => void
}) {
	const timeLeft = formatTime(view.encounter.timeRemainingMs)
	const tensionPercent = Math.round(view.encounter.tension)
	const progressPercent = Math.round(view.encounter.progress * 100)
	const durabilityPercent = Math.round(view.encounter.durability)
	const routeProgress = `${view.expedition.currentZoneIndex + 1}/3`
	const encounterLabel = `${getEncounterNumber(view.expedition.currentZoneIndex, view.expedition.currentEncounterIndex)}/10`

	return (
		<div className="hud" data-testid="ocean-hud">
			<TopBar view={view} levelProgress={levelProgress} onSettings={() => setPanel(panel === "settings" ? null : "settings")} />

			<nav className="icon-rail panel-chrome" aria-label="Ocean navigation">
				<RailButton label="Fish" active={panel === "fish"} onClick={() => setPanel(panel === "fish" ? null : "fish")} icon={<Fish aria-hidden="true" />} />
				<RailButton label="Collection" active={panel === "collection"} onClick={() => setPanel(panel === "collection" ? null : "collection")} icon={<BookOpen aria-hidden="true" />} badge={caughtCount} />
				<RailButton label="Tasks" active={panel === "tasks"} onClick={() => setPanel(panel === "tasks" ? null : "tasks")} icon={<ClipboardList aria-hidden="true" />} badge={view.expedition.spareLines} />
				<RailButton label="Shop" active={panel === "shop"} onClick={() => setPanel(panel === "shop" ? null : "shop")} icon={<ShoppingBag aria-hidden="true" />} />
			</nav>

			<section className="route-strip panel-chrome" data-testid="route-strip">
				<strong>Zone {routeProgress}</strong>
				<span>{view.selectedRoute.name}</span>
				<span>Encounter {encounterLabel}</span>
			</section>

			<FishInfoCard fish={view.fish} record={view.collection.records[view.fish.id]} />

			<section className="bottom-console" data-testid="typing-console">
				<div className={`tension-wrap ${tensionPercent >= 82 ? "danger" : ""}`}>
					<Anchor aria-hidden="true" />
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
					<TypingTarget text={view.targetText} cursor={view.cursor} />
					<div className="typing-input" data-testid="typing-input">
						<span>{view.currentInput || " "}</span>
						<span className="cursor" />
					</div>
				</div>

				<div className="stat-row panel-chrome">
					<Stat icon={<Zap aria-hidden="true" />} label="COMBO" value={`x${Math.max(1, view.encounter.combo)}`} hot={view.encounter.combo >= 5} />
					<Stat icon={<Target aria-hidden="true" />} label="ACCURACY" value={`${Math.round(view.metrics.accuracy)}%`} hot={view.metrics.accuracy >= 95} />
					<Stat icon={<Hourglass aria-hidden="true" />} label="TIME LEFT" value={timeLeft} hot={view.encounter.timeRemainingMs < 12000} />
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

function TopBar({ view, levelProgress, onSettings }: { view: OceanRunView; levelProgress: AccountLevelProgress; onSettings: () => void }) {
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
					<Coins aria-hidden="true" />
					<span>{view.collection.coins.toLocaleString()}</span>
				</div>
				<div className="currency-pill panel-chrome">
					<Gem aria-hidden="true" />
					<span>{view.collection.materials.toLocaleString()}</span>
				</div>
				<button className="icon-button panel-chrome" aria-label="Settings" onClick={onSettings}>
					<Settings aria-hidden="true" />
				</button>
			</section>
		</header>
	)
}

function MainMenu({
	view,
	levelProgress,
	caughtCount,
	totalCount,
	onStart,
	onContinue,
	onCollection,
	onSettings,
}: {
	view: OceanRunView
	levelProgress: AccountLevelProgress
	caughtCount: number
	totalCount: number
	onStart: () => void
	onContinue: () => void
	onCollection: () => void
	onSettings: () => void
}) {
	const featuredFish = fishSpecies.filter((fish) => fish.rarity !== "common").slice(0, 3)
	return (
		<section className="menu-layer" data-testid="main-menu">
			<div className="menu-top">
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
				<button className="icon-button panel-chrome" aria-label="Settings" onClick={onSettings}>
					<Settings aria-hidden="true" />
				</button>
			</div>

			<div className="menu-hero">
				<LogoMark />
				<p>Hook rare fish with clean rhythm, build skill combos, and fill the Shallow Coast collection.</p>
				<div className="menu-actions">
					<button className="primary-action" onClick={onStart}>
						<Play aria-hidden="true" />
						Start Expedition
					</button>
					<button className="secondary-action" onClick={onContinue}>
						<Compass aria-hidden="true" />
						Continue Run
					</button>
					<button className="secondary-action" onClick={onCollection}>
						<BookOpen aria-hidden="true" />
						Collection {caughtCount}/{totalCount}
					</button>
				</div>
			</div>

			<div className="featured-collection">
				{featuredFish.map((fish, index) => (
					<article key={fish.id} className={`featured-card rarity-${fish.rarity}`}>
						<img src={`/assets/ocean/sprites/fish/${fish.assetKey}_swim_${index % 2}.png`} alt="" />
						<strong>{fish.name}</strong>
						<StarRow rarity={fish.rarity} />
					</article>
				))}
			</div>
			<span className="menu-current-fish">Next mark: {view.fish.name}</span>
		</section>
	)
}

function PreparationScreen({
	view,
	activeSkills,
	levelProgress,
	onBack,
	onStart,
	onChooseRoute,
}: {
	view: OceanRunView
	activeSkills: readonly FishingSkill[]
	levelProgress: AccountLevelProgress
	onBack: () => void
	onStart: () => void
	onChooseRoute: (nodeId: string) => void
}) {
	return (
		<section className="prep-layer" data-testid="prep-screen">
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
					<h2>Skill Build</h2>
					<div className="prep-skill-grid">
						{activeSkills.map((skill) => (
							<article key={skill.id} className={`prep-skill ${skill.type}`}>
								<img src={`/assets/ocean/ui/ui_skill_${skill.id}_default.png`} alt="" />
								<div>
									<strong>{skill.name}</strong>
									<span>{skill.description}</span>
								</div>
							</article>
						))}
					</div>
				</section>
			</div>
		</section>
	)
}

function LogoMark() {
	return (
		<section className="logo-mark" aria-label="Typecade">
			<span className="hook">Q</span>
			<span>TYPE</span>
			<span>CADE</span>
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
				<img src={`/assets/ocean/sprites/fish/${fish.assetKey}_idle_0.png`} alt="" />
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
								<img src={`/assets/ocean/sprites/fish/${fish.assetKey}_idle_0.png`} alt="" />
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
				<img src={`/assets/ocean/sprites/fish/${fish.assetKey}_swim_1.png`} alt="" />
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

function ResultToast({ view }: { view: OceanRunView }) {
	const result = view.lastResult
	if (!result) {
		return null
	}
	return (
		<section className={`result-toast panel-chrome ${result.caught ? "caught" : "escaped"}`} data-testid="result-toast">
			<CheckCircle2 aria-hidden="true" />
			<div>
				<strong>{result.caught ? "Catch secured" : "Line lost"}</strong>
				<span>{view.fish.name} / {result.sizeKg} kg / Q{Math.round(result.quality * 100)}</span>
				<small>+{result.rewards.coins} coins / +{result.rewards.xp} XP</small>
			</div>
		</section>
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
	return (
		<section className="overlay-panel panel-chrome" data-testid="overlay-panel">
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
