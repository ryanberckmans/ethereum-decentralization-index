/**
 * The directory, profiles and comparison as a reader uses them: search,
 * filters, links that restore state, keyboard use and the no-script path.
 */
import {expect, test, type Page} from '@playwright/test';

const rows = (page: Page) => page.locator('li.row[data-id]');
const ids = async (page: Page) => rows(page).evaluateAll(items => items.map(item => (item as HTMLElement).dataset.id));

test('Search Uniswap: separate versions, the token and the unversioned identity, which is not D0', async ({page}) => {
  await page.goto('/en/');
  await page.locator('#directory-q').fill('uniswap');
  await expect(page).toHaveURL(/[?&]q=uniswap/);
  await expect(rows(page).first()).toBeVisible();
  const found = await ids(page);
  for (const id of ['uniswap-v1', 'uniswap-v2', 'uniswap-v3', 'uniswap-v4', 'token:uniswap', 'uniswap']) expect(found).toContain(id);
  await expect(page.locator('li.row[data-id="uniswap"] .row-grade .grade').first()).toHaveAttribute('data-grade', 'D?');
  await expect(page.locator('li.row[data-id="uniswap-v4"] .row-grade .grade').first()).toHaveAttribute('data-grade', 'D0');
});

test('what a reader types, ticks or chooses while scripts load is kept', async ({page}) => {
  // Hold the page's scripts until the reader is done, as on a slow phone.
  let release = () => {};
  const held = new Promise<void>(resolve => (release = resolve));
  await page.route(/\/_astro\/.+\.js$/, async route => {
    await held;
    await route.continue();
  });
  await page.goto('/en/', {waitUntil: 'commit'});
  await page.locator('#directory-q').fill('uniswap');
  await page.locator('input[name="kind"][value="protocol"]').check();
  await page.locator('#directory-sort').selectOption('name');
  release();
  await expect(page).toHaveURL(/\?q=uniswap&kind=protocol&sort=name$/);
  await expect(page.locator('li.row[data-id="token:uniswap"]')).toHaveCount(0);
  await expect(rows(page).first()).toHaveAttribute('data-id', 'uniswap-v1');
  await expect(page.locator('#directory-q')).toHaveValue('uniswap');
  await expect(page.locator('input[name="kind"][value="protocol"]')).toBeChecked();
});

test('a box ticked while scripts load adds to the filters the link already had', async ({page}) => {
  let release = () => {};
  const held = new Promise<void>(resolve => (release = resolve));
  await page.route(/\/_astro\/.+\.js$/, async route => {
    await held;
    await route.continue();
  });
  await page.goto('/en/?kind=protocol', {waitUntil: 'commit'});
  // The built page shows no filters, so the link's own box is not ticked yet.
  await page.locator('input[name="kind"][value="asset"]').check();
  release();
  await expect(page).toHaveURL(/\?kind=asset,protocol$/);
  await expect(page.locator('input[name="kind"][value="protocol"]')).toBeChecked();
  await expect(page.locator('input[name="kind"][value="asset"]')).toBeChecked();
});

test('record names that are also JavaScript built-ins break nothing', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const name of ['constructor', '__proto__', 'toString']) {
    await page.goto(`/en/?compare=${name}`);
    await page.locator('#directory-q').fill('uniswap');
    await expect(page.locator('li.row[data-id="uniswap-v4"]')).toBeVisible();
    await expect(page.locator('li.row[data-id="usdc"]')).toHaveCount(0);
  }
  const response = await page.goto('/en/collections/constructor/');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(/\/en\/collections\/constructor\/$/);
  await expect(page.locator('h1')).toContainText('Not in the directory');
  expect(errors).toEqual([]);
});

