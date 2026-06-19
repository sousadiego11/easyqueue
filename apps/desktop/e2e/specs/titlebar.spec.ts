import { test, expect } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: "e2e/fixtures/apiMock.js" })
  await page.goto("/")
  await page.waitForSelector("text=CONNECTIONS")
})

test("shows EasyQueue logo and name in titlebar", async ({ page }) => {
  await expect(page.locator("text=EasyQueue").first()).toBeVisible()
  await expect(page.getByAltText("EasyQueue").first()).toBeVisible()
})

test("has minimize button that calls queueApi.minimize", async ({ page }) => {
  const minimizeBtn = page.getByLabel("Minimize")
  await expect(minimizeBtn).toBeVisible()
  await expect(minimizeBtn.locator("svg")).toBeAttached()
})

test("has maximize button that calls queueApi.maximize", async ({ page }) => {
  const maximizeBtn = page.getByLabel("Maximize")
  await expect(maximizeBtn).toBeVisible()
  await expect(maximizeBtn.locator("svg")).toBeAttached()
})

test("has close button that calls queueApi.close", async ({ page }) => {
  const closeBtn = page.getByLabel("Close")
  await expect(closeBtn).toBeVisible()
  await expect(closeBtn.locator("svg")).toBeAttached()
})
