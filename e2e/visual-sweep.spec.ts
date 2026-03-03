import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SCREENSHOT_DIR = 'docs/test-reports/screenshots'

const routes = [
  { path: '/welcome', name: 'welcome' },
  { path: '/home', name: 'home' },
  { path: '/quiz', name: 'quiz' },
  { path: '/drill', name: 'drill' },
  { path: '/grammar', name: 'grammar' },
  { path: '/vocabulary', name: 'vocabulary' },
  { path: '/dictionary', name: 'dictionary' },
  { path: '/writing', name: 'writing' },
  { path: '/speaking', name: 'speaking' },
  { path: '/progress', name: 'progress' },
  { path: '/updates', name: 'updates' },
  { path: '/login', name: 'login' },
  { path: '/signup', name: 'signup' },
]

// ============================================================
// Phase 3: Visual Screenshot Sweep
// ============================================================

for (const route of routes) {
  test(`screenshot: ${route.name}`, async ({ page }, testInfo) => {
    const projectName = testInfo.project.name // e.g. "mobile-light"
    const consoleErrors: string[] = []

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${route.name}] ${msg.text()}`)
      }
    })

    page.on('pageerror', (err) => {
      consoleErrors.push(`[${route.name}] PAGE ERROR: ${err.message}`)
    })

    // Apply dark class if dark theme project
    if (projectName.includes('dark')) {
      await page.addInitScript(() => {
        document.documentElement.classList.add('dark')
      })
    }

    await page.goto(route.path, { waitUntil: 'networkidle', timeout: 15000 })

    // Wait for content to settle
    await page.waitForTimeout(1000)

    // If dark, ensure class is applied (SPA might have re-rendered)
    if (projectName.includes('dark')) {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })
      await page.waitForTimeout(500)
    }

    // Take full-page screenshot
    const viewportLabel = projectName.replace('-light', '').replace('-dark', '')
    const themeLabel = projectName.includes('dark') ? 'dark' : 'light'
    const screenshotName = `${route.name}-${viewportLabel}-${themeLabel}.png`

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${screenshotName}`,
      fullPage: true,
    })

    // Check for blank page
    const bodyText = await page.evaluate(() => document.body.innerText.trim())
    expect(bodyText.length, `Page ${route.name} should not be blank`).toBeGreaterThan(0)

    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    if (hasOverflow) {
      console.warn(`OVERFLOW: ${route.name} at ${projectName} has horizontal overflow`)
    }

    // Log console errors (don't fail, just report)
    if (consoleErrors.length > 0) {
      console.warn(`Console errors on ${route.name}:`, consoleErrors)
    }
  })
}

// ============================================================
// Phase 4: Interaction Tests
// ============================================================

