import { TestFixture } from '@playwright/test';
import { DataSourceSettings, PlaywrightArgs } from '../../types';
import { DataSourceConfigPage } from '../../models/pages/DataSourceConfigPage';

type GotoDataSourceConfigPageFixture = TestFixture<(uid: string) => Promise<DataSourceConfigPage>, PlaywrightArgs>;

export const gotoDataSourceConfigPage: GotoDataSourceConfigPageFixture = async (
  { request, page, selectors, grafanaVersion, grafanaAPICredentials },
  use,
  testInfo
) => {
  await use(async (uid) => {
    const response = await request.get(`/api/datasources/uid/${uid}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${grafanaAPICredentials.user}:${grafanaAPICredentials.password}`).toString(
          'base64'
        )}`,
      },
    });
    if (!response.ok()) {
      throw new Error(
        `Failed to get datasource by uid: ${response.statusText()}. If you're using a provisioned data source, make sure it has a UID`
      );
    }
    const settings: DataSourceSettings = await response.json();
    const dataSourceConfigPage = new DataSourceConfigPage(
      { page, selectors, grafanaVersion, request, testInfo },
      settings
    );
    await dataSourceConfigPage.goto();
    return dataSourceConfigPage;
  });
};
