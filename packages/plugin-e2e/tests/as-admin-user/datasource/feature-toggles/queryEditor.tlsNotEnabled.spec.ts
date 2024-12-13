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
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'test-datasource.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  const editorRow = panelEditPage.getQueryEditorRow('A');
  await expect(editorRow.getByLabel('TLS Enabled')).not.toBeVisible();
});