test('without scripts the directory lists every record, and says search needs them', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('/en/?q=uniswap&kind=protocol');
  const total = Number((await page.locator('#results-title').innerText()).replace(/\D/g, ''));
  expect(total).toBeGreaterThan(100);
  await expect(page.locator('li.row[data-id]:visible')).toHaveCount(total);
  // getByText skips <noscript>, whose content is the page here.
  await expect(page.locator('p.notice', {hasText: 'Search and filters need JavaScript'})).toBeVisible();
  await expect(page.locator('#directory-q')).toBeHidden();
  await expect(page.locator('li.row[data-id="uniswap-v4"] a').first()).toHaveAttribute('href', '/en/objects/uniswap-v4/');
  await context.close();
});

test('choosing the default order again takes it out of the link', async ({page}) => {
  await page.goto('/en/?q=dollar&sort=name');
  await expect(page.locator('#directory-sort')).toHaveValue('name');
  await page.locator('#directory-sort').selectOption('');
  await expect(page).toHaveURL(/\/en\/\?q=dollar$/);
});

test('a search link opens with the results of typing the same search, by best match', async ({page}) => {
  await page.goto('/en/?q=dollar');
  await expect(page.locator('#directory-q')).toHaveValue('dollar');
  await expect(page).toHaveTitle(/^dollar · /);
  await expect(rows(page).first()).toBeVisible();
  const fromLink = await ids(page);
  await page.goto('/en/');
  await page.locator('#directory-q').fill('dollar');
  await page.locator('#directory-q').press('Enter');
  await expect(page).toHaveURL(/\/en\/\?q=dollar$/);
  await expect.poll(() => ids(page)).toEqual(fromLink);
});

test('a link in another order or past the last page is put in its canonical form', async ({page}) => {
  await page.goto('/en/?kind=protocol&q=uniswap&page=40');
  await expect(page).toHaveURL(/\/en\/\?q=uniswap&kind=protocol$/);
  await expect(rows(page).first()).toBeVisible();
});

test('Browse, open, Back, refresh and new tab restore the query, filters and selection', async ({page, context}) => {
  await page.goto('/en/');
  await page.locator('#directory-q').fill('dollar');
  await page.locator('input[name="kind"][value="asset"]').check();
  await page.locator('li.row[data-id="usdc"] .compare-toggle').click();
  await expect(page).toHaveURL(/q=dollar/);
  await expect(page).toHaveURL(/kind=asset/);
  await expect(page).toHaveURL(/compare=usdc/);
  const url = page.url();

  await page.locator('li.row[data-id="usdc"] a').first().click();
  await expect(page).toHaveURL(/\/en\/objects\/usdc\/$/);
  await page.goBack();
  await expect(page.locator('#directory-q')).toHaveValue('dollar');
  await expect(page.locator('input[name="kind"][value="asset"]')).toBeChecked();
  await expect(page.locator('li.row[data-id="usdc"] .compare-toggle')).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(page.locator('#directory-q')).toHaveValue('dollar');
  await expect(page.locator('input[name="kind"][value="asset"]')).toBeChecked();

  const tab = await context.newPage();
  await tab.goto(url);
  await expect(tab.locator('#directory-q')).toHaveValue('dollar');
  expect(await ids(tab)).toEqual(await ids(page));
});

test('the directory works from the keyboard', async ({page}) => {
  await page.goto('/en/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText(/skip to content/i);
  await page.keyboard.press('Enter');
  await page.locator('#directory-q').focus();
  await page.keyboard.type('weth');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/q=weth/);
  await expect(rows(page).first()).toHaveAttribute('data-id', 'weth9');
});

test('an unrecognized link setting is reported, and the rest still applies', async ({page}) => {
  await page.goto('/en/?kind=bank&grade=d0');
  await expect(page.getByText(/were not recognized and were ignored/)).toBeVisible();
  await expect(page.locator('input[name="grade"][value="d0"]')).toBeChecked();
});

