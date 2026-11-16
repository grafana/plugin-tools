import * as semver from 'semver';
import { expect, test } from '../../../../src';

export function dataSourceCrudApisScenarios(enabled: boolean) {
  test.describe(`datasources.config.ui.useNewDatasourceCRUDAPIs ${enabled ? 'on' : 'off'}`, () => {
    test.skip(({ grafanaVersion }) => semver.lt(grafanaVersion, '13.0.0'), 'flag is only relevant on Grafana 13+');

    test('saveAndTest saves the data source and waits for the health check response', async ({
      createDataSourceConfigPage,
      readProvisionedDataSource,
      request,
      page,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
      if (enabled) {
        // the frontend reads and saves through the datasource apiserver, which the backend serves behind its own toggles
        const group = await request.get(`/apis/${ds.type}.datasource.grafana.app/v0alpha1`);
        test.skip(!group.ok(), 'the backend does not serve the datasource apiserver');
      }

      const configPage = await createDataSourceConfigPage({ type: ds.type });
      await page.getByLabel('Path').fill('example.com');

      await expect(configPage.saveAndTest()).toBeOK();
      await expect(configPage).toHaveAlert('success');
    });
  });
}
