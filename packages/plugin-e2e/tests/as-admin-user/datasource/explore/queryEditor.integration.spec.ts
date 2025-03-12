import { lt } from 'semver';
import { expect, test } from '../../../../src';

test('should return data and not display panel error when a valid query is provided', async ({
  explorePage,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await explorePage.datasource.set(ds.name);
  const editorRow = await explorePage.getQueryEditorRow('A');
  await editorRow.getByRole('textbox', { name: 'Query Text' }).fill('query');
  await expect(explorePage.runQuery()).toBeOK();
});
test('should return an error and display panel error when query is invalid', async ({
  explorePage,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await explorePage.datasource.set(ds.name);
  const editorRow = await explorePage.getQueryEditorRow('A');
  await editorRow.getByRole('textbox', { name: 'Query Text' }).fill('error');
  await expect(explorePage.runQuery()).not.toBeOK();
});

test('explore page should display table and time series panel only for certain query', async ({
  explorePage,
  grafanaVersion,
}) => {
  const params = lt(grafanaVersion, '10.0.0')
    ? 'left=%7B"datasource":"grafana","queries":%5B%7B"queryType":"randomWalk","refId":"A","datasource":%7B"type":"datasource","uid":"grafana"%7D%7D%5D,"range":%7B"from":"1547161200000","to":"1576364400000"%7D%7D&orgId=1'
    : `panes=%7B"_t4":%7B"datasource":"grafana","queries":%5B%7B"queryType":"randomWalk","refId":"A","datasource":%7B"type":"datasource","uid":"grafana"%7D%7D%5D,"range":%7B"from":"now-6h","to":"now"%7D%7D%7D&orgId=1&left=%7B"datasource":"grafana","queries":%5B%7B"refId":"A","datasource":%7B"type":"datasource","uid":"grafana"%7D,"queryType":"randomWalk"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D`;

  await explorePage.goto({ queryParams: new URLSearchParams(params) });

  await expect(explorePage.timeSeriesPanel.locator).toBeVisible();
  await expect(explorePage.tablePanel.locator).toBeVisible();
});
