import { test } from '../../../src';
import { dataSourceApiserverUrlsScenarios } from './scenarios/dataSourceApiserverUrls';

test.use({
  openFeature: { flags: { 'datasources.apiserver.fe-allowed-types': { resources: [], health: [] } } },
});

dataSourceApiserverUrlsScenarios({
  title: 'datasources.apiserver.fe-allowed-types off',
  expectedHealthPath: (_namespace, uid) => `/api/datasources/uid/${uid}/health`,
});
