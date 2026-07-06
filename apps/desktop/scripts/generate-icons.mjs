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
  await page.setContent(`
    <style>
      html, body {
        margin: 0;
        background: transparent;
      }
    </style>
    <img id="icon" src="${dataUrl}" width="512" height="512" />
  `)

  const sizes = [16, 24, 32, 48, 64, 96, 128, 256, 512]

  for (const size of sizes) {
    const buffer = await page.evaluate(async (targetSize) => {
      const img = document.getElementById("icon")
      if (!(img instanceof HTMLImageElement)) {
        throw new Error("Icon image element not found")
      }

      if (!img.complete) {
        await new Promise((resolvePromise, rejectPromise) => {
          img.addEventListener("load", () => resolvePromise(null), { once: true })
          img.addEventListener("error", () => rejectPromise(new Error("Icon image failed to load")), { once: true })
        })
      }

      const canvas = document.createElement("canvas")
      canvas.width = targetSize
      canvas.height = targetSize

      const context = canvas.getContext("2d")
      if (!context) {
        throw new Error("Could not create canvas context")
      }

      context.clearRect(0, 0, targetSize, targetSize)
      context.drawImage(img, 0, 0, targetSize, targetSize)

      return canvas.toDataURL("image/png")
    }, size)

    const pngBuffer = Buffer.from(buffer.replace(/^data:image\/png;base64,/, ""), "base64")
    writeFileSync(resolve(iconsDir, `${size}.png`), pngBuffer)
    console.log(`  ${size}x${size}`)
  }

  writeFileSync(resolve("resources/icon.png"), readFileSync(resolve(iconsDir, "512.png")))
  await browser.close()
  console.log("Done")
}

generateIcons().catch((err) => {
  console.warn("[generate-icons] Could not generate PNG icons (Playwright not available). The SVG will be used as fallback.")
  process.exit(0)
})
