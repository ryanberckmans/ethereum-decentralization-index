/**
 * Every language and both themes on phone widths: readable, complete
 * controls, no sideways scrolling, no leaked placeholders, and a first paint
 * that already has the chosen theme.
 */
import {expect, test} from '@playwright/test';

const LOCALES = ['en', 'es', 'pt-BR', 'fr', 'de', 'zh-CN', 'ja', 'ko'] as const;
const PAGES = ['/', '/objects/weth9', '/objects/usdc', '/objects/uniswap-v4', '/stories', '/stories/dollars-on-ethereum', '/collections/d0', '/compare?ids=usdc,weth9,uniswap-v4', '/methodology', '/changes', '/data'];
const WIDTHS = [360, 390, 430];

for (const locale of LOCALES) {
  test(`${locale}: pages fit a 360-pixel phone and show no raw placeholders`, async ({browser}) => {
    const context = await browser.newContext({viewport: {width: 360, height: 780}, isMobile: true, hasTouch: true});
    const page = await context.newPage();
    for (const path of PAGES) {
      const response = await page.goto(`/${locale}${path}`);
      expect(response?.status(), path).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${locale}${path} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
      const text = await page.locator('body').innerText();
      expect(text, `${locale}${path}`).not.toMatch(/\{(count|date|name|label|max|value|total|from|to|reasons|ids|field|chains|networks)\}|\[object Object\]|undefined|NaN/);
    }
    await context.close();
  });
}

for (const width of WIDTHS) {
  test(`switching language and theme on a ${width}-pixel phone`, async ({browser}) => {
    const context = await browser.newContext({viewport: {width, height: 844}, isMobile: true, hasTouch: true});
    const page = await context.newPage();
    await page.goto('/en/objects/weth9');
    await page.locator('.menu-lang > summary').click();
    await page.locator('.menu-lang a[data-lang="ja"]').click();
    await expect(page).toHaveURL(/\/ja\/objects\/weth9$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    // The choice is remembered for the language-neutral root.
    await page.goto('/');
    await expect(page).toHaveURL(/\/ja\/$/);

    await page.locator('.menu-nav > summary').click();
    await page.locator('.menu-nav select[data-theme-select]').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // The theme is applied before first paint on the next page.
    await page.goto('/ja/objects/usdc', {waitUntil: 'commit'});
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark' && document.body !== null);
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe('rgb(12, 16, 22)');
    await context.close();
  });
}

test('the bare root follows Accept-Language and never sends Traditional Chinese readers to Simplified', async ({request}) => {
  for (const [header, expected] of [
    ['de-DE,de;q=0.9,en;q=0.5', '/de/'],
    ['pt-PT', '/pt-BR/'],
    ['fr-CA', '/fr/'],
    ['zh-TW,zh;q=0.9', '/zh-CN/'],
    ['zh-TW', '/en/'],
    ['', '/en/'],
  ] as const) {
    const response = await request.get('/', {headers: {'accept-language': header}, maxRedirects: 0});
    expect(response.status(), header).toBe(302);
    expect(new URL(response.headers()['location'], 'http://localhost').pathname, header).toBe(expected);
  }
});

test('a browser set to Korean lands on the Korean directory', async ({browser}) => {
  const context = await browser.newContext({locale: 'ko-KR'});
  const page = await context.newPage();
  await page.goto('/');
  expect(new URL(page.url()).pathname).toBe('/ko/');
  await context.close();
});

test('every page names its language alternates', async ({page}) => {
  await page.goto('/fr/objects/weth9');
  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(links => links.map(link => link.getAttribute('hreflang')));
  expect(alternates.sort()).toEqual([...LOCALES, 'x-default'].sort());
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/fr\/objects\/weth9$/);
});
