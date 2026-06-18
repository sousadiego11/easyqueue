import { test, expect } from "@playwright/test"

async function createConnection(page, name: string) {
  await page.getByLabel("New connection").click()
  await page.waitForSelector('text=New Connection')

  const dialog = page.getByRole("dialog")
  await dialog.getByText("AWS SQS").click()
  await page.waitForSelector('text=Configure AWS SQS')

  await dialog.getByPlaceholder("My Connection").fill(name)
  await dialog.getByPlaceholder("us-east-1").fill("us-east-1")
  await dialog.getByPlaceholder("AKIA...").fill("test-key")
  await dialog.getByPlaceholder("••••••••").fill("test-secret")

  await dialog.getByRole("button", { name: "Connect" }).click()
  await page.waitForTimeout(500)
}

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
