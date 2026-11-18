import { lt } from 'semver';
import { expect, test } from '../../../../src';

// Grafana 13.0 reads the legacy toggle, 13.1 and 13.2 the boolean flag, and 13.3+ the allowed types
test.use({
  featureToggles: { datasourcesApiServerEnableHealthEndpointFrontend: true },
  openFeature: {
    flags: {
      datasourcesApiServerEnableHealthEndpointFrontend: true,
      'datasources.apiserver.fe-allowed-types': { resources: [], health: ['*'] },
    },
  },
});

test('should mock the health check of the data source API server', async ({
  createDataSourceConfigPage,
  readProvisionedDataSource,
  grafanaVersion,
  page,
}) => {
  test.skip(lt(grafanaVersion, '13.0.0'), 'The data source API server health check was introduced in Grafana 13.0.0');
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  const configPage = await createDataSourceConfigPage({ type: ds.type });
  await configPage.mockHealthCheckResponse({ status: 'OK', message: 'Mocked health check' });
  await page.getByLabel('Path').fill('example.com');
  await expect(configPage.saveAndTest()).toBeOK();
  await expect(configPage).toHaveAlert('success', { hasText: 'Mocked health check' });
});
