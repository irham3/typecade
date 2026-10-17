import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles.css"
import "./styles/theme.css"
import "./styles/dialogs.css"
import "./styles/title.css"
import "./styles/hud.css"
import "./styles/bestiary.css"
import "./styles/armory.css"
import "./styles/skilltree.css"
import "./styles/feedback.css"

const root = document.getElementById("root")

if (!root) {
	throw new Error("Root element not found")
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
