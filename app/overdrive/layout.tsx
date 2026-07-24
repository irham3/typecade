import { fontJbm, fontPs2 } from "@/app/fonts"
import { ParticleLayer } from "@/features/overdrive/fx/particle-layer"

export default function OverdriveLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className={`${fontJbm.variable} ${fontPs2.variable} min-h-dvh bg-bg-0 font-game text-text-hi antialiased`}>
			<ParticleLayer />
			{children}
		</div>
	)
}
