import { test, expect } from "@playwright/test"
import { createConnection } from "../fixtures/helpers"

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: "e2e/fixtures/apiMock.js" })
  await page.goto("/")
  await page.waitForSelector("text=CONNECTIONS")
})

test("publishes a message with default payload", async ({ page }) => {
  await createConnection(page, "PubTest")
  await page.getByText("PubTest").first().click()

  await page.getByText("orders").first().click()
  await page.waitForTimeout(300)
  await page.locator('button:has-text("Publish")').last().click()
  await expect(page.getByText("Message published")).toBeVisible()
})

test("publish button is disabled when not connected", async ({ page }) => {
  await createConnection(page, "PubTest")
  await page.getByText("PubTest").first().click()

  await page.getByText("orders").first().click()
  await page.waitForTimeout(300)

  const row = page.locator('[data-active="true"]').first()
  const disconnectBtn = row.getByLabel("Disconnect PubTest")
  await disconnectBtn.click()
  await page.waitForTimeout(500)

  const publishBtn = page.locator('button:has-text("Publish")').last()
  await expect(publishBtn).toBeDisabled()
})
