import { test, expect, type Page } from '@playwright/test'

/**
 * Inclusive design — structural proof.
 *
 * Assertions key on DOM structure and computed style, not on exact copy
 * strings (copy is being rewritten in another workstream). The `.loom-shell`
 * data-* surface is the contract: `data-tier`, `data-density`, `data-motion`,
 * `data-saturation`, `data-literal-labels`, all driven by URL params.
 *
 * A `#` note on scope: the four presentation attributes (`data-density`,
 * `data-motion`, `data-saturation`, `data-literal-labels`) are rendered by
 * Phase A2 of the work package (App.tsx). Until then those assertions fail —
 * this spec is the proof that phase must satisfy.
 */

interface Box {
  x: number
  y: number
  width: number
  height: number
}

interface Scenario {
  name: string
  params: string
  shell: { density: string; motion: string; saturation: string; literal: string }
  grandparent?: boolean
}

function expectBoxesClose(a: Box, b: Box): void {
  expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(a.height - b.height)).toBeLessThanOrEqual(1)
}

async function fontSizeOf(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
}

test('Jitterbug does not autoplay until Play is pressed', async ({ page }) => {
  await page.goto('/')

  // Default shell: advanced tier, full surface.
  await expect(page.locator('.loom-shell')).toHaveAttribute('data-tier', 'advanced')

  // Two clicks on .loom-mode reach the Jitterbug (Canvas -> Instrument -> Jitterbug).
  const mode = page.locator('.loom-mode')
  await mode.click()
  await mode.click()

  const play = page.locator('.jb-btns button').first()
  await expect(play).toHaveText('Play')
  await page.waitForTimeout(700)
  await expect(play).toHaveText('Play')
  await play.click()
  await expect(play).toHaveText('Pause')
})

test('shell layout is immutable across mode switches', async ({ page }) => {
  await page.goto('/')

  const bar = page.locator('.loom-bar')
  const panel = page.locator('.loom-panel')
  const beforeBar = await bar.boundingBox()
  const beforePanel = await panel.boundingBox()
  expect(beforeBar).not.toBeNull()
  expect(beforePanel).not.toBeNull()

  const mode = page.locator('.loom-mode')
  await mode.click()
  await mode.click()
  await expect(page.locator('.jb-btns button').first()).toHaveText('Play')

  const afterBar = await bar.boundingBox()
  const afterPanel = await panel.boundingBox()
  expect(afterBar).not.toBeNull()
  expect(afterPanel).not.toBeNull()

  expectBoxesClose(beforeBar as Box, afterBar as Box)
  expectBoxesClose(beforePanel as Box, afterPanel as Box)
})

const scenarios: Scenario[] = [
  {
    name: 'tired parent',
    params: 'density=spacious&motion=reduced&literal=1',
    shell: { density: 'spacious', motion: 'reduced', saturation: 'normal', literal: '1' },
  },
  {
    name: 'distracted teen',
    params: 'density=compact&motion=full&literal=0',
    shell: { density: 'compact', motion: 'full', saturation: 'normal', literal: '0' },
  },
  {
    name: 'dyslexic grandparent',
    params: 'density=spacious&motion=none&literal=1&spacing=extra-wide&line=loose',
    shell: { density: 'spacious', motion: 'none', saturation: 'normal', literal: '1' },
    grandparent: true,
  },
]

for (const scenario of scenarios) {
  test(`presentation prefs reach the shell — ${scenario.name}`, async ({ page }) => {
    await page.goto(`/?${scenario.params}`)

    const shell = page.locator('.loom-shell')
    await expect(shell).toHaveAttribute('data-density', scenario.shell.density)
    await expect(shell).toHaveAttribute('data-motion', scenario.shell.motion)
    await expect(shell).toHaveAttribute('data-saturation', scenario.shell.saturation)
    await expect(shell).toHaveAttribute('data-literal-labels', scenario.shell.literal)

    // A sample of readable text must stay at or above 12px.
    expect(await fontSizeOf(page, '.loom-bar strong')).toBeGreaterThanOrEqual(12)

    if (scenario.grandparent) {
      // The dyslexic grandparent must never face a self-playing Jitterbug.
      const mode = page.locator('.loom-mode')
      await mode.click()
      await mode.click()
      const play = page.locator('.jb-btns button').first()
      await expect(play).toHaveText('Play')
      await page.waitForTimeout(700)
      await expect(play).toHaveText('Play')
    }
  })
}
