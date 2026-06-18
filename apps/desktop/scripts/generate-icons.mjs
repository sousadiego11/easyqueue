import { chromium } from "@playwright/test"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { resolve } from "path"

async function generateIcons() {
  const svgPath = resolve("resources/icon.svg")
  const svg = readFileSync(svgPath, "utf-8")
  const b64 = Buffer.from(svg).toString("base64")
  const dataUrl = `data:image/svg+xml;base64,${b64}`

  const iconsDir = resolve("resources/icons")
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setViewportSize({ width: 512, height: 512 })

  // Navigate directly to SVG — Chrome renders it as an SVG document
  // with transparent background by default.
  await page.goto(dataUrl)
  await page.screenshot({ path: resolve(iconsDir, "512.png"), omitBackground: true })
  console.log("  512x512")

  writeFileSync(resolve("resources/icon.png"), readFileSync(resolve(iconsDir, "512.png")))
  await browser.close()
  console.log("Done")
}

generateIcons().catch((err) => {
  console.warn("[generate-icons] Could not generate PNG icons (Playwright not available). The SVG will be used as fallback.")
  process.exit(0)
})