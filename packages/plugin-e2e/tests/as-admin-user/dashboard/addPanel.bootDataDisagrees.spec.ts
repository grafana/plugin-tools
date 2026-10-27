import * as semver from 'semver';
import { expect, test } from '../../../src';

// Grafana 13.3+ reads dashboardNewLayouts through OpenFeature, so overriding only the boot data
// toggle leaves boot data reporting the layout as off while the sidebar renders.
// addPanel must follow the rendered page (grafana/plugin-tools#3016).
test.use({ featureToggles: { dashboardNewLayouts: false } });

test('addPanel follows the rendered layout when boot data reports dashboardNewLayouts as off', async ({
  dashboardPage,
  page,
  grafanaVersion,
}) => {
  test.skip(semver.lt(grafanaVersion, '13.0.0'), 'dashboardNewLayouts toggle only applies to Grafana 13+');
  const panelEditPage = await dashboardPage.addPanel();
  await expect(panelEditPage.panel.locator).toBeVisible();
  expect(page.url()).toContain('editPanel');
});
