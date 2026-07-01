import { test, expect } from "@playwright/test"
import { createConnection } from "../fixtures/helpers"

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: "e2e/fixtures/apiMock.js" })
  await page.goto("/")
  await page.waitForSelector("text=CONNECTIONS")
})

test("shows empty messages state", async ({ page }) => {
  await createConnection(page, "MsgTest")
  await page.getByText("MsgTest").first().click()
  await expect(page.getByText("Consume a queue to see messages")).toBeVisible()
})

test("consume button is disabled when not connected", async ({ page }) => {
  await createConnection(page, "MsgTest")
  await page.getByText("MsgTest").first().click()

  const row = page.locator('[data-active="true"]').first()
  const disconnectBtn = row.getByLabel("Disconnect MsgTest")
  await disconnectBtn.click()
  await page.waitForTimeout(500)

  const consumeBtn = page.locator('button:has-text("Consume")')
  await expect(consumeBtn).toBeDisabled()
})

test("consume button is disabled when connected but no queue selected", async ({ page }) => {
  await createConnection(page, "MsgTest")
  await page.getByText("MsgTest").first().click()

  const consumeBtn = page.locator('button:has-text("Consume")')
  await expect(consumeBtn).toBeDisabled()
})

test("publish button is disabled when connected but no queue selected", async ({ page }) => {
  await createConnection(page, "MsgTest")
  await page.getByText("MsgTest").first().click()

  const publishBtn = page.locator('button:has-text("Publish")')
  await expect(publishBtn).toBeDisabled()
})

test("shows table header columns", async ({ page }) => {
  await expect(page.getByText("Time").first()).toBeVisible()
  await expect(page.getByText("Message ID").first()).toBeVisible()
  await expect(page.getByText("Size").first()).toBeVisible()
  await expect(page.getByText("Payload").first()).toBeVisible()
})

test("has filter inputs", async ({ page }) => {
  await expect(page.getByPlaceholder("Filter time...")).toBeVisible()
  await expect(page.getByPlaceholder("Filter ID...")).toBeVisible()
  await expect(page.getByPlaceholder("Filter payload...")).toBeVisible()
})

test("purge button exists and is clickable", async ({ page }) => {
  await createConnection(page, "MsgTest")
  await page.getByText("MsgTest").first().click()
  await page.getByText("orders").first().click()
  const purgeBtn = page.getByRole("button", { name: "Purge" })
  await expect(purgeBtn).toBeVisible()
  await expect(purgeBtn).toBeEnabled()
})

test("release queue button exists and releases messages", async ({ page }) => {
  await createConnection(page, "MsgTest")
  await page.getByText("MsgTest").first().click()
  await page.getByText("orders").first().click()
  await page.waitForTimeout(300)

  const releaseBtn = page.getByRole("button", { name: "Release" })
  await expect(releaseBtn).toBeVisible()
  await expect(releaseBtn).toBeEnabled()

  await page.locator('button:has-text("Consume")').first().click()
  await expect(page.getByText("No messages")).toBeVisible({ timeout: 5000 })

  await page.evaluate(() => {
    const conn = (window as any).__connections[0]
    ;(window as any).__messages[conn.id] = {
      orders: [
        {
          id: "msg-1",
          queue: "orders",
          payload: { key: "value" },
          timestamp: new Date(),
        },
      ],
    }
  })

  await page.locator('button:has-text("Consume")').first().click()
  await expect(page.getByText("msg-1")).toBeVisible({ timeout: 5000 })

  await releaseBtn.click()
  await expect(page.getByText("Messages released")).toBeVisible({ timeout: 5000 })
  await expect(page.getByText("No messages")).toBeVisible({ timeout: 5000 })
})
