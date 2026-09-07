import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.request.post('http://localhost:8091/api/auth/login', { data: { email: 'super@admin-test.invalid', password: 'Local-QA-only-428!' } });
  const page = await context.newPage(); page.setDefaultTimeout(60000);
  await page.goto('http://localhost:8091/admin');
  await page.getByText('Your application, growing', { exact: true }).waitFor();
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') { await page.getByRole('button', { name: 'Change theme' }).click(); await page.getByRole('menuitem', { name: /^Dark/ }).click(); }
    await page.waitForTimeout(2500);
    console.log(theme, await page.locator('.ad-chart svg').first().evaluate(el => ({ curves: [...el.querySelectorAll('.recharts-area-curve')].map(p => ({ stroke: p.getAttribute('stroke'), d: p.getAttribute('d')?.slice(0, 80), opacity: getComputedStyle(p).opacity, visibility: getComputedStyle(p).visibility })), clips: [...el.querySelectorAll('clipPath rect')].map(p => ({ width: p.getAttribute('width'), height: p.getAttribute('height') })) })));
    await page.addScriptTag({ path: require.resolve('axe-core') });
    const results = await page.evaluate(async () => window.axe.run('.admin-root', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
    console.log(theme, JSON.stringify(results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 6).map(n => ({ html: n.html, summary: n.failureSummary })) }))));
    assert.deepEqual(results.violations.map(v => v.id), [], `${theme} accessibility violations`);
    await page.screenshot({ path: `tool-results/admin-qa/a11y-${theme}.png` });
    assert.ok(await page.locator('.recharts-area-curve').count(), 'Chart curves must remain rendered');
  }
} finally { await browser.close(); }