test('Open Uniswap v4: D0 for the core, D? for positions', async ({page}) => {
  await page.goto('/en/objects/uniswap-v4/');
  await expect(page.locator('h1')).toHaveText('Uniswap v4');
  await expect(page.locator('.grade[data-grade]').filter({hasText: 'Mechanism'}).first()).toHaveAttribute('data-grade', 'D0');
  await expect(page.locator('.grade[data-grade]').filter({hasText: 'Position'}).first()).toHaveAttribute('data-grade', 'D?');
});

test('Open WETH: the exact L1 deployment and a permanent D0', async ({page}) => {
  await page.goto('/en/objects/weth9/');
  await expect(page.getByText('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2').first()).toBeVisible();
  await expect(page.getByText('Permanent D0').first()).toBeVisible();
});

test('raw EDI IDs, capitalized slugs and locale-less addresses lead to the profile', async ({page}) => {
  for (const [from, to] of [
    ['/en/objects/token:uniswap', '/en/objects/token--uniswap/'],
    ['/en/objects/token%3Auniswap', '/en/objects/token--uniswap/'],
    ['/en/objects/WETH9', '/en/objects/weth9/'],
    ['/EN/objects/weth9/', '/en/objects/weth9/'],
    ['/objects/weth9', '/en/objects/weth9/'],
    ['/en/objects/seaport-v1.6/', '/en/objects/seaport-v1-6/'],
    ['/en/collections/d0-in-use/', '/en/collections/d0/'],
  ]) {
    await page.goto(from);
    await expect(page, from).toHaveURL(new RegExp(`${to.replace(/[.]/g, '\\.')}$`));
    await expect(page.locator('h1')).not.toHaveText('Not in the directory');
  }
});

test('EDI’s guide opens from a grade, closes with Escape and returns focus', async ({page}) => {
  const errors: string[] = [];
  page.on('console', message => message.type() === 'error' && errors.push(message.text()));
  await page.goto('/en/objects/weth9/');
  const explain = page.locator('button[data-guide]').first();
  await explain.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Who can change the rules?');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(explain).toBeFocused();
  expect(errors).toEqual([]);
});

