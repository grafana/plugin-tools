import * as semver from 'semver';
import { expect, test } from '../../../src';

// on 13.3+ the toolbar renders while boot data says on (#3016)
test.use({ openFeature: { flags: { dashboardNewLayouts: false } } });

test('addPanel follows the rendered layout when only OpenFeature turns dashboardNewLayouts off', async ({
  dashboardPage,
  page,
  grafanaVersion,
}) => {
  test.skip(semver.lt(grafanaVersion, '13.0.0'), 'dashboardNewLayouts toggle only applies to Grafana 13+');
  const panelEditPage = await dashboardPage.addPanel();
  await expect(panelEditPage.panel.locator).toBeVisible();
  expect(page.url()).toContain('editPanel');
});
