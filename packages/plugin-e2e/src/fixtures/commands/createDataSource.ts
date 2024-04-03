import { v4 as uuidv4 } from 'uuid';
import { APIRequestContext, expect, TestFixture } from '@playwright/test';
import { CreateDataSourceArgs, DataSourceSettings, PlaywrightArgs } from '../../types';

type CreateDataSourceViaAPIFixture = TestFixture<
  (args: CreateDataSourceArgs) => Promise<DataSourceSettings>,
  PlaywrightArgs
>;

export const createDataSourceViaAPI = async (
  request: APIRequestContext,
  datasource: CreateDataSourceArgs
): Promise<DataSourceSettings> => {
  const { type, name } = datasource;
  const dsName = name ?? `${type}-${uuidv4()}`;

  const existingDataSource = await request.get(`/api/datasources/name/${dsName}`);
  if (await existingDataSource.ok()) {
    const json = await existingDataSource.json();
    await request.delete(`/api/datasources/uid/${json.uid}`);
  }

  const createDsReq = await request.post('/api/datasources', {
    data: {
      ...datasource,
      name: dsName,
      access: 'proxy',
      isDefault: false,
    },
  });
  const text = await createDsReq.text();
  const status = await createDsReq.status();
  if (status === 200) {
    return createDsReq.json().then((r) => r.datasource);
  }

  expect.soft(createDsReq.ok(), `Failed to create data source: ${text}`).toBeTruthy();
  return existingDataSource.json();
};

export const createDataSource: CreateDataSourceViaAPIFixture = async ({ request }, use) => {
  await use(async (args) => {
    return createDataSourceViaAPI(request, args);
  });
};
