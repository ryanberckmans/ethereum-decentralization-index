/**
 * Every language and both themes on phone widths: readable, complete
 * controls, no sideways scrolling, no leaked placeholders, and a first paint
 * that already has the chosen theme.
 */
import {expect, test} from '@playwright/test';

const LOCALES = ['en', 'es', 'pt-BR', 'fr', 'de', 'zh-CN', 'ja', 'ko'] as const;
const PAGES = [
  '/',
  '/objects/weth9/',
  '/objects/usdc/',
  '/objects/uniswap-v4/',
  '/stories/',
  '/stories/dollars-on-ethereum/',
  '/collections/d0/',
  '/compare/?ids=usdc,weth9,uniswap-v4',
  '/methodology/',
  '/changes/',
  '/data/',
];
const WIDTHS = [360, 390, 430];

for (const locale of LOCALES) {
  test(`${locale}: pages fit a 360-pixel phone and show no raw placeholders`, async ({browser}) => {
    const context = await browser.newContext({viewport: {width: 360, height: 780}, isMobile: true, hasTouch: true});
    const page = await context.newPage();
    for (const path of PAGES) {
      const response = await page.goto(`/${locale}${path}`);
      expect(response?.status(), path).toBe(200);
      await page.waitForFunction(() => !document.documentElement.hasAttribute('data-query') && !document.querySelector('[aria-busy="true"]'));
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      // The site's name stays in English in every language.
      await expect(page.locator('.wordmark-name')).toHaveText('Ethereum Decentralization Index');
      if (path === '/') await expect(page).toHaveTitle(/^Ethereum Decentralization Index\s?[:：]/);
      // A phone zooms out to show what overflows, which widens window.innerWidth with it; the layout width does not change.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
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
    await page.goto('/en/objects/weth9/');
    await page.locator('.menu-lang > summary').click();
    await page.locator('.menu-lang a[data-lang="ja"]').click();
    await expect(page).toHaveURL(/\/ja\/objects\/weth9\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    // The choice is remembered for the language-neutral root.
    await page.goto('/');
    await expect(page).toHaveURL(/\/ja\/$/);

    await page.locator('.menu-nav > summary').click();
    await page.locator('.menu-nav select[data-theme-select]').selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // The theme is applied before first paint on the next page.
    await page.goto('/ja/objects/usdc/', {waitUntil: 'commit'});
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark' && document.body !== null);
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe('rgb(12, 16, 22)');
    await context.close();
  });
}

test('the bare root opens the directory in the browser’s language, and never sends Traditional Chinese readers to Simplified', async ({browser}) => {
  for (const [language, expected] of [
    ['de-DE', '/de/'],
    ['pt-PT', '/pt-BR/'],
    ['fr-CA', '/fr/'],
    ['ko-KR', '/ko/'],
    ['zh-TW', '/en/'],
    ['nl-NL', '/en/'],
  ] as const) {
    const context = await browser.newContext({locale: language});
    const page = await context.newPage();
    await page.goto('/?q=usdc#results');
    await expect(page, language).toHaveURL(new RegExp(`${expected}\\?q=usdc#results$`));
    await context.close();
  }
});

test('a language switch keeps the search', async ({page}) => {
  await page.goto('/en/?q=usdc');
  await expect(page.locator('#directory-q')).toHaveValue('usdc');
  await page.locator('.menu-lang > summary').click();
  await page.locator('.menu-lang a[data-lang="fr"]').click();
  await expect(page).toHaveURL(/\/fr\/\?q=usdc$/);
  await expect(page.locator('#directory-q')).toHaveValue('usdc');
});

test('a language link carries the search before it is clicked, for new tabs and copied links', async ({page}) => {
  await page.goto('/en/?q=usdc');
  await expect(page.locator('#directory-q')).toHaveValue('usdc');
  await page.locator('.menu-lang > summary').click();
  await page.locator('.menu-lang a[data-lang="fr"]').focus();
  await expect(page.locator('.menu-lang a[data-lang="fr"]')).toHaveAttribute('href', /\/fr\/\?q=usdc$/);
});

test('without scripts the bare root lists every language', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('a[data-lang]')).toHaveCount(LOCALES.length);
  await expect(page.locator('a[data-lang="ja"]')).toHaveAttribute('href', '/ja/');
  await context.close();
});

test('every page names its language alternates', async ({page}) => {
  await page.goto('/fr/objects/weth9/');
  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(links => links.map(link => link.getAttribute('hreflang')));
  expect(alternates.sort()).toEqual([...LOCALES, 'x-default'].sort());
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/fr\/objects\/weth9\/$/);
});

test('searching in Spanish or Japanese finds the English records for the same task', async ({page}) => {
  for (const [path, query] of [
    ['/es/', 'prestar dólares'],
    ['/ja/', 'ドルを貸す'],
  ] as const) {
    await page.goto(path);
    await page.locator('#directory-q').fill(query);
    await expect(page.locator('li.row[data-id="usdc"]')).toBeVisible();
    await expect(page.locator('li.row[data-id="morpho-blue"]')).toBeVisible();
  }
});
