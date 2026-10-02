/**
 * Draws the social cards, public/social/{locale}.png (1200 × 630), with the
 * site's fonts, EDI's palette and EDI's own words for each language.
 *
 *   node scripts/social-cards.ts [locale…]
 *
 * Run it after changing the product name, the tagline or EDI's colors, and
 * commit the images. The Chinese, Japanese and Korean cards need Noto Sans
 * CJK installed (fonts-noto-cjk on Debian and Ubuntu).
 */
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {chromium} from '@playwright/test';
import {levelColor, locales as ediLocales} from 'ethereum-decentralization-index';
import {EDI_LOCALE, LOCALES, PRODUCT, isLocale, type Locale} from '../src/config.ts';
import {messages} from '../src/i18n/index.ts';

const require = createRequire(import.meta.url);
const font = (file: string) => `url(data:font/woff2;base64,${readFileSync(require.resolve(`@fontsource-variable/${file}`)).toString('base64')}) format('woff2')`;
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215';
const FACES = `
  @font-face { font-family: Newsreader; font-weight: 200 800; src: ${font('newsreader/files/newsreader-latin-wght-normal.woff2')}; unicode-range: ${LATIN}; }
  @font-face { font-family: Newsreader; font-weight: 200 800; src: ${font('newsreader/files/newsreader-latin-ext-wght-normal.woff2')}; }
  @font-face { font-family: Schibsted; font-weight: 400 900; src: ${font('schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2')}; unicode-range: ${LATIN}; }
  @font-face { font-family: Schibsted; font-weight: 400 900; src: ${font('schibsted-grotesk/files/schibsted-grotesk-latin-ext-wght-normal.woff2')}; }
`;
const CJK: Partial<Record<Locale, string>> = {
  'zh-CN': `'Noto Sans CJK SC', 'Noto Sans SC'`,
  ja: `'Noto Sans CJK JP', 'Noto Sans JP'`,
  ko: `'Noto Sans CJK KR', 'Noto Sans KR'`,
};
const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function card(locale: Locale): string {
  const m = messages(locale);
  const edi = ediLocales[EDI_LOCALE[locale]];
  const cjk = CJK[locale] ? `${CJK[locale]}, ` : '';
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
${FACES}
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; }
body { background: #f7f5ef; color: #15171b; font-family: Schibsted, ${cjk}sans-serif; padding: 64px 72px 60px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 22px; }
.mark { width: 68px; height: 68px; flex: none; }
.name { font: 620 50px/1 Newsreader, ${cjk}serif; letter-spacing: -0.012em; }
.tagline { margin-top: 10px; font-size: 25px; line-height: 1.3; color: #353a43; }
.question { margin-top: auto; font: 560 82px/1.08 Newsreader, ${cjk}serif; letter-spacing: -0.02em; max-width: 1000px; }
.spectrum { margin-top: 44px; display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px; }
.level { height: 64px; border-radius: 10px; background: #06111e; border: 3px solid var(--c); color: var(--c); display: grid; place-items: center; font: 760 28px/1 Schibsted, sans-serif; }
.ends { margin-top: 14px; display: flex; justify-content: space-between; gap: 40px; font-size: 21px; color: #353a43; }
</style></head><body>
<div class="brand">
  <svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#06111e"/><path d="M16 5 8 17l8 4 8-4z" fill="none" stroke="#edfaff" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 19.5l8 4 8-4" fill="none" stroke="#edfaff" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 27h18" stroke="#8bffff" stroke-width="2.4" stroke-linecap="round"/></svg>
  <div><div class="name">${escape(PRODUCT.name)}</div><div class="tagline">${escape(m.meta.tagline)}</div></div>
</div>
<h1 class="question">${escape(edi.guideQuestion)}</h1>
<div class="spectrum">${LEVELS.map(level => `<div class="level" style="--c: ${levelColor(level)}">D${level}</div>`).join('')}</div>
<div class="ends"><span>D0 · ${escape(edi.tiers[0].label)}</span><span>D9 · ${escape(edi.tiers[9].label)}</span></div>
</body></html>`;
}

const requested = process.argv.slice(2);
const targets = requested.length ? requested.filter(isLocale) : [...LOCALES];
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1200, height: 630}, deviceScaleFactor: 1});
for (const locale of targets) {
  await page.setContent(card(locale), {waitUntil: 'load'});
  await page.evaluate(() => document.fonts.ready);
  const path = new URL(`../public/social/${locale}.png`, import.meta.url).pathname;
  await page.screenshot({path, type: 'png'});
  console.log(`wrote public/social/${locale}.png`);
}
await browser.close();
