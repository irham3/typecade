import { afterEach, describe, expect, it, vi } from "vitest"

const rootMocks = vi.hoisted(() => ({
	createRoot: vi.fn(() => ({ render: vi.fn() })),
}))

vi.mock("react-dom/client", () => ({ createRoot: rootMocks.createRoot }))
vi.mock("./App", () => ({ App: () => null }))

describe("web entry point", () => {
	afterEach(() => {
		document.body.replaceChildren()
		vi.resetModules()
		rootMocks.createRoot.mockClear()
	})

	it("mounts the app in the document root", async () => {
		const element = document.createElement("div")
		element.id = "root"
		document.body.append(element)
		await import("./main")
		expect(rootMocks.createRoot).toHaveBeenCalledWith(element)
		expect(rootMocks.createRoot.mock.results[0]?.value.render).toHaveBeenCalledOnce()
	})
})
