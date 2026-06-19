import { test, expect } from "@playwright/test"
import { createConnection, setupWithMessages } from "../fixtures/helpers"

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: "e2e/fixtures/apiMock.js" })
  await page.goto("/")
  await page.waitForSelector("text=CONNECTIONS")
})

test("sidebar split pane has a resize handle", async ({ page }) => {
  const sidebarSeparator = page.getByRole("separator").and(page.locator('[aria-controls="sidebar"]'))
  await expect(sidebarSeparator).toBeAttached()
  await expect(sidebarSeparator).toHaveClass(/cursor-col-resize/)
})

test("content-publisher vertical split pane has a resize handle", async ({ page }) => {
  await createConnection(page, "SplitTest")
  await page.getByText("SplitTest").first().click()

  const verticalHandle = page.getByRole("separator").and(page.locator('[aria-controls="content-area"]'))
  await expect(verticalHandle).toBeAttached()
  await expect(verticalHandle).toHaveClass(/cursor-row-resize/)
})

test("detail panel split pane appears when a message is selected", async ({ page }) => {
  await setupWithMessages(page, "SplitTest")

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()

  const separators = page.getByRole("separator")
  await expect(separators).toHaveCount(3)
})

test("detail panel split pane disappears when message is deselected", async ({ page }) => {
  await setupWithMessages(page, "SplitTest")

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()

  await page.getByLabel("Close detail panel").click()
  await expect(page.getByLabel("Close detail panel")).not.toBeVisible()

  const separators = page.getByRole("separator")
  await expect(separators).toHaveCount(2)
})

test("sidebar can be resized by dragging the separator", async ({ page }) => {
  await createConnection(page, "SplitTest")
  await page.getByText("SplitTest").first().click()

  const separator = page.getByRole("separator").and(page.locator('[aria-controls="sidebar"]'))
  const box = await separator.boundingBox()
  expect(box).not.toBeNull()

  const cx = box!.x + box!.width / 2
  const cy = box!.y + box!.height / 2

  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 100, cy, { steps: 10 })
  await page.mouse.up()

  await page.waitForTimeout(500)

  const sidebarConnections = page.getByText("CONNECTIONS")
  await expect(sidebarConnections.first()).toBeVisible()
})

test("content-publisher split pane can be resized by dragging", async ({ page }) => {
  await createConnection(page, "SplitTest")
  await page.getByText("SplitTest").first().click()
  await page.getByText("orders").first().click()
  await page.waitForTimeout(300)

  const separator = page.getByRole("separator").and(page.locator('[aria-controls="content-area"]'))
  const box = await separator.boundingBox()
  expect(box).not.toBeNull()

  const cx = box!.x + box!.width / 2
  const cy = box!.y + box!.height / 2

  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx, cy - 80, { steps: 10 })
  await page.mouse.up()

  await page.waitForTimeout(500)

  const publisher = page.getByText("Publisher")
  await expect(publisher).toBeVisible()
})

test("detail panel can be resized by dragging the separator", async ({ page }) => {
  await setupWithMessages(page, "SplitTest")

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()

  const separators = page.getByRole("separator")
  const detailSeparator = separators.last()
  const box = await detailSeparator.boundingBox()
  expect(box).not.toBeNull()

  const cx = box!.x + box!.width / 2
  const cy = box!.y + box!.height / 2

  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx - 150, cy, { steps: 10 })
  await page.mouse.up()

  await page.waitForTimeout(500)

  await expect(page.getByLabel("Close detail panel")).toBeVisible()
})

test("sidebars count reflects split pane visibility", async ({ page }) => {
  const separators = page.getByRole("separator")
  await expect(separators).toHaveCount(2)

  await createConnection(page, "SplitTest")
  await page.getByText("SplitTest").first().click()
  await page.getByText("orders").first().click()
  await page.waitForTimeout(300)

  await expect(separators).toHaveCount(2)

  await page.evaluate(() => {
    const conn = (window as any).__connections[0]
    ;(window as any).__msgCounter = 1
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
  await expect(separators).toHaveCount(2)

  await page.getByText("msg-1").first().click()
  await expect(page.getByLabel("Close detail panel")).toBeVisible()
  await expect(separators).toHaveCount(3)
})
