import { test } from '../../../src';
import { dataQueryUrlsScenarios } from './scenarios/dataQueryUrls';

test.use({
  openFeature: {
    flags: {
      'datasources.querier.fe-allowed-types': { types: ['grafana-test-datasource'] },
      'datasources.querier.newName': true,
    },
  },
});

dataQueryUrlsScenarios({
  title: 'datasources.querier.newName on',
  expectedPath: (namespace) => `/apis/datasource.grafana.app/v0alpha1/namespaces/${namespace}/query`,
});
