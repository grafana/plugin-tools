import { test, expect, PanelEditPage } from '../../../../src';

test('variable interpolation', async ({
  readProvisionedDashboard,
  request,
  page,
  selectors,
  grafanaVersion,
}, testInfo) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
  const panelEditPage = new PanelEditPage(
    { request, page, selectors, grafanaVersion, testInfo },
    {
      id: '5',
      dashboard,
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
  readProvisionedDashboard,
  request,
  page,
  selectors,
  grafanaVersion,
}, testInfo) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
  const panelEditPage = new PanelEditPage(
    { request, page, selectors, grafanaVersion, testInfo },
    {
      id: '5',
      dashboard,
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
