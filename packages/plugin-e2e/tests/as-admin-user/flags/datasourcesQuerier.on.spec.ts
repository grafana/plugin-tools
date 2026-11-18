import { test } from '../../../src';
import { dataQueryUrlsScenarios } from './scenarios/dataQueryUrls';

test.use({
  openFeature: { flags: { 'datasources.querier.fe-allowed-types': { types: ['grafana-test-datasource'] } } },
});

dataQueryUrlsScenarios({
  withBodyTest: true,
  title: 'datasources.querier.fe-allowed-types on',
  expectedPath: (namespace) => `/apis/query.grafana.app/v0alpha1/namespaces/${namespace}/query`,
});
