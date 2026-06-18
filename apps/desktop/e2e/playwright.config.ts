import { defineConfig } from "@playwright/test"
import path from "path"

export default defineConfig({
  testDir: "./specs",
  timeout: 15000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",

  webServer: {
    command: "pnpm dev:renderer",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },

  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
})


