import { TestFixture } from '@playwright/test';
import { CreateDataSourcePageArgs, PlaywrightArgs } from '../../types';
import { createDataSourceViaAPI } from './createDataSource';
import { DataSourceConfigPage } from '../../models/pages/DataSourceConfigPage';

type CreateDataSourceConfigPageFixture = TestFixture<
  (args: CreateDataSourcePageArgs) => Promise<DataSourceConfigPage>,
  PlaywrightArgs
>;

export const createDataSourceConfigPage: CreateDataSourceConfigPageFixture = async (
  { request, page, selectors, grafanaVersion, grafanaAPIClient },
  use,
  testInfo
) => {
  let datasourceConfigPage: DataSourceConfigPage | undefined;
  let deleteDataSource = true;
  await use(async (args) => {
    deleteDataSource = args.deleteDataSourceAfterTest ?? true;
    const datasource = await createDataSourceViaAPI(grafanaAPIClient, args);
    datasourceConfigPage = new DataSourceConfigPage({ page, selectors, grafanaVersion, request, testInfo }, datasource);
    await datasourceConfigPage.goto();
    return datasourceConfigPage;
  });
  deleteDataSource && (await datasourceConfigPage?.deleteDataSource());
};
