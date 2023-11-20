import { test as setup } from '../../src';
import { sheetsDataSource } from './datasource';

setup('setupDataSource', async ({ createDataSource }) => {
  try {
    await createDataSource({ datasource: sheetsDataSource });
  } catch (error) {
    console.error(error);
  }
});
