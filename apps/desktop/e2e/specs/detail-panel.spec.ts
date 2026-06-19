import { test, expect } from "@playwright/test"

async function setupWithMessages(page, name: string) {
  await page.getByLabel("New connection").click()
  await page.waitForSelector('text=New Connection')

  const dialog = page.getByRole("dialog")
  await dialog.getByText("AWS SQS").click()
  await page.waitForSelector('text=Configure AWS SQS')

  await dialog.getByPlaceholder("My Connection").fill(name)
  await dialog.getByPlaceholder("us-east-1").fill("us-east-1")
  await dialog.getByPlaceholder("AKIA...").fill("test-key")
  await dialog.getByPlaceholder("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").fill("test-secret")

  await dialog.getByRole("button", { name: "Connect" }).click()
  await page.waitForTimeout(500)

  await page.getByText(name).first().click()
  await page.getByText("orders").first().click()
  await page.waitForTimeout(300)

  await page.evaluate(() => {
    const conn = window.__connections[0]
    window.__msgCounter = 1
    window.__messages[conn.id] = {
      orders: [
        {
          id: "msg-1",
          queue: "orders",
          payload: { key: "value" },
          timestamp: new Date("2024-01-15T10:30:00Z"),
          headers: { "content-type": "application/json" },
        },
      ],
    }
  })

  await page.locator('button:has-text("Consume")').first().click()
  await expect(page.getByText("msg-1")).toBeVisible({ timeout: 5000 })
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: "e2e/fixtures/apiMock.js" })
  await page.goto("/")
  await page.waitForSelector("text=CONNECTIONS")
})

test("detail panel is not present when no message is selected", async ({ page }) => {
  await expect(page.getByLabel("Close detail panel")).not.toBeVisible()
})

test("opens detail panel when clicking a message row", async ({ page }) => {
  await setupWithMessages(page, "DetailTest")

  await page.getByText("msg-1").first().click()

  await expect(page.getByLabel("Close detail panel")).toBeVisible()
  await expect(page.getByText("Message Id:")).toBeVisible()
})

test("detail panel shows message metadata and payload", async ({ page }) => {
  await setupWithMessages(page, "DetailTest")

  await page.getByText("msg-1").first().click()
  await page.waitForTimeout(300)

  await expect(page.getByText("msg-1").first()).toBeVisible()
  await expect(page.getByText("orders").first()).toBeVisible()
  await expect(page.getByText("Payload").last()).toBeVisible()
  await expect(page.getByLabel("Copy Payload")).toBeVisible()
  await expect(page.getByLabel("Copy Message ID")).toBeVisible()
})

test("closes detail panel when clicking X", async ({ page }) => {
  await setupWithMessages(page, "DetailTest")

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()

  await page.getByLabel("Close detail panel").click()
  await expect(page.getByLabel("Close detail panel")).not.toBeVisible()
})

test("delete button removes message and closes panel", async ({ page }) => {
  await setupWithMessages(page, "DetailTest")

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()

  await page.getByRole("button", { name: "Delete" }).first().click()
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click()
  await expect(page.getByText("Message deleted")).toBeVisible({ timeout: 5000 })
  await expect(page.getByLabel("Close detail panel")).not.toBeVisible()
})

test("replay button publishes a duplicate message", async ({ page }) => {
  await setupWithMessages(page, "DetailTest")

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()

  await page.getByRole("button", { name: "Replay" }).click()
  await expect(page.getByText("Message replayed")).toBeVisible({ timeout: 5000 })

  await page.locator('button:has-text("Consume")').first().click()
  await expect(page.getByText("msg-2")).toBeVisible({ timeout: 5000 })
})

test("release button removes message and closes panel", async ({ page }) => {
  await setupWithMessages(page, "DetailTest")

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()

  await page.getByRole("button", { name: "Release" }).last().click()
  await expect(page.getByText("Message released")).toBeVisible({ timeout: 5000 })
  await expect(page.getByLabel("Close detail panel")).not.toBeVisible()
})

test("replay and delete buttons are disabled when not connected", async ({ page }) => {
  await setupWithMessages(page, "DetailTest")

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()

  const row = page.locator('[data-active="true"]').first()
  const disconnectBtn = row.getByLabel("Disconnect DetailTest")
  await disconnectBtn.click()
  await page.waitForTimeout(500)

  await expect(page.getByRole("button", { name: "Replay" }).last()).toBeDisabled()
  await expect(page.getByRole("button", { name: "Release" }).last()).toBeDisabled()
  await expect(page.getByRole("button", { name: "Delete" }).last()).toBeDisabled()
})
