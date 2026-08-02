import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const expectNoSeriousAxeViolations = async (
  page: Page,
  mode: string,
): Promise<void> => {
  const results = await new AxeBuilder({ page }).analyze();
  const seriousOrCritical = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical',
  );
  const moderate = results.violations.filter(({ impact }) => impact === 'moderate');
  console.info(
    `[axe:${mode}] violations=${results.violations.length}; ` +
      `serious-or-critical=${seriousOrCritical.length}; ` +
      `moderate=${moderate.length} (${moderate.map(({ id }) => id).join(', ') || 'none'}); ` +
      `incomplete=${results.incomplete.length} ` +
      `(${results.incomplete.map(({ id }) => id).join(', ') || 'none'})`,
  );
  expect(
    seriousOrCritical,
    seriousOrCritical
      .map(({ id, impact, help }) => `${impact}: ${id} — ${help}`)
      .join('\n'),
  ).toEqual([]);
};

test('ordinary desktop mode has no serious or critical axe findings', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'ordinary-desktop');
});

test('presentation mode has no serious or critical axe findings', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?present=1');
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'presentation');
});

test('mobile mode has no serious or critical axe findings', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expectNoSeriousAxeViolations(page, 'mobile');
});

test('an active combined recommendation state has no serious or critical axe findings', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await page.getByTestId('scenario-combined-intervention').click({ force: true });
  await expect(page.getByTestId('active-recommendation-count')).toHaveText('2 active');
  await expectNoSeriousAxeViolations(page, 'combined-recommendation');
});
