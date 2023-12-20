import fs from 'fs';
import { DashboardPage, PanelEditPage, expect, test } from '../../src';
import { Dashboard } from '../../src/types';

test.describe.configure({ mode: 'parallel' });
test('add a clock panel in new dashboard and set time format to "12 hour"', async ({ panelEditPage, page }) => {
  await panelEditPage.setVisualization('Clock');
  await panelEditPage.setPanelTitle('Clock panel test');
  await panelEditPage.collapseSection('Clock');
  await page.getByText('12 Hour').locator('..').click();
  //TODO: add data-testid selector to clock panel
  await expect(page.getByRole('heading', { name: /.*[APap][mM]$/ })).toBeVisible();
});

test('open a clock panel in a provisioned dashboard and set time format to "12 hour"', async ({
  selectors,
  page,
  request,
  grafanaVersion,
  readProvision,
}) => {
  const dashboard = await readProvision<Dashboard>({ filePath: 'dashboards/clock-panel.json' });
  const args = { dashboard: { uid: dashboard.uid }, id: '5' };
  const panelEditPage = await new PanelEditPage({ page, selectors, grafanaVersion, request }, args);
  await panelEditPage.goto();
  await expect(panelEditPage.getVisualizationName()).toHaveText('Clock');
  await panelEditPage.collapseSection('Clock');
  await page.getByText('12 Hour').locator('..').click();
  await expect(page.getByRole('heading', { name: /.*[APap][mM]$/ })).toBeVisible();
});
