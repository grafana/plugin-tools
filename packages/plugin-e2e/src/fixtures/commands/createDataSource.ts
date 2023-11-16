import { v4 as uuidv4 } from 'uuid';
import { APIRequestContext, expect, TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../../api';
import { CreateDataSourceArgs, DataSource } from '../../types';
import { PlaywrightCombinedArgs } from '../types';

type CreateDataSourceViaAPIFixture = TestFixture<
  (args: CreateDataSourceArgs) => Promise<DataSource>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

export const createDataSourceViaAPI = async (
  request: APIRequestContext,
  datasource: DataSource
): Promise<DataSource> => {
  const { type, name } = datasource;
  const dsName = name ?? `${type}-${uuidv4()}`;

  if (datasource.uid) {
    const deleteDatasourceReq = await request.delete(`/api/datasources/uid/${datasource.uid}`);
    const status = await deleteDatasourceReq.status();
    if (status === 200) {
      console.log('Data source deleted');
    }
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
  let res: DataSource;
  if (status === 200) {
    console.log('Data source created: ', name);
    res = await createDsReq.json().then((r) => r.datasource);
  } else if (status === 409) {
    console.log('Data source already exists: ', text);
    res = await request.get(`/api/datasources/name/${dsName}`).then((r) => r.json());
  } else {
    expect.soft(createDsReq.ok(), `Failed to create data source: ${text}`).toBeTruthy();
  }
  return res;
};

const createDataSource: CreateDataSourceViaAPIFixture = async ({ request }, use) => {
  await use(async (args) => {
    return createDataSourceViaAPI(request, args.datasource);
  });
};

export default createDataSource;