test.describe('Interaction Tests', () => {
  test('quiz flow - select and interact', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(`PAGE ERROR: ${err.message}`))

    if (projectName.includes('dark')) {
      await page.addInitScript(() => {
        document.documentElement.classList.add('dark')
      })
    }

    await page.goto('/quiz', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // Screenshot the quiz selector
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/quiz-selector-${projectName}.png`,
      fullPage: true,
    })

    // Look for visible start/quiz buttons
    const startButton = page.locator('button:visible:has-text("Start"), button:visible:has-text("Begin"), button:visible:has-text("Quiz")')
    if (await startButton.count() > 0) {
      await startButton.first().click()
      await page.waitForTimeout(1500)

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/quiz-active-${projectName}.png`,
        fullPage: true,
      })

      // Look for visible answer input or MC buttons
      const answerInput = page.locator('input[type="text"]:visible, textarea:visible').first()
      const mcButtons = page.locator('button:visible').filter({ hasText: /^[a-d]\)/ })

      if (await answerInput.isVisible().catch(() => false)) {
        await answerInput.fill('test')
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/quiz-answer-input-${projectName}.png`,
          fullPage: true,
        })
      } else if (await mcButtons.count() > 0) {
        await mcButtons.first().click()
        await page.waitForTimeout(500)
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/quiz-answer-mc-${projectName}.png`,
          fullPage: true,
        })
      }
    }

    if (consoleErrors.length > 0) {
      console.warn('Quiz console errors:', consoleErrors)
    }
  })

  test('navigation flow - sidebar/mobile menu', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name

    if (projectName.includes('dark')) {
      await page.addInitScript(() => {
        document.documentElement.classList.add('dark')
      })
    }

    await page.goto('/home', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // For mobile, look for hamburger menu
    if (projectName.includes('mobile')) {
      const menuButton = page.locator('button:visible[aria-label*="menu" i], button:visible[aria-label*="nav" i], button:visible:has(svg.lucide-menu), button:visible:has(svg.lucide-panel-left)')
      if (await menuButton.count() > 0) {
        await menuButton.first().click()
        await page.waitForTimeout(500)
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/nav-mobile-menu-open-${projectName}.png`,
          fullPage: true,
        })
      } else {
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/nav-no-mobile-menu-${projectName}.png`,
          fullPage: true,
        })
      }
    }

    // Test visible nav links only
    const navLinks = page.locator('nav a:visible, aside a:visible')
    const linkCount = await navLinks.count()

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/nav-links-${projectName}.png`,
      fullPage: true,
    })

    // Try clicking a few visible nav links
    if (linkCount > 0) {
      for (let i = 0; i < Math.min(3, linkCount); i++) {
        const href = await navLinks.nth(i).getAttribute('href')
        if (href && !href.startsWith('http')) {
          await navLinks.nth(i).click()
          await page.waitForTimeout(800)
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/nav-clicked-${i}-${projectName}.png`,
            fullPage: true,
          })
          // Go back
          await page.goto('/home', { waitUntil: 'networkidle', timeout: 15000 })
          await page.waitForTimeout(500)
        }
      }
    }
  })

  test('theme toggle', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name

    await page.goto('/home', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // Screenshot before toggle
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/theme-before-${projectName}.png`,
      fullPage: true,
    })

    // Look for visible theme toggle button
    const themeToggle = page.locator('button:visible:has-text("Dark"), button:visible:has-text("Light"), button:visible:has-text("Theme"), button:visible[aria-label*="theme" i], button:visible[aria-label*="dark" i], button:visible[aria-label*="mode" i]')

    if (await themeToggle.count() > 0) {
      await themeToggle.first().click()
      await page.waitForTimeout(500)

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/theme-after-toggle-${projectName}.png`,
        fullPage: true,
      })
    } else {
      // Try toggling manually
      await page.evaluate(() => {
        document.documentElement.classList.toggle('dark')
      })
      await page.waitForTimeout(500)

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/theme-manual-toggle-${projectName}.png`,
        fullPage: true,
      })
    }
  })

  test('drill page interaction', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name

    if (projectName.includes('dark')) {
      await page.addInitScript(() => {
        document.documentElement.classList.add('dark')
      })
    }

    await page.goto('/drill', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/drill-landing-${projectName}.png`,
      fullPage: true,
    })

    // Look for visible start/begin button
    const startBtn = page.locator('button:visible:has-text("Start"), button:visible:has-text("Begin")')
    if (await startBtn.count() > 0) {
      await startBtn.first().click()
      await page.waitForTimeout(1500)
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/drill-active-${projectName}.png`,
        fullPage: true,
      })
    }
  })

  test('dictionary search', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name

    if (projectName.includes('dark')) {
      await page.addInitScript(() => {
        document.documentElement.classList.add('dark')
      })
    }

    await page.goto('/dictionary', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    // Find visible search input
    const searchInput = page.locator('input:visible[type="text"], input:visible[type="search"]').first()
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('hund')
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/dictionary-search-${projectName}.png`,
        fullPage: true,
      })
    }
  })

  test('writing page', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name

    if (projectName.includes('dark')) {
      await page.addInitScript(() => {
        document.documentElement.classList.add('dark')
      })
    }

    await page.goto('/writing', { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(1000)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/writing-page-${projectName}.png`,
      fullPage: true,
    })
  })
})

// ============================================================
// Phase 5: Accessibility Audit
// ============================================================

test.describe('Accessibility Audit', () => {
  for (const route of routes) {
    test(`a11y: ${route.name}`, async ({ page }, testInfo) => {
      // Only run accessibility tests on desktop-light to avoid duplicate results
      if (testInfo.project.name !== 'desktop-light') {
        test.skip()
        return
      }

      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(1000)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      // Log violations but don't fail
      if (results.violations.length > 0) {
        for (const violation of results.violations) {
          console.warn(
            `A11Y [${route.name}] ${violation.impact}: ${violation.id} - ${violation.description} (${violation.nodes.length} instances)`
          )
        }
      }

      // Store violations for report generation
      const violationData = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
      }))

      // Attach as test annotation
      testInfo.annotations.push({
        type: 'a11y-violations',
        description: JSON.stringify(violationData),
      })
    })
  }
})
