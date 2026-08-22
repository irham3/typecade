import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactElement, ReactNode } from "react"
import {
	Anchor,
	BookOpen,
	CheckCircle2,
	ClipboardList,
	Coins,
	Fish,
	Gem,
	Hourglass,
	Radar,
	Settings,
	Shield,
	ShoppingBag,
	Sparkles,
	Target,
	Waves,
	Zap,
} from "lucide-react"
import type { FishingSkill, Rarity } from "@typecade/contracts"
import { fishSpecies } from "@typecade/content"
import { useOceanRun, type VolumeState } from "./hooks/useOceanRun"

type Panel = "fish" | "collection" | "tasks" | "shop" | "settings" | null

const rarityStars: Record<Rarity, number> = {
	common: 1,
	uncommon: 2,
	rare: 3,
	boss: 5,
}

const skillIcons: Record<string, ReactElement> = {
	cast_net: <Waves aria-hidden="true" />,
	steel_line: <Shield aria-hidden="true" />,
	sonar: <Radar aria-hidden="true" />,
	calm_current: <Waves aria-hidden="true" />,
	perfect_bait: <Sparkles aria-hidden="true" />,
	reel_mastery: <Zap aria-hidden="true" />,
}

export function App() {
	const hostRef = useRef<HTMLDivElement | null>(null)
	const {
		bridge,
		view,
		activeSkills,
		chooseRoute,
		useSkill,
		setVolume,
		setReducedMotion,
		startFreshRun,
	} = useOceanRun()
	const [panel, setPanel] = useState<Panel>(null)

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
	const timeLeft = formatTime(view.encounter.timeRemainingMs)
	const tensionPercent = Math.round(view.encounter.tension)
	const progressPercent = Math.round(view.encounter.progress * 100)
	const durabilityPercent = Math.round(view.encounter.durability)
	const routeProgress = `${view.expedition.currentZoneIndex + 1}/3`
	const encounterLabel = `${getEncounterNumber(view.expedition.currentZoneIndex, view.expedition.currentEncounterIndex)}/10`

	return (
		<main className="game-shell" data-testid="ocean-game-shell">
			<div ref={hostRef} className="game-canvas" data-testid="phaser-gameplay" />
			<div className="hud" data-testid="ocean-hud">
				<header className="topbar" data-testid="topbar">
					<section className="player-badge panel-chrome">
						<div className="avatar">
							<Fish aria-hidden="true" />
						</div>
						<div>
							<strong>WaveRider</strong>
							<span>
								<Sparkles aria-hidden="true" /> {view.collection.xp}
							</span>
						</div>
					</section>

					<section className="logo-mark" aria-label="Typecade">
						<span className="hook">Q</span>
						<span>TYPE</span>
						<span>CADE</span>
					</section>

					<section className="currency-row">
						<div className="currency-pill panel-chrome">
							<Coins aria-hidden="true" />
							<span>{view.collection.coins.toLocaleString()}</span>
						</div>
						<div className="currency-pill panel-chrome">
							<Gem aria-hidden="true" />
							<span>{view.collection.materials.toLocaleString()}</span>
						</div>
						<button className="icon-button panel-chrome" aria-label="Settings" onClick={() => setPanel(panel === "settings" ? null : "settings")}>
							<Settings aria-hidden="true" />
						</button>
					</section>
				</header>

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

				<FishInfoCard fish={view.fish} />

				<section className="bottom-console" data-testid="typing-console">
					<div className="tension-wrap">
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
							<span>{view.currentInput}</span>
							<span className="cursor" />
						</div>
					</div>

					<div className="stat-row panel-chrome">
						<Stat icon={<Zap aria-hidden="true" />} label="COMBO" value={`x${Math.max(1, view.encounter.combo)}`} />
						<Stat icon={<Target aria-hidden="true" />} label="ACCURACY" value={`${Math.round(view.metrics.accuracy)}%`} />
						<Stat icon={<Hourglass aria-hidden="true" />} label="TIME LEFT" value={timeLeft} />
					</div>

					<div className="progress-stack">
						<SmallMeter label="REEL" value={progressPercent} />
						<SmallMeter label="LINE" value={durabilityPercent} danger={durabilityPercent < 35} />
						<SmallMeter label="SKILL" value={Math.round(view.encounter.skillEnergy)} />
					</div>
				</section>

				<section className="skill-dock panel-chrome" data-testid="skill-dock">
					{activeSkills.map((skill, index) => (
						<SkillButton key={skill.id} skill={skill} index={index + 1} energy={view.encounter.skillEnergy} onUse={useSkill} />
					))}
				</section>

				{view.lastResult ? (
					<section className="result-toast panel-chrome" data-testid="result-toast">
						<CheckCircle2 aria-hidden="true" />
						<div>
							<strong>{view.lastResult.caught ? "Catch secured" : "Line lost"}</strong>
							<span>{view.fish.name} / {view.lastResult.sizeKg} kg / Q{Math.round(view.lastResult.quality * 100)}</span>
						</div>
					</section>
				) : null}

				{view.expedition.complete ? (
					<section className="complete-panel panel-chrome" data-testid="complete-panel">
						<strong>Shallow Coast cleared</strong>
						<span>{caughtCount}/{totalCount} species recorded</span>
						<button onClick={startFreshRun}>Sail Again</button>
					</section>
				) : null}

				{panel === "collection" ? <CollectionPanel onClose={() => setPanel(null)} collection={view.collection} /> : null}
				{panel === "tasks" ? <RoutePanel onClose={() => setPanel(null)} choices={view.routeChoices} selectedId={view.selectedRoute.id} chooseRoute={chooseRoute} log={view.log} /> : null}
				{panel === "shop" ? <SkillsPanel onClose={() => setPanel(null)} skills={activeSkills} /> : null}
				{panel === "settings" ? <SettingsPanel volumes={view.volumes} reducedMotion={view.reducedMotion} setVolume={setVolume} setReducedMotion={setReducedMotion} onClose={() => setPanel(null)} /> : null}
				{panel === "fish" ? <FishPanel onClose={() => setPanel(null)} fish={view.fish} /> : null}
			</div>
		</main>
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

function FishInfoCard({ fish }: { fish: { name: string; rarity: Rarity; lore: string; assetKey: string } }) {
	return (
		<aside className="fish-card panel-chrome" data-testid="fish-card">
			<h2>{fish.name}</h2>
			<strong>{fish.rarity.toUpperCase()}</strong>
			<StarRow rarity={fish.rarity} />
			<div className="fish-frame">
				<img src={`/assets/ocean/sprites/fish/${fish.assetKey}_idle_0.png`} alt="" />
			</div>
			<p>{fish.lore}</p>
		</aside>
	)
}

function StarRow({ rarity }: { rarity: Rarity }) {
	const filled = rarityStars[rarity]
	return (
		<div className="stars" aria-label={`${filled} star rarity`}>
			{Array.from({ length: 5 }, (_, index) => (
				<span key={index} className={index < filled ? "filled" : ""}>★</span>
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

function Stat({ icon, label, value }: { icon: ReactElement; label: string; value: string }) {
	return (
		<div className="stat">
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

function SkillButton({ skill, index, energy, onUse }: { skill: FishingSkill; index: number; energy: number; onUse: (skillId: string) => void }) {
	const cost = skill.id === "cast_net" ? 35 : skill.id === "calm_current" ? 30 : skill.id === "sonar" ? 15 : 0
	const usable = skill.type === "active" && energy >= cost
	return (
		<button className={`skill-button ${skill.type}`} onClick={() => usable && onUse(skill.id)} disabled={skill.type === "passive" || !usable} title={skill.name}>
			<span className="skill-key">{index}</span>
			{skillIcons[skill.id]}
			<span>{skill.name}</span>
		</button>
	)
}

function CollectionPanel({ collection, onClose }: { collection: ReturnType<typeof useOceanRun>["view"]["collection"]; onClose: () => void }) {
	return (
		<OverlayPanel title="Collection" onClose={onClose}>
			<div className="collection-grid">
				{fishSpecies.map((fish) => {
					const record = collection.records[fish.id]
					return (
						<article key={fish.id} className={`collection-card ${record ? "caught" : ""}`}>
							<img src={`/assets/ocean/sprites/fish/${fish.assetKey}_idle_0.png`} alt="" />
							<strong>{record ? fish.name : "Unknown"}</strong>
							<span>{record ? `${record.largestSizeKg} kg / ${record.count}x` : fish.rarity}</span>
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
	onClose,
}: {
	choices: ReturnType<typeof useOceanRun>["view"]["routeChoices"]
	selectedId: string
	chooseRoute: (nodeId: string) => void
	log: string[]
	onClose: () => void
}) {
	return (
		<OverlayPanel title="Route" onClose={onClose}>
			<div className="route-choice-grid">
				{choices.map((choice) => (
					<button key={choice.id} className={choice.id === selectedId ? "selected" : ""} onClick={() => chooseRoute(choice.id)}>
						<strong>{choice.name}</strong>
						<span>Risk {Math.round(choice.risk * 100)}%</span>
						<span>Reward x{choice.rewardMultiplier.toFixed(2)}</span>
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

function SkillsPanel({ skills, onClose }: { skills: typeof fishingSkills; onClose: () => void }) {
	return (
		<OverlayPanel title="Skills" onClose={onClose}>
			<div className="skill-list">
				{skills.map((skill) => (
					<article key={skill.id}>
						{skillIcons[skill.id]}
						<div>
							<strong>{skill.name}</strong>
							<span>{skill.description}</span>
						</div>
					</article>
				))}
			</div>
		</OverlayPanel>
	)
}

function FishPanel({ fish, onClose }: { fish: ReturnType<typeof useOceanRun>["view"]["fish"]; onClose: () => void }) {
	return (
		<OverlayPanel title={fish.name} onClose={onClose}>
			<div className="fish-detail">
				<img src={`/assets/ocean/sprites/fish/${fish.assetKey}_swim_1.png`} alt="" />
				<StarRow rarity={fish.rarity} />
				<p>{fish.lore}</p>
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

function OverlayPanel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
	return (
		<section className="overlay-panel panel-chrome" data-testid="overlay-panel">
			<header>
				<strong>{title}</strong>
				<button onClick={onClose} aria-label="Close">x</button>
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
