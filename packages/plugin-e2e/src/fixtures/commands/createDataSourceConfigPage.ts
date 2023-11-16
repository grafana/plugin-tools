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
  await use(async (args) => {
    const datasource = await createDataSourceViaAPI(request, args);
    const datasourceConfigPage = new DataSourceConfigPage(
      { page, selectors, grafanaVersion, request },
      expect,
      datasource.uid
    );
    await datasourceConfigPage.goto();
    return datasourceConfigPage;
  });
};

export default createDataSourceConfigPage;
