import * as semver from 'semver';
import { expect, test } from '../../../../src';

// override the feature toggles defined in playwright.config.ts only for tests in this file
test.use({
  featureToggles: {
    tlsEnabled: false,
  },
});

test('should not display TLS enabled field when tlsEnabled feature toggle is set to false', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  grafanaVersion,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  const editorRow = panelEditPage.getQueryEditorRow('A');
  const locator = semver.lt(grafanaVersion, '9.3.0')
    ? editorRow.locator(`[label="TLS Enabled"]`).locator('../label')
    : editorRow.getByLabel('TLS Enabled');
  await expect(locator).not.toBeVisible();
});
