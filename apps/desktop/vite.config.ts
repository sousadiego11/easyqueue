import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

const packagesDir = path.resolve(__dirname, "../../packages")

export default defineConfig({
  plugins: [react()],
  root: ".",
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@easyqueue/core": path.resolve(packagesDir, "core/src"),
      "@easyqueue/shared": path.resolve(packagesDir, "shared/src"),
      "@easyqueue/provider-sqs": path.resolve(packagesDir, "provider-sqs/src"),
      "@easyqueue/provider-rabbitmq": path.resolve(packagesDir, "provider-rabbitmq/src"),
      "@easyqueue/provider-redisstreams": path.resolve(packagesDir, "provider-redisstreams/src"),
      "@easyqueue/provider-azureservicebus": path.resolve(packagesDir, "provider-azureservicebus/src"),
      "@easyqueue/provider-natsjetstream": path.resolve(packagesDir, "provider-natsjetstream/src"),
    },
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
})
