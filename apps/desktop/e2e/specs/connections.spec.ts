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
