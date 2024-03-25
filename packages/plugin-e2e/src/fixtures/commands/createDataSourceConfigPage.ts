import { TestFixture } from '@playwright/test';
import { CreateDataSourcePageArgs, PluginFixture, PluginOptions } from '../../types';
import { PlaywrightCombinedArgs } from '../types';
import { DataSourceConfigPage } from '../../models';
import { createDataSourceViaAPI } from './createDataSource';

type CreateDataSourceConfigPageFixture = TestFixture<
  (args: CreateDataSourcePageArgs) => Promise<DataSourceConfigPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

export const createDataSourceConfigPage: CreateDataSourceConfigPageFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  let datasourceConfigPage: DataSourceConfigPage | undefined;
  let deleteDataSource = true;
  await use(async (args) => {
    deleteDataSource = args.deleteDataSourceAfterTest ?? true;
    const datasource = await createDataSourceViaAPI(request, args);
    datasourceConfigPage = new DataSourceConfigPage({ page, selectors, grafanaVersion, request, testInfo }, datasource);
    await datasourceConfigPage.goto();
    return datasourceConfigPage;
  });
  deleteDataSource && (await datasourceConfigPage?.deleteDataSource());
};
