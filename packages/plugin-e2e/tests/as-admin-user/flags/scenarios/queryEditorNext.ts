import * as semver from 'semver';
import { expect, test } from '../../../../src';

export function queryEditorNextScenarios(enabled: boolean) {
  test.describe(`queryEditorNext ${enabled ? 'on' : 'off'}`, () => {
    test.skip(
      ({ grafanaVersion }) => semver.lt(grafanaVersion, '13.4.0'),
      'the e2e selectors for this flag ship in Grafana 13.4'
    );

    test('sets the data source and renders the query editor row', async ({
      panelEditPage,
      readProvisionedDataSource,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
      await panelEditPage.datasource.set(ds.name);
      await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
    });

    test('refreshPanel waits for the data query response', async ({ panelEditPage, readProvisionedDataSource }) => {
      const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
      await panelEditPage.datasource.set(ds.name);
      await panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' }).fill('query');
      await expect(panelEditPage.refreshPanel()).toBeOK();
    });
  });
}
