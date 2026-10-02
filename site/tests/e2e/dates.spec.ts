/**
 * Pages show EDI's result for the reader's UTC date. A page rendered or cached
 * before a review deadline must not keep showing a grade EDI has since changed.
 */
import {expect, test} from '@playwright/test';

const AFTER_DEADLINE = new Date('2026-11-02T08:00:00Z');

test('Cross the monthly deadline: a profile shows the partial grade, the floor and the overdue review', async ({page}) => {
  await page.clock.setFixedTime(AFTER_DEADLINE);
  await page.goto('/en/objects/usdc');
  await expect(page.locator('.assessment .grade[data-grade]').first()).toHaveAttribute('data-grade', '≥ D9');
  await expect(page.getByText(/Review overdue since/).first()).toBeVisible();
});

test('Cross the monthly deadline: directory rows follow the reader’s date', async ({page}) => {
  await page.clock.setFixedTime(AFTER_DEADLINE);
  await page.goto('/en/?q=usdc');
  await expect(page.locator('li.row[data-id="usdc"] .row-grade .grade').first()).toHaveAttribute('data-grade', '≥ D9');
});

test('Revisit permanent D0 later: no expiry by age', async ({page}) => {
  await page.clock.setFixedTime(new Date('2031-06-01T12:00:00Z'));
  await page.goto('/en/objects/weth9');
  await expect(page.locator('.assessment .grade[data-grade]').first()).toHaveAttribute('data-grade', 'D0');
  await expect(page.getByText('Permanent D0').first()).toBeVisible();
});

test('a tab left open across midnight updates itself', async ({page}) => {
  await page.clock.install({time: new Date('2026-10-31T23:59:30Z')});
  await page.goto('/en/objects/usdc');
  const badge = page.locator('.assessment .grade[data-grade]').first();
  const before = await badge.getAttribute('data-grade');
  await page.clock.runFor(60_000);
  await expect(badge).toHaveAttribute('data-grade', '≥ D9');
  expect(['D9', '≥ D9']).toContain(before);
});
