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
