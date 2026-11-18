import * as semver from 'semver';
import { expect, test } from '../../../src';

test.use({
  openFeature: { flags: { queryEditorNext: true } },
});

test.describe('queryEditorNext on', () => {
  test.skip(
    ({ grafanaVersion }) => semver.lt(grafanaVersion, '13.4.0'),
    'the e2e selectors for this flag ship in Grafana 13.4'
  );

  test('sets the data source and renders the query editor row', async ({
    panelEditPage,
    readProvisionedDataSource,
  }) => {
    const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
    await panelEditPage.datasource.set(ds.name);
    await expect(panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' })).toBeVisible();
  });
});
