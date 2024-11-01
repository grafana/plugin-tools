import { v4 as uuidv4 } from 'uuid';
import { expect, TestFixture } from '@playwright/test';
import { CreateDataSourceArgs, DataSourceSettings, PlaywrightArgs } from '../../types';
import { GrafanaAPIClient } from '../../models/GrafanaAPIClient';

type CreateDataSourceViaAPIFixture = TestFixture<
  (args: CreateDataSourceArgs) => Promise<DataSourceSettings>,
  PlaywrightArgs
>;

export const createDataSourceViaAPI = async (
  grafanaAPIClient: GrafanaAPIClient,
  datasource: CreateDataSourceArgs
): Promise<DataSourceSettings> => {
  const { type, name } = datasource;
  const dsName = name ?? `${type}-${uuidv4()}`;

  const existingDataSource = await grafanaAPIClient.getDataSourceByName(dsName);
  if (existingDataSource.ok()) {
    const json = await existingDataSource.json();
    await grafanaAPIClient.deleteDataSourceByUID(json.uid);
  }

  const createDsReq = await grafanaAPIClient.createDataSource(datasource, dsName);
  const text = await createDsReq.text();
  const status = createDsReq.status();
  if (status === 200) {
    return createDsReq.json().then((r) => r.datasource);
  }

  expect.soft(createDsReq.ok(), `Failed to create data source: ${text}`).toBeTruthy();
  return existingDataSource.json();
};

export const createDataSource: CreateDataSourceViaAPIFixture = async ({ grafanaAPIClient }, use) => {
  await use(async (args) => {
    return createDataSourceViaAPI(grafanaAPIClient, args);
  });
};
