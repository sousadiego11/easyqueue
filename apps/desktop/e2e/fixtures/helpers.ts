import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

export async function createConnection(page: Page, name: string) {
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

export async function setupWithMessages(page: Page, name: string) {
  await createConnection(page, name)

  await page.getByText(name).first().click()
  await page.getByText("orders").first().click()
  await page.waitForTimeout(300)

  await page.evaluate(() => {
    const conn = (window as any).__connections[0]
    ;(window as any).__msgCounter = 1
    ;(window as any).__messages[conn.id] = {
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
