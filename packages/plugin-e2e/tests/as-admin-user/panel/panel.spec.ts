import { expect, test } from '../../../src';
import { clickRadioButton } from '../../utils';

test.describe.configure({ mode: 'parallel' });
test('add a clock panel in new dashboard and set time format to "12 hour"', async ({ panelEditPage, page }) => {
  await panelEditPage.setVisualization('Clock');
  await panelEditPage.setPanelTitle('Clock panel test');
  await panelEditPage.collapseSection('Clock');
  await clickRadioButton(page, '12 Hour');
  //TODO: add data-testid selector to clock panel
  await expect(page.getByRole('heading', { name: /.*[APap][mM]$/ })).toBeVisible();
});

test('open a clock panel in a provisioned dashboard and set time format to "12 hour"', async ({
  page,
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'clock-panel.json' });
  const args = { dashboard: { uid: dashboard.uid }, id: '5' };
  const panelEditPage = await gotoPanelEditPage(args);
  await expect(panelEditPage.getVisualizationName()).toHaveText('Clock');
  await panelEditPage.collapseSection('Clock');
  await clickRadioButton(page, '12 Hour');
  await expect(page.getByRole('heading', { name: /.*[APap][mM]$/ })).toBeVisible();
});
