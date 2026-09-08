// Run with Playwright available and the dev server running on port 8090.
// These API fixtures are isolated to the test browser; no user data is written.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const browser = await chromium.launch({ headless: true });
const output = join(tmpdir(), 'lifeos-growth-review');
await mkdir(output, { recursive: true });
try {
  for (const [width, height, score] of [[1440, 1000, 85], [768, 1024, 50], [390, 844, 0], [320, 740, 0]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/api/auth/me', route => route.fulfill({ json: { id: 'ui-test', name: 'Alex', email: 'ui-test@example.invalid' } }));
    await page.route('**/api/dashboard/today', route => route.fulfill({ json: {
      fitness: { entries: [], totals: { workoutDuration: score }, goal: 100 },
      learning: { sessions: [], totalDuration: score, goal: 100 },
      interview: { sessions: [], totalDuration: score, goal: 100 },
      sleep: { totalMinutes: score, goal: 100 },
      hydration: { totalMl: score, goal: 100 },
      nutrition: { totals: { protein: score }, proteinGoal: 100 },
      habits: { totalCount: 100, completedCount: score },
      expenses: { total: 0, currency: '$' },
    } }));
    await page.goto(process.env.LIFEOS_TEST_URL || 'http://localhost:8090');
    const hero = page.getByRole('region', { name: 'Small steps. A life in bloom.' });
    await hero.waitFor();
    assert.equal(await hero.getByRole('progressbar').getAttribute('aria-valuenow'), String(score));
    await page.waitForTimeout(3500);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}px`);
    await page.screenshot({ path: join(output, `dashboard-${width}.png`) });
    if (width < 1024) {
      const menu = page.getByRole('button', { name: 'Open navigation menu' });
      assert.equal((await menu.boundingBox()).width, 44);
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'), 'true');
      await page.waitForTimeout(350);
      assert.equal(await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard', exact: true }).evaluate(el => getComputedStyle(el).fontSize), '18px');
      await page.screenshot({ path: join(output, `menu-${width}.png`) });
      await page.getByRole('button', { name: 'Close navigation menu' }).click();
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await hero.locator('svg').evaluate(el => [...el.querySelectorAll('*')].every(node => getComputedStyle(node).animationName === 'none')), true);
    assert.equal(await hero.locator('svg path[pathLength]').first().evaluate(el => getComputedStyle(el).strokeDashoffset), '0px');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await hero.evaluate(el => el.scrollIntoView());
    await page.waitForTimeout(100);
    assert.equal(await hero.getAttribute('data-paused'), 'false');
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    assert.equal(await hero.getAttribute('data-paused'), 'true');
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: real-score binding fixture, layout, menu, reduced motion, offscreen pause, console`);
    await page.close();
  }
  console.log(`Screenshots: ${output}`);
} finally {
  await browser.close();
}
