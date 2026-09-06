import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const publicDir = path.join(root, 'public')

function svgForSize(size) {
  const r = Math.round(size * 0.18)
  const fontSize = Math.round(size * 0.52)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0A0A0F"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    font-size="${fontSize}" font-weight="800" fill="#FF6B4A">P</text>
</svg>`
}

for (const size of [192, 512]) {
  const out = path.join(publicDir, `icon-${size}.png`)
  await sharp(Buffer.from(svgForSize(size)))
    .png()
    .toFile(out)
  console.log('[icons]', out)
}
