export async function deriveDailySeed(
	secret: string,
	runDate: string,
	language: "EN" | "ID",
	rulesetVersion: string,
) {
	const material = `${secret}:${runDate}:${language}:${rulesetVersion}`
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material))
	const hex = [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")
	return `daily-v1-${hex.slice(0, 32)}`
}
