import { lt } from 'semver';
import { expect, test } from '../../../../src';

test.use({
  openFeature: {
    flags: {
      'datasources.config.ui.useNewDatasourceCRUDAPIs': true,
      datasourcesApiServerEnableHealthEndpointFrontend: true,
      'datasources.apiserver.fe-allowed-types': { resources: [], health: ['*'] },
    },
  },
});

// The API server only serves plugins that are installed when Grafana starts, so this test uses a core data source
test('should save and test through the data source API server', async ({
  createDataSourceConfigPage,
  grafanaVersion,
}) => {
  test.skip(lt(grafanaVersion, '13.1.0'), 'docker-compose.yaml enables the data source API server from Grafana 13.1.0');
  const configPage = await createDataSourceConfigPage({ type: 'grafana-postgresql-datasource' });
  // not.toBeOK() also passes when saveAndTest() times out
  const response = await configPage.saveAndTest();
  expect(response.ok()).toBe(false);
  await expect(configPage).toHaveAlert('error');
});
