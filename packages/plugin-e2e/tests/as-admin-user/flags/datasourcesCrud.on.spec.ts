import { test } from '../../../src';
import { dataSourceCrudApisScenarios } from './scenarios/dataSourceCrudApis';

test.use({
  openFeature: { flags: { 'datasources.config.ui.useNewDatasourceCRUDAPIs': true } },
});

dataSourceCrudApisScenarios(true);
