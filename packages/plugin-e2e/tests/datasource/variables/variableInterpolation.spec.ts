import { test, expect, PanelEditPage } from '../../../src';
import { Dashboard } from '../../../src/types';

test('variable interpolation', async ({ readProvision, request, page, selectors, grafanaVersion }) => {
  const provision = await readProvision<Dashboard>({ filePath: 'dashboards/redshift.json' });
  const panelEditPage = new PanelEditPage(
    { request, page, selectors, grafanaVersion },
    {
      id: '5',
      dashboard: { uid: provision.uid },
    }
  );
  const queryReq = panelEditPage.waitForQueryDataRequest((request) =>
    (request.postData() ?? '').includes(
      `"rawSQL":"select * from long_format_example where environment in ('staging') limit 100"`
    )
  );
  await panelEditPage.goto();
  await expect(await queryReq).toBeTruthy();
});

test('variable interpolation (navigate to panel from dashboard)', async ({
  readProvision,
  request,
  page,
  selectors,
  grafanaVersion,
}) => {
  const provision = await readProvision<Dashboard>({ filePath: 'dashboards/redshift.json' });
  const panelEditPage = new PanelEditPage(
    { request, page, selectors, grafanaVersion },
    {
      id: '5',
      dashboard: { uid: provision.uid },
    }
  );
  const queryReq = panelEditPage.waitForQueryDataRequest((request) =>
    (request.postData() ?? '').includes(
      `"rawSQL":"select * from long_format_example where environment in ('staging') limit 100"`
    )
  );
  await panelEditPage.goto();
  await expect(await queryReq).toBeTruthy();
});
