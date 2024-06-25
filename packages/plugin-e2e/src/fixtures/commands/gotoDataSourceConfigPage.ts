import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../../types';
import { DataSourceConfigPage } from '../../models/pages/DataSourceConfigPage';

type GotoDataSourceConfigPageFixture = TestFixture<(uid: string) => Promise<DataSourceConfigPage>, PlaywrightArgs>;

export const gotoDataSourceConfigPage: GotoDataSourceConfigPageFixture = async (
  { request, page, selectors, grafanaVersion, grafanaAPIClient },
  use,
  testInfo
) => {
  await use(async (uid) => {
    const settings = await grafanaAPIClient.getDataSourceSettingsByUID(uid);
    const dataSourceConfigPage = new DataSourceConfigPage(
      { page, selectors, grafanaVersion, request, testInfo },
      settings
    );
    await dataSourceConfigPage.goto();
    return dataSourceConfigPage;
  });
};
