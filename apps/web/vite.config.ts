import react from "@vitejs/plugin-react"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const appDir = fileURLToPath(new URL(".", import.meta.url))
const rootDir = path.resolve(appDir, "../..")

export default defineConfig({
	root: appDir,
	plugins: [react()],
	publicDir: "public",
	build: {
		outDir: path.resolve(rootDir, "dist/web"),
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			"@": rootDir,
			"@typecade/contracts": path.resolve(rootDir, "packages/contracts/src/index.ts"),
			"@typecade/content": path.resolve(rootDir, "packages/content/src/index.ts"),
			"@typecade/game-rules": path.resolve(rootDir, "packages/game-rules/src/index.ts"),
			"@typecade/typing-engine": path.resolve(rootDir, "packages/typing-engine/src/index.ts"),
		},
	},
	server: {
		port: 3000,
		strictPort: false,
	},
})
