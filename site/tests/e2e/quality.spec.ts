/**
 * Accessibility (axe, WCAG 2.2 AA rules) in both themes, performance budgets
 * on a phone, and the security properties a visitor's browser enforces.
 */
import AxeBuilder from '@axe-core/playwright';
import {gzipSync} from 'node:zlib';
import {expect, test, type Page} from '@playwright/test';

const A11Y_PAGES = [
  '/en/',
  '/en/?q=uniswap',
  '/en/objects/uniswap-v4/',
  '/en/objects/usdc/',
  '/en/stories/dollars-on-ethereum/',
  '/en/collections/d0/',
  '/en/compare/?ids=usdc,weth9',
  '/en/methodology/',
  '/en/changes/',
  '/en/data/',
  '/en/objects/uniswap-v9/',
  '/ja/',
  '/de/objects/weth9/',
];

/** Waits until the islands and the not-found script have shown what the address asks for. */
async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-query') && !document.querySelector('[data-not-found][data-pending], [aria-busy="true"]'));
}

for (const scheme of ['light', 'dark'] as const) {
  for (const path of A11Y_PAGES) {
    test(`axe finds no WCAG 2.2 AA violations on ${path} (${scheme})`, async ({page}) => {
      await page.emulateMedia({colorScheme: scheme});
      await page.goto(path);
      await settled(page);
      const results = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const summary = results.violations.map(v => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
      expect(summary).toEqual([]);
    });
  }
}

test.describe('budgets on a 390-pixel phone', () => {
  test.use({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});

  test('first-load JavaScript stays under 200 KiB compressed', async ({page, request}) => {
    const scripts = new Set<string>();
    page.on('response', response => {
      if (response.request().resourceType() === 'script') scripts.add(response.url());
    });
    await page.goto('/en/', {waitUntil: 'networkidle'});
    let total = 0;
    for (const url of scripts) total += gzipSync(await (await request.get(url)).body()).length;
    expect(total / 1024).toBeLessThan(200);
  });

  test('search, a story entrance and a result are visible without scrolling', async ({page}) => {
    await page.goto('/en/');
    for (const locator of [page.locator('#directory-q'), page.locator('.entrance').first(), page.locator('li.row').first()]) await expect(locator).toBeInViewport();
  });

  test('layout shift stays under 0.1 while the page loads', async ({page}) => {
    await page.goto('/en/objects/usdc/', {waitUntil: 'networkidle'});
    const cls = await page.evaluate(
      () =>
        new Promise<number>(resolve => {
          let total = 0;
          new PerformanceObserver(list => {
            for (const entry of list.getEntries() as (PerformanceEntry & {value: number; hadRecentInput: boolean})[]) if (!entry.hadRecentInput) total += entry.value;
          }).observe({type: 'layout-shift', buffered: true});
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(cls).toBeLessThan(0.1);
  });

  test('typing in search updates results within 100 ms', async ({page}) => {
    await page.goto('/en/', {waitUntil: 'networkidle'});
    const input = page.locator('#directory-q');
    await input.fill('u');
    await page.waitForTimeout(300);
    const elapsed = await page.evaluate(
      () =>
        new Promise<number>(resolve => {
          const input = document.querySelector<HTMLInputElement>('#directory-q')!;
          const list = document.querySelector('#directory-results') ?? document.body;
          const start = performance.now();
          const observer = new MutationObserver(() => {
            observer.disconnect();
            resolve(performance.now() - start);
          });
          observer.observe(list, {childList: true, subtree: true, characterData: true});
          // Set the value the way typing does, so React sees the change.
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'uniswap');
          input.dispatchEvent(new Event('input', {bubbles: true}));
        }),
    );
    expect(elapsed).toBeLessThan(100);
  });
});

test.describe('security in the browser', () => {
  test('pages carry a strict CSP and a referrer policy of their own, without help from the host', async ({request}) => {
    for (const path of ['/en/objects/weth9/', '/', '/en/?q=uniswap', '/en/compare/', '/en/objects/uniswap-v9/']) {
      const html = await (await request.get(path)).text();
      const policy = /<meta http-equiv="content-security-policy" content="([^"]+)"/.exec(html)?.[1] ?? '';
      expect(policy, path).toMatch(/script-src 'self'/);
      expect(policy, path).toMatch(/object-src 'none'/);
      expect(policy, path).toMatch(/base-uri 'none'/);
      expect(policy, path).toMatch(/connect-src 'self'/);
      expect(policy, path).not.toMatch(/unsafe-inline|unsafe-eval/);
      expect(html, path).toContain('<meta name="referrer" content="strict-origin-when-cross-origin">');
    }
  });

  test('nothing on the visitor path breaks the policy', async ({page}) => {
    await page.addInitScript(() => {
      (window as unknown as {violations: string[]}).violations = [];
      document.addEventListener('securitypolicyviolation', event => (window as unknown as {violations: string[]}).violations.push(`${event.violatedDirective} ${event.blockedURI}`));
    });
    for (const path of ['/en/?q=uniswap', '/en/compare/?ids=usdc,weth9', '/en/objects/usdc/', '/en/stories/dollars-on-ethereum/', '/en/objects/uniswap-v9/', '/de/objects/uniswap-v9/']) {
      await page.goto(path);
      await settled(page);
      expect(await page.evaluate(() => (window as unknown as {violations: string[]}).violations), path).toEqual([]);
    }
  });

  test('no request leaves the site on the visitor path', async ({page}) => {
    const outside: string[] = [];
    page.on('request', request => {
      if (!request.url().startsWith('http://127.0.0.1') && !request.url().startsWith('data:')) outside.push(request.url());
    });
    for (const path of ['/', '/en/?q=usdc', '/en/stories/dollars-on-ethereum/', '/en/compare/?ids=usdc,weth9', '/en/objects/uniswap-v9/', '/en/objects/usdc/']) await page.goto(path, {waitUntil: 'networkidle'});
    await page.locator('button[data-guide]').first().click();
    await page.waitForTimeout(500);
    expect(outside).toEqual([]);
  });

  test('external links are https, open safely and say they leave the site', async ({page}) => {
    for (const path of ['/en/objects/usdc/', '/en/stories/dollars-on-ethereum/', '/en/objects/uniswap-v4/']) {
      await page.goto(path);
      const links = await page.locator('a[href^="http"]').evaluateAll(anchors =>
        anchors.filter(a => new URL((a as HTMLAnchorElement).href).origin !== location.origin).map(a => ({href: (a as HTMLAnchorElement).href, rel: a.getAttribute('rel') ?? ''})),
      );
      for (const link of links) {
        expect(link.href, path).toMatch(/^https:\/\//);
        expect(link.rel, link.href).toMatch(/noopener/);
        expect(link.rel, link.href).toMatch(/noreferrer/);
      }
    }
  });

  test('exports are files whose names give their type, and spreadsheet-safe', async ({request}) => {
    const json = await request.get('/data/v1/directory.json');
    expect(json.headers()['content-type']).toMatch(/^application\/json/);
    expect((await json.json()).schemaVersion).toBe(1);
    const csv = await request.get('/data/v1/directory.csv');
    expect(csv.headers()['content-type']).toMatch(/^text\/csv/);
    const body = await csv.text();
    expect(body.startsWith('\ufeff')).toBe(true);
    for (const line of body.split('\r\n')) expect(line).not.toMatch(/(^|,)"?[=+@]/);
  });
});
