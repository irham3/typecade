import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles.css"
import "./styles/ornate.css"
import "./styles/title.css"
import "./styles/hud.css"
import "./styles/bestiary.css"

const root = document.getElementById("root")

if (!root) {
	throw new Error("Root element not found")
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
