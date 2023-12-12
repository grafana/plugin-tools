import { expect, test } from '../../../src';
import { ProvisionFile } from '../../../src/types';

test('editor populates query from url', async ({ explorePage, readProvision }) => {
  const provision = await readProvision<ProvisionFile>({ filePath: 'datasources/google-sheets-datasource-jwt.yaml' });
  await explorePage.goto({
    queryParams: new URLSearchParams(
      `panes=%7B"xlX":%7B"datasource":"${provision.datasources[0].uid}","queries":%5B%7B"refId":"A","datasource":%7B"type":"grafana-redshift-datasource","uid":"P7DC3E4760CFAC4AH"%7D,"rawSQL":"SELECT%20%2A%20FROM%20public.average_temperature","format":0%7D%5D,"range":%7B"from":"1579046400000","to":"1607990400000"%7D%7D%7D&schemaVersion=1&orgId=1`
    ),
  });
  const queryEditorRowLocator = await explorePage.getQueryEditorRow('A');
  await expect(queryEditorRowLocator).toContainText('SELECT * FROM public.average_temperature');
  await expect(queryEditorRowLocator).toContainText('Time Series');
});
