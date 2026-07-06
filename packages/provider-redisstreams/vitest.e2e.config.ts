import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__e2e__/**/*.test.ts"],
    testTimeout: 30000,
  },
})
