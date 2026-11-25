import { test } from '../../../src';
import { dataSourceApiserverUrlsScenarios } from './scenarios/dataSourceApiserverUrls';

test.use({
  openFeature: { flags: { 'datasources.apiserver.fe-allowed-types': { resources: ['*'], health: ['*'] } } },
});

dataSourceApiserverUrlsScenarios({
  withResourceTest: true,
  title: 'datasources.apiserver.fe-allowed-types on',
  expectedHealthPath: (namespace, uid) =>
    `/apis/grafana-test-datasource.datasource.grafana.app/v0alpha1/namespaces/${namespace}/datasources/${uid}/health`,
});
