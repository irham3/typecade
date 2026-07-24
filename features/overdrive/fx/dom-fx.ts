// Reads Tailwind v4 theme tokens so FX colors stay in sync with design tokens.
export function token(name: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#3BF562"
}

export function shake() {
	const el = document.getElementById("game-root")
	if (!el) return
	el.classList.remove("fx-shake")
	void el.offsetWidth // restart the animation
	el.classList.add("fx-shake")
}

export function pulse(el: HTMLElement | null) {
	if (!el) return
	el.classList.remove("fx-pulse")
	void el.offsetWidth
	el.classList.add("fx-pulse")
}

let hitstopUntil = 0
export function hitstop(ms: number) { hitstopUntil = performance.now() + ms }
export function inHitstop(now: number) { return now < hitstopUntil }

export function floatScore(x: number, y: number, text: string, colorToken = "--color-acc-yellow") {
	const el = document.createElement("span")
	el.textContent = text
	el.className = "fx-float"
	el.style.left = `${x}px`
	el.style.top = `${y - 40}px`
	el.style.color = `var(${colorToken})`
	document.body.appendChild(el)
	el.addEventListener("animationend", () => el.remove())
	// Safety net in case animationend never fires (reduced motion):
	setTimeout(() => el.remove(), 700)
}
