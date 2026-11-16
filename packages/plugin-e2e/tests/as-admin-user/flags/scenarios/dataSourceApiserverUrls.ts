import * as semver from 'semver';
import { expect, test } from '../../../../src';

export interface DataSourceApiserverUrlsConfig {
  title: string;
  /** Pathname the health check is expected to use, given the namespace and data source uid. */
  expectedHealthPath: (namespace: string, uid: string) => string;
}

export function dataSourceApiserverUrlsScenarios({ title, expectedHealthPath }: DataSourceApiserverUrlsConfig) {
  test.describe(title, () => {
    test.skip(({ grafanaVersion }) => semver.lt(grafanaVersion, '13.3.0'), 'flag is only relevant on Grafana 13.3+');

    test('saveAndTest waits for the health check response', async ({
      createDataSourceConfigPage,
      readProvisionedDataSource,
      page,
      namespace,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
      const configPage = await createDataSourceConfigPage({ type: ds.type });
      await configPage.mockHealthCheckResponse({ status: 'OK', message: 'Mocked health check' });
      await page.getByLabel('Path').fill('example.com');

      const response = await configPage.saveAndTest();

      expect(response.ok()).toBe(true);
      expect(new URL(response.url()).pathname).toBe(expectedHealthPath(namespace, configPage.datasource.uid));
      await expect(configPage).toHaveAlert('success', { hasText: 'Mocked health check' });
    });

    test('mockResourceResponse mocks the resource calls of the data source', async ({
      createDataSourceConfigPage,
      readProvisionedDataSource,
      page,
      namespace,
    }) => {
      const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
      const configPage = await createDataSourceConfigPage({ type: ds.type });
      await configPage.mockResourceResponse('projects', ['mocked-project']);
      const { uid } = configPage.datasource;

      const resourceUrls = [
        `/api/datasources/uid/${uid}/resources/projects`,
        `/apis/${ds.type}.datasource.grafana.app/v0alpha1/namespaces/${namespace}/datasources/${uid}/resources/projects`,
      ];
      for (const url of resourceUrls) {
        const body = await page.evaluate(async (resourceUrl) => (await fetch(resourceUrl)).json(), url);
        expect(body).toEqual(['mocked-project']);
      }
    });
  });
}
