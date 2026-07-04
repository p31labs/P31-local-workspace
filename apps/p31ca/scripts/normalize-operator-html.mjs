/**
 * One-shot normalizer: static HTML under public/ uses one operator preset + Inter/Space Mono.
 * Run from repo: node 04_SOFTWARE/p31ca/scripts/normalize-operator-html.mjs
 *
 * After running, manually drop `/assets/p31-operator-tailwind.js` from pages that define their
 * own tailwind.config (e.g. quantum-family kids theme, phenix-os scanline extend, economy minified).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'

const tailwindInlineRe =
  /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>/g

function processHtml(filePath) {
  let s = fs.readFileSync(filePath, 'utf8')
  const orig = s

  s = s.replace(tailwindInlineRe, `<script src="https://cdn.tailwindcss.com"></script>
    <script src="/assets/p31-operator-tailwind.js"></script>`)

  s = s.replace(
    /<link([^>]*)\s+href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"([^>]*)>/gi,
    (full, _pre, href) => {
      if (!/Atkinson|JetBrains/i.test(href)) return full
      return `<link rel="stylesheet" href="${FONT_HREF}">`
    },
  )

  if (s.includes('cdn.tailwindcss.com') && !s.includes('p31-operator-tailwind.js')) {
    s = s.replace(
      /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/,
      `<script src="https://cdn.tailwindcss.com"></script>
    <script src="/assets/p31-operator-tailwind.js"></script>`,
    )
  }

  s = s.split('#0f1115').join('#050505')
  s = s.split('Atkinson Hyperlegible').join('Inter')
  s = s.split('"JetBrains Mono"').join('"Space Mono"')
  s = s.split("'JetBrains Mono'").join("'Space Mono'")

  if (s !== orig) {
    fs.writeFileSync(filePath, s, 'utf8')
    return true
  }
  return false
}

function walk(dir) {
  let n = 0
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) n += walk(p)
    else if (e.name.endsWith('.html') && processHtml(p)) n += 1
  }
  return n
}

const changed = walk(publicDir)
console.log(`normalize-operator-html: updated ${changed} file(s) under public/`)
