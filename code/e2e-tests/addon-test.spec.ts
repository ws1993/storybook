import { expect, test } from '@playwright/test';
import process from 'process';

import { SbPage, hasVitestIntegration } from './util';

const storybookUrl = process.env.STORYBOOK_URL || 'http://localhost:8001';
const templateName = process.env.STORYBOOK_TEMPLATE_NAME || '';

test.describe('addon-test', () => {
  test.skip(
    !hasVitestIntegration,
    `Skipping ${templateName}, which does not have addon-test set up.`
  );

  test.beforeEach(async ({ page }) => {
    await page.goto(storybookUrl);
    await new SbPage(page, expect).waitUntilLoaded();
  });

  test('should have interactions', async ({ page }) => {
    // templateName is e.g. 'vue-cli/default-js'
    test.skip(
      /^(lit)/i.test(`${templateName}`),
      `Skipping ${templateName}, which does not support addon-test`
    );

    const sbPage = new SbPage(page, expect);

    await sbPage.navigateToStory('example/page', 'logged-in');
    await sbPage.viewAddonPanel('Component tests');

    const welcome = sbPage.previewRoot().locator('.welcome');
    await expect(welcome).toContainText('Welcome, Jane Doe!', { timeout: 50000 });

    const interactionsTab = page.locator('#tabbutton-storybook-test-panel');
    await expect(interactionsTab).toContainText(/(\d)/);
    await expect(interactionsTab).toBeVisible();

    const panel = sbPage.panelContent();
    await expect(panel).toContainText(/Pass/);
    await expect(panel).toContainText(/userEvent.click/);
    await expect(panel).toBeVisible();

    const done = panel.locator('[data-testid=icon-done]').nth(0);
    await expect(done).toBeVisible();
  });

  test('should step through interactions', async ({ page, browserName }) => {
    // templateName is e.g. 'vue-cli/default-js'
    test.skip(
      /^(lit)/i.test(`${templateName}`),
      `Skipping ${templateName}, which does not support addon-test`
    );
    test.skip(
      browserName === 'firefox',
      `Skipping on FIreFox, which has trouble with "initial value"`
    );

    const sbPage = new SbPage(page, expect);

    await sbPage.deepLinkToStory(storybookUrl, 'addons/test/basics', 'type-and-clear');
    await sbPage.viewAddonPanel('Component tests');

    // Test initial state - Interactions have run, count is correct and values are as expected
    const formInput = sbPage.previewRoot().locator('#interaction-test-form input');
    await expect(formInput).toHaveValue('final value', { timeout: 50000 });

    const interactionsTab = page.locator('#tabbutton-storybook-test-panel');
    await expect(interactionsTab.getByText('3')).toBeVisible();
    await expect(interactionsTab).toBeVisible();
    await expect(interactionsTab).toBeVisible();

    const panel = sbPage.panelContent();
    const runStatusBadge = panel.locator('[aria-label="Status of the test run"]');
    await expect(runStatusBadge).toContainText(/Pass/);
    await expect(panel).toContainText(/"initial value"/);
    await expect(panel).toContainText(/clear/);
    await expect(panel).toContainText(/"final value"/);
    await expect(panel).toBeVisible();

    // Test interactions debugger - Stepping through works, count is correct and values are as expected
    const interactionsRow = panel.locator('[aria-label="Interaction step"]');

    await interactionsRow.first().isVisible();

    await expect(interactionsRow).toHaveCount(3);
    const firstInteraction = interactionsRow.first();
    await firstInteraction.click();

    await expect(runStatusBadge).toContainText(/Runs/);
    await expect(formInput).toHaveValue('initial value');

    const goForwardBtn = panel.locator('[aria-label="Go forward"]');
    await goForwardBtn.click();
    await expect(formInput).toHaveValue('');
    await goForwardBtn.click();
    await expect(formInput).toHaveValue('final value');

    await expect(runStatusBadge).toContainText(/Pass/);

    // Test rerun state (from addon panel) - Interactions have rerun, count is correct and values are as expected
    const rerunInteractionButton = panel.locator('[aria-label="Rerun"]');
    await rerunInteractionButton.click();

    await expect(formInput).toHaveValue('final value');

    await interactionsRow.first().isVisible();
    await interactionsRow.nth(1).isVisible();
    await interactionsRow.nth(2).isVisible();
    await expect(interactionsTab.getByText('3')).toBeVisible();
    await expect(interactionsTab).toBeVisible();
    await expect(interactionsTab.getByText('3')).toBeVisible();

    // Test remount state (from toolbar) - Interactions have rerun, count is correct and values are as expected
    const remountComponentButton = page.locator('[title="Remount component"]');
    await remountComponentButton.click();

    await interactionsRow.first().isVisible();
    await interactionsRow.nth(1).isVisible();
    await interactionsRow.nth(2).isVisible();
    await expect(interactionsTab.getByText('3')).toBeVisible();
    await expect(interactionsTab).toBeVisible();
    await expect(interactionsTab).toBeVisible();
    await expect(formInput).toHaveValue('final value');
  });

  test('should show unhandled errors', async ({ page }) => {
    test.skip(
      /^(lit)/i.test(`${templateName}`),
      `Skipping ${templateName}, which does not support addon-test`
    );
    // We trigger the implicit action error here, but angular works a bit different with implicit actions.
    test.skip(/^(angular)/i.test(`${templateName}`));

    const sbPage = new SbPage(page, expect);

    await sbPage.deepLinkToStory(storybookUrl, 'addons/test/unhandled-errors', 'default');
    await sbPage.viewAddonPanel('Component tests');

    const button = sbPage.previewRoot().locator('button');
    await expect(button).toContainText('Button', { timeout: 50000 });

    const panel = sbPage.panelContent();
    await expect(panel).toContainText(/Fail/);
    await expect(panel).toContainText(/Found 1 unhandled error/);
    await expect(panel).toBeVisible();
  });
});
