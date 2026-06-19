import { test, expect } from "@playwright/test"
import { setupWithMessages } from "../fixtures/helpers"

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
