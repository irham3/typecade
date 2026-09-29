import { afterEach, describe, expect, it, vi } from "vitest"

const rootMocks = vi.hoisted(() => ({
	createRoot: vi.fn(() => ({ render: vi.fn() })),
}))

vi.mock("react-dom/client", () => ({ createRoot: rootMocks.createRoot }))
vi.mock("./App", () => ({ App: () => null }))

describe("web entry point", () => {
	afterEach(() => {
		document.body.replaceChildren()
		vi.restoreAllMocks()
		vi.resetModules()
		rootMocks.createRoot.mockClear()
	})

	it("mounts the app in the document root", async () => {
		const element = document.createElement("div")
		element.id = "root"
		document.body.append(element)
		await import(/* @vite-ignore */ new URL("./main.tsx?root-present", import.meta.url).href)
		expect(rootMocks.createRoot).toHaveBeenCalledWith(element)
		expect(rootMocks.createRoot.mock.results[0]?.value.render).toHaveBeenCalledOnce()
	})

	it("fails clearly when the HTML root element is missing", async () => {
		const lookup = vi.spyOn(document, "getElementById").mockReturnValue(null)
		await expect(import(/* @vite-ignore */ new URL("./main.tsx?root-missing", import.meta.url).href)).rejects.toThrow("Root element not found")
		expect(lookup).toHaveBeenCalledWith("root")
		expect(rootMocks.createRoot).not.toHaveBeenCalled()
	})
})
