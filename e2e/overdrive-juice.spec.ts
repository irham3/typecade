import { test, expect } from "@playwright/test"

test("visual smoke and combat feedback", async ({ page }) => {
  // Use a deterministic seed via query param or storage if supported, but here we just test feedback.
  page.on('console', msg => console.log('BROWSER:', msg.text()))
  page.on('pageerror', err => console.log('BROWSER ERROR:', err))
  await page.goto("/overdrive?seed=playwright_juice_test")
  
  await page.getByRole("button", { name: "Play" }).click()
  
  const host = page.locator("[data-pixi-host]")
  const canvas = host.locator("canvas")
  await expect(canvas).toHaveCount(1)
  
  // Wait for canvas to be fully initialized and scene drawn
  await page.waitForTimeout(1000)
  
  const scoreBefore = await page.getByText("Stage Score").locator("..").locator("div").last().innerText()
  
  await page.screenshot({ path: "test-results/overdrive-juice-before.png", fullPage: true })
  
  // Read current word from DOM mirror
  const currentWord = await host.getAttribute("data-current-word")
  expect(currentWord).toBeTruthy()
  console.log("Typing word:", currentWord)
  
  // Type the word and submit with space
  await page.keyboard.type(currentWord! + " ", { delay: 50 })
  
  await page.waitForTimeout(1000) // Wait for destruction and popup animation
  
  await page.screenshot({ path: "test-results/overdrive-juice-after.png", fullPage: true })
  
  const scoreAfter = await page.getByText("Stage Score").locator("..").locator("div").last().innerText()
  
  const numBefore = parseInt(scoreBefore.replace(/,/g, ""), 10)
  const numAfter = parseInt(scoreAfter.replace(/,/g, ""), 10)
  
  expect(numAfter).toBeGreaterThan(numBefore)
})
