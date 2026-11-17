import * as semver from 'semver';
import { expect, test } from '../../../../src';

export interface DataQueryUrlsConfig {
  title: string;
  /** Pathname the query request is expected to use, given the namespace. */
  expectedPath: (namespace: string) => string;
  /** Also test `waitForQueryDataResponseWithBody`, which is URL-agnostic and only needs to run once. */
  withBodyTest?: boolean;
}

const MOCKED_RESPONSE = { results: { A: { status: 200, frames: [] } } };

export function dataQueryUrlsScenarios({ title, expectedPath, withBodyTest }: DataQueryUrlsConfig) {
  test.describe(title, () => {
    test.skip(({ grafanaVersion }) => semver.lt(grafanaVersion, '13.3.0'), 'flag is only relevant on Grafana 13.3+');

    test('refreshPanel waits for the data query response', async ({
      panelEditPage,
      readProvisionedDataSource,
      namespace,
    }) => {
      await panelEditPage.mockQueryDataResponse(MOCKED_RESPONSE);
      const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
      await panelEditPage.datasource.set(ds.name);
      await panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' }).fill('query');

      const response = await panelEditPage.refreshPanel();

      expect(response.ok()).toBe(true);
      expect(new URL(response.url()).pathname).toBe(expectedPath(namespace));
    });

    if (withBodyTest) {
      test('waitForQueryDataResponseWithBody returns the response body', async ({
        panelEditPage,
        readProvisionedDataSource,
      }) => {
        await panelEditPage.mockQueryDataResponse(MOCKED_RESPONSE);
        const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
        await panelEditPage.datasource.set(ds.name);
        await panelEditPage.getQueryEditorRow('A').getByRole('textbox', { name: 'Query Text' }).fill('query');

        const responseWithBody = panelEditPage.waitForQueryDataResponseWithBody<{
          results?: Record<string, unknown>;
        }>();
        await panelEditPage.refreshPanel();
        const { body } = await responseWithBody;

        expect(body?.results?.A).toBeDefined();
      });
    }
  });
}
