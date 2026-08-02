import { expect, test } from '@playwright/test';

import { expectNoHorizontalOverflow } from './helpers';

test('shows hosted-scene loading and provides guided camera and label controls', async ({
  page,
}) => {
  await page.route('**/d1aa30ae/v1/meta.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 15_000));
    await route.abort('failed');
  });

  await page.goto('/');
  const stage = page.getByTestId('scene-stage');
  await expect(stage).toHaveAttribute('data-scene-state', 'loading');
  await expect(page.getByTestId('scene-poster')).toBeVisible();

  await expect(page.getByTestId('camera-preset-overview')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByTestId('camera-preset-seating-zone').click({ force: true });
  await expect(page.getByTestId('camera-preset-seating-zone')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page
    .getByTestId('camera-preset-dining-kitchen-zone')
    .click({ force: true });
  await expect(page.getByTestId('camera-preset-dining-kitchen-zone')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByTestId('reset-camera').click({ force: true });
  await expect(page.getByTestId('camera-preset-overview')).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const labelToggle = page.getByTestId('toggle-spatial-labels');
  await labelToggle.click({ force: true });
  await expect(stage).toHaveAttribute(
    'data-labels-visible',
    'false',
  );
  await expect(page.locator('[data-testid^="hotspot-label-"]')).toHaveCount(5);
  for (const hotspotId of [
    'temperature',
    'occupancy',
    'lighting',
    'appliance',
    'engagement',
  ]) {
    await expect(page.getByTestId(`hotspot-label-${hotspotId}`)).toHaveAttribute(
      'data-visible',
      'false',
    );
  }
  await labelToggle.click({ force: true });
  await expect(stage).toHaveAttribute(
    'data-labels-visible',
    'true',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByTestId('camera-preset-dining-kitchen-zone')
    .click({ force: true });
  await expectNoHorizontalOverflow(page);
  const stageBox = await page.getByTestId('scene-stage').boundingBox();
  expect(stageBox?.height ?? 0).toBeGreaterThanOrEqual(430);

  const labels = page.locator('[data-testid^="hotspot-label-"]');
  const labelStyles = await labels.evaluateAll((elements) =>
    elements.map((label) => {
      const rectangle = label.getBoundingClientRect();
      return {
        left: rectangle.left,
        right: rectangle.right,
        maxWidth: getComputedStyle(label).maxWidth,
        secondaryDisplay: getComputedStyle(
          label.querySelector('small') as HTMLElement,
        ).display,
      };
    }),
  );
  labelStyles.forEach(({ left, right, maxWidth, secondaryDisplay }) => {
    if (right > left) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(390);
    }
    expect(maxWidth).toBe('144px');
    expect(secondaryDisplay).toBe('none');
  });

  await expect(stage).toHaveAttribute('data-scene-state', 'error');
});

test('keeps all demonstration scenario rule sets reproducible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-shell')).toBeVisible();

  await page.getByTestId('scenario-normal').click({ force: true });
  await expect(page.getByTestId('active-recommendation-count')).toHaveText('0 active');

  await page.getByTestId('scenario-strong-interest').click({ force: true });
  await expect(page.getByTestId('active-recommendation-count')).toHaveText('1 active');
  await expect(page.getByTestId('recommendation-strong-social-interest')).toBeVisible();

  await page.getByTestId('scenario-combined-intervention').click({ force: true });
  await expect(page.getByTestId('active-recommendation-count')).toHaveText('2 active');
  await expect(page.getByTestId('recommendation-warm-occupied')).toBeVisible();
  await expect(page.getByTestId('recommendation-poor-presentation')).toBeVisible();
  await expect(page.locator('[data-testid^="recommendation-"]')).toHaveCount(2);
});

test('presentation mode is concise, reversible and never exposes calibration', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?present=1&calibrate=1');
  await expect(page.getByTestId('app-shell')).toBeVisible();

  await expect(page.getByTestId('app-shell')).toHaveAttribute(
    'data-presentation-mode',
    'true',
  );
  await expect(page.getByTestId('toggle-decision-events')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(page.getByRole('heading', { name: 'Splat hotspot calibration' })).toHaveCount(0);
  await expect(page.getByTestId('camera-preset-overview')).toBeVisible();
  await expect(page.getByTestId('scenario-strong-interest')).toBeVisible();
  await expect(page.getByTestId('scenario-combined-intervention')).toBeVisible();

  await page.getByTestId('presentation-mode-toggle').click({ force: true });
  await expect(page.getByTestId('app-shell')).toHaveAttribute(
    'data-presentation-mode',
    'false',
  );
});

test('shows a typed hosted-scene failure, retry control and official fallback', async ({
  page,
}) => {
  await page.route('**/d1aa30ae/v1/meta.json', async (route) => {
    await route.abort('failed');
  });
  await page.goto('/');

  const stage = page.getByTestId('scene-stage');
  await expect(stage).toHaveAttribute('data-scene-state', 'error');
  await expect(page.getByTestId('scene-status')).toHaveAttribute(
    'data-error-kind',
    'metadata-fetch',
  );
  await expect(page.getByTestId('retry-scene')).toBeVisible();
  await expect(page.getByTestId('scene-fallback-link')).toHaveAttribute(
    'href',
    'https://superspl.at/scene/d1aa30ae',
  );
  await expect(page.getByTestId('demonstration-scenarios')).toBeVisible();
  await expect(page.getByTestId('decision-support')).toBeVisible();

  await page.unroute('**/d1aa30ae/v1/meta.json');
  await page.route('**/d1aa30ae/v1/meta.json', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    await route.abort('failed');
  });
  await page.getByTestId('retry-scene').click({ force: true });
  await expect(stage).toHaveAttribute('data-scene-state', 'loading');
});
