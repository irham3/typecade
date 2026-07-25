import { notFound } from "next/navigation"
import { OverdriveApp } from "@/features/overdrive/components/overdrive-app"

export default function OverdrivePage() {
	if (process.env.NEXT_PUBLIC_OVERDRIVE !== "true") notFound()
	return <OverdriveApp />
}