test('the introduction says how EDI complements L2BEAT, linking L2BEAT and the full explanation', async ({page}) => {
  await page.goto('/en/');
  const intro = page.locator('.home-intro');
  await expect(intro).toContainText('EDI regards L2BEAT as the authority on scientific risk assessment');
  await expect(intro.getByRole('link', {name: /Explore L2BEAT’s detailed risk assessments/})).toHaveAttribute('href', 'https://l2beat.com/');
  await intro.getByRole('link', {name: 'How EDI complements L2BEAT'}).click();
  await expect(page).toHaveURL(/\/en\/methodology\/#l2beat$/);
  const section = page.locator('#l2beat');
  await expect(section.getByRole('heading', {name: 'How EDI complements L2BEAT'})).toBeInViewport();
  for (const text of ['prioritizing accuracy and storytelling over fine-grained precision', 'not a complete risk model or a mechanical conversion of L2BEAT’s assessments', 'not an endorsement of its ratings by L2BEAT'])
    await expect(section).toContainText(text);
  await expect(section.getByRole('link', {name: /Explore L2BEAT’s detailed risk assessments/})).toHaveAttribute('href', 'https://l2beat.com/');
  await expect(page.locator('.method-toc a[href="#l2beat"]')).toHaveText('How EDI complements L2BEAT');
});

test('EDI’s guide explains L2BEAT’s role, and a network links its detailed L2BEAT assessment', async ({page}) => {
  const base = 'https://l2beat.com/layer2s/projects/base';
  await page.goto('/en/objects/base/');
  await expect(page.locator(`.assessment-panel a[href="${base}"]`)).toContainText('Read L2BEAT’s detailed assessment');
  await page.locator('button[data-guide]').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', {name: 'How EDI complements L2BEAT'})).toBeVisible();
  await expect(dialog).toContainText('a single, accessible D0–D9 rating');
  await expect(dialog.getByRole('link', {name: 'Read L2BEAT’s detailed assessment'})).toHaveAttribute('href', base);
  // L2BEAT does not assess WETH, so its guide links L2BEAT itself and its profile adds no L2BEAT link.
  await page.goto('/en/objects/weth9/');
  await expect(page.locator('.assessment-panel a[href*="l2beat.com"]')).toHaveCount(0);
  await page.locator('button[data-guide]').first().click();
  await expect(page.getByRole('dialog').getByRole('link', {name: 'Explore L2BEAT’s detailed risk assessments'})).toHaveAttribute('href', 'https://l2beat.com/');
});

test('Compare USDC and a D0 core: both legible, no overall score', async ({page}) => {
  await page.goto('/en/compare/?ids=usdc,weth9');
  await expect(page.locator('h1')).toHaveText('Compare');
  const body = page.locator('.compare-body');
  await expect(body).toContainText('USDC');
  await expect(body).toContainText('WETH');
  await expect(body.locator('.grade[data-grade="D9"]').first()).toBeVisible();
  await expect(body.locator('.grade[data-grade="D0"]').first()).toBeVisible();
  await expect(page.getByText(/There is no overall score/)).toBeVisible();
});

test('compare links are canonical, and unknown names are reported rather than guessed', async ({page}) => {
  await page.goto('/en/compare/?ids=weth9,usdc,Circle');
  await expect(page.getByText(/Not EDI records, so left out: Circle/)).toBeVisible();
  // The link keeps what it asked for, so a reload still says what was left out.
  await expect(page).toHaveURL(/\?ids=weth9,usdc,Circle$/);
  await page.reload();
  await expect(page.getByText(/Not EDI records, so left out: Circle/)).toBeVisible();
  await page.goto('/en/compare/?ids=weth9&ids=usdc');
  await expect(page).toHaveURL(/\/en\/compare\/\?ids=weth9,usdc$/);
  await expect(page).toHaveTitle(/^Compare: WETH and USDC · /);
});

test('the comparison follows its own links and forms in place, and Back restores it', async ({page}) => {
  await page.goto('/en/compare/');
  await page.locator('.suggestions a').first().click();
  await expect(page).toHaveURL(/\/en\/compare\/\?ids=usdc,weth9$/);
  await expect(page.locator('.compare-body')).toContainText('USDC');
  await page.locator('#compare-add').selectOption('morpho-blue');
  await page.locator('.compare-add button[type="submit"]').click();
  await expect(page).toHaveURL(/\/en\/compare\/\?ids=usdc,weth9,morpho-blue$/);
  await page.locator('.chip-remove').first().click();
  await expect(page).toHaveURL(/\/en\/compare\/\?ids=weth9,morpho-blue$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/compare\/\?ids=usdc,weth9,morpho-blue$/);
  await expect(page.locator('.compare-body th[scope="col"]')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('.compare-body th[scope="col"]')).toHaveCount(3);
});

test('without scripts the compare page says comparing needs them', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('/en/compare/?ids=usdc,weth9');
  await expect(page.getByText(/Comparing needs JavaScript/)).toBeVisible();
  await expect(page.locator('.suggestions')).toBeHidden();
  await context.close();
});

test('a missing page offers close matches and a search', async ({page}) => {
  const response = await page.goto('/en/objects/uniswap-v9/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('Not in the directory');
  await expect(page.locator('main a[href^="/en/objects/uniswap"]').first()).toBeVisible();
  await expect(page.locator('#nf-q')).toHaveValue('uniswap v9');
});

test('a missing page in another language is explained in that language', async ({page}) => {
  await page.goto('/de/objects/uniswap-v9/');
  await expect(page).toHaveURL(/\/de\/not-found\/\?path=%2Fde%2Fobjects%2Funiswap-v9%2F$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('main a[href^="/de/objects/uniswap"]').first()).toBeVisible();
});

test('without scripts a missing page still explains itself', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  const response = await page.goto('/en/objects/uniswap-v9/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toBeVisible();
  await context.close();
});
