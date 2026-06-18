import { chromium } from "@playwright/test"
import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const SIZES = [16, 24, 32, 48, 64, 96, 128, 256, 512]

async function generateIcons() {
  const svgPath = resolve("resources/icon.svg")
  const svg = readFileSync(svgPath, "utf-8")

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setViewportSize({ width: 512, height: 512 })

  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`)

  for (const size of SIZES) {
    await page.setViewportSize({ width: size, height: size })
    const svgEl = await page.$("svg")
    await svgEl.screenshot({ path: resolve(`resources/icons/${size}.png`) })
    console.log(`  ${size}x${size}`)
  }

  writeFileSync(resolve("resources/icon.png"), readFileSync(resolve("resources/icons/512.png")))
  await browser.close()
  console.log("Done")
}

generateIcons().catch((err) => {
  console.error(err)
  process.exit(1)
})
