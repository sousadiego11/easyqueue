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

test("edits a connection name via edit button", async ({ page }) => {
  await createConnection(page, "OldName")

  await page.getByText("OldName").first().hover()
  const editBtn = page.getByRole("button", { name: "Edit OldName" }).first()
  await expect(editBtn).toBeVisible()
  await editBtn.click()

  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByText("Edit AWS SQS")).toBeVisible()

  const nameInput = page.getByPlaceholder("My Connection")
  await nameInput.clear()
  await nameInput.fill("NewName")

  await page.getByRole("button", { name: "Save" }).click()
  await page.waitForTimeout(500)

  await expect(page.getByText("NewName").first()).toBeVisible()
})

test("switching connections clears queue selection and disables action buttons", async ({ page }) => {
  await createConnection(page, "Conn A")
  await createConnection(page, "Conn B")

  await page.getByText("Conn A").first().click()
  await page.getByText("orders").first().click()
  await expect(page.locator('button:has-text("Consume")')).toBeEnabled()

  await page.getByText("Conn B").first().click()
  await page.waitForTimeout(300)
  await expect(page.locator('button:has-text("Consume")')).toBeDisabled()
  await expect(page.locator('button:has-text("Publish")')).toBeDisabled()
})

test("deletes a connection and resets UI when it was selected", async ({ page }) => {
  await createConnection(page, "ToDelete")

  await page.getByText("ToDelete").first().click()
  await expect(page.locator('[data-active="true"]').first()).toContainText("ToDelete")

  await page.getByText("ToDelete").first().hover()
  const deleteBtn = page.getByRole("button", { name: "Delete ToDelete" }).first()
  await expect(deleteBtn).toBeVisible()
  await deleteBtn.click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText("Delete Connection")
  await dialog.getByRole("button", { name: "Delete" }).click()
  await page.waitForTimeout(500)

  await expect(page.getByText("ToDelete")).not.toBeVisible()
  await expect(page.getByText("No connections")).toBeVisible()
})

test("closing modal resets stuck loading state", async ({ page }) => {
  await page.getByLabel("New connection").click()
  await page.waitForSelector('text=New Connection')

  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "Redis Streams Redis Streams" }).click()
  await page.waitForSelector('text=Configure Redis Streams')
  await dialog.getByPlaceholder("redis://localhost:6379").fill("redis://invalid:6379")

  await page.evaluate(() => {
    window.queueApi.connect = () => new Promise(() => {})
  })

  await dialog.getByRole("button", { name: "Connect" }).click()
  await page.waitForTimeout(200)

  await page.getByRole("button", { name: "Cancel" }).click()
  await page.waitForTimeout(300)

  await page.getByLabel("New connection").click()
  await page.waitForSelector('text=New Connection')

  await page.getByText("AWS SQS").click()
  await page.waitForSelector('text=Configure AWS SQS')

  const connectBtn = page.getByRole("button", { name: "Connect" })
  await expect(connectBtn).toBeEnabled()
})

test("shows validation error when required fields are empty", async ({ page }) => {
  await page.getByLabel("New connection").click()
  await page.waitForSelector('text=New Connection')

  await page.getByText("AWS SQS").click()
  await page.waitForSelector('text=Configure AWS SQS')

  const dialog = page.getByRole("dialog")
  await dialog.getByPlaceholder("My Connection").fill("")
  await dialog.getByPlaceholder("us-east-1").fill("")
  await dialog.getByPlaceholder("AKIA...").fill("")
  await dialog.getByPlaceholder("••••••••").fill("")

  await dialog.getByRole("button", { name: "Connect" }).click()
  await expect(page.getByText("Region is required")).toBeVisible()
})
