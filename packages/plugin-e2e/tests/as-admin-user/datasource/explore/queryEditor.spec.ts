import * as semver from 'semver';
import { expect, test } from '../../../../src';

test('editor populates query from url', async ({ explorePage, grafanaVersion }) => {
  const params = semver.lt(grafanaVersion, '10.1.0')
    ? 'orgId=1&left=%7B"datasource":"P6E498B96656A7F9B","queries":%5B%7B"refId":"A","datasource":%7B"type":"grafana-test-datasource","uid":"P6E498B96656A7F9B"%7D,"constant":9,"project":"project-2","queryText":"test%20query"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D'
    : `?schemaVersion=1&panes=%7B"9ye":%7B"datasource":"P6E498B96656A7F9B","queries":%5B%7B"constant":9,"refId":"A","datasource":%7B"type":"grafana-test-datasource","uid":"P6E498B96656A7F9B"%7D,"queryText":"test%20query"%7D%5D,"range":%7B"from":"now-1h","to":"now"%7D%7D%7D&orgId=1`;

  await explorePage.goto({ queryParams: new URLSearchParams(params) });
  const queryEditorRowLocator = explorePage.getQueryEditorRow('A');
  await expect(queryEditorRowLocator.getByRole('textbox', { name: 'Query Text' })).toHaveValue('test query');
  await expect(queryEditorRowLocator.getByRole('spinbutton', { name: 'Constant' })).toHaveValue('9');
});
