const semver = require('semver');
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
  const url = semver.lt('10.0.0', grafanaVersion)
    ? `schemaVersion=1&panes=%7B%22oae%22:%7B%22datasource%22:%22--%20Mixed%20--%22,%22queries%22:%5B%7B%22constant%22:9,%22refId%22:%22A%22,%22datasource%22:%7B%22type%22:%22grafana-test-datasource%22,%22uid%22:%22P6E498B96656A7F9B%22%7D,%22queryText%22:%22test%20query%22,%22project%22:%22project-2%22%7D%5D,%22range%22:%7B%22from%22:%22now-1h%22,%22to%22:%22now%22%7D%7D%7D&orgId=1`
    : 'schemaVersion=1&panes=%7B"oae":%7B"datasource":"--%20Mixed%20--","queries":%5B%7B"constant":9,"refId":"A","datasource":%7B"type":"grafana-test-datasource","uid":"P6E498B96656A7F9B"%7D,"queryText":"test%20query","project":"project-2"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D%7D&orgId=1&left=%7B"datasource":"P6E498B96656A7F9B","queries":%5B%7B"refId":"A","datasource":%7B"type":"grafana-test-datasource","uid":"P6E498B96656A7F9B"%7D,"constant":6.5,"project":"project-1","queryText":"some%20query"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D';

  await explorePage.goto({
    queryParams: new URLSearchParams(url),
  });

  await expect(explorePage.timeSeriesPanel.locator).toBeVisible();
  await expect(explorePage.tablePanel.locator).toBeVisible();
});
