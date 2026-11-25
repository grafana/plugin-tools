import { test } from '../../../src';
import { dataQueryUrlsScenarios } from './scenarios/dataQueryUrls';

test.use({
  openFeature: { flags: { 'datasources.querier.fe-allowed-types': { types: [] } } },
});

dataQueryUrlsScenarios({
  title: 'datasources.querier.fe-allowed-types off',
  expectedPath: () => '/api/ds/query',
});
