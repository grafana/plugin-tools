import { expect, TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { CreateDataSourcePageArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';
import { DataSourceConfigPage } from '../../models';
import { createDataSourceViaAPI } from './createDataSource';

type CreateDataSourceConfigPageFixture = TestFixture<
  (args: CreateDataSourcePageArgs) => Promise<DataSourceConfigPage>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

const createDataSourceConfigPage: CreateDataSourceConfigPageFixture = async (
  { request, page, selectors, grafanaVersion },
  use
) => {
  let datasourceConfigPage: DataSourceConfigPage | undefined;
  let deleteDataSource = true;
  await use(async (args) => {
    deleteDataSource = args.deleteDataSourceAfterTest ?? true;
    const datasource = await createDataSourceViaAPI(request, args);
    datasourceConfigPage = new DataSourceConfigPage(
      { page, selectors, grafanaVersion, request },
      expect,
      datasource.uid
    );
    await datasourceConfigPage.goto();
    return datasourceConfigPage;
  });
  deleteDataSource && (await datasourceConfigPage?.deleteDataSource());
};

export default createDataSourceConfigPage;
