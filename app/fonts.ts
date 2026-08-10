import { JetBrains_Mono, Press_Start_2P } from "next/font/google"

export const fontJbm = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-jbm",
	display: "swap",
})

export const fontPs2 = Press_Start_2P({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-ps2",
	display: "swap",
})
