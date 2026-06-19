import { test, expect } from "@playwright/test"
import { createConnection } from "../fixtures/helpers"

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: "e2e/fixtures/apiMock.js" })
  await page.goto("/")
  await page.waitForSelector("text=CONNECTIONS")
})

test("shows empty state when no connections exist", async ({ page }) => {
  await expect(page.getByText("No connections")).toBeVisible()
})

test("creates a new connection via modal", async ({ page }) => {
  await createConnection(page, "My SQS")
  await expect(page.getByText("My SQS").first()).toBeVisible()
})

test("selects a connection when clicked", async ({ page }) => {
  await createConnection(page, "TestConn")
  await page.getByText("TestConn").first().click()

  const selected = page.locator('[data-active="true"]').first()
  await expect(selected).toContainText("TestConn")
})

test("toggles connection on/off with power button", async ({ page }) => {
  await createConnection(page, "Tog")
  await page.getByText("Tog").first().click()

  const row = page.locator('[data-active="true"]').first()
  await expect(row).toBeVisible()

  const disconnectBtn = row.getByLabel("Disconnect Tog")
  await disconnectBtn.click()
  await page.waitForTimeout(500)

  const connectBtn = row.getByLabel("Connect Tog")
  await expect(connectBtn).toBeVisible()
})
