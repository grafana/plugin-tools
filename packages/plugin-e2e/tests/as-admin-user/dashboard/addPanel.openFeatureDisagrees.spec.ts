import * as semver from 'semver';
import { expect, test } from '../../../src';

// Grafana 13.3+ reads dashboardNewLayouts through OpenFeature, so overriding only the OpenFeature
// flag renders the legacy toolbar while boot data still reports the layout as on.
// addPanel must follow the rendered page (grafana/plugin-tools#3016).
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
