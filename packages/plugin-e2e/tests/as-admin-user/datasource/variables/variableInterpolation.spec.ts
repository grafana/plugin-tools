import { test, expect } from '../../../../src';

test('variable interpolation', async ({ readProvisionedDashboard, gotoDashboardPage }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const dashboardPage = await gotoDashboardPage(dashboard);
  const panelEditPage = await dashboardPage.addPanel();
  await panelEditPage.datasource.set('test-datasource');
  const editorRow = await panelEditPage.getQueryEditorRow('A');
  await editorRow.getByRole('textbox', { name: 'Query Text' }).fill('$var1');
  const queryReq = panelEditPage.waitForQueryDataRequest((request) =>
    (request.postData() ?? '').includes(`"queryText":"A"`)
  );
  await panelEditPage.refreshPanel();
  await expect(await queryReq).toBeTruthy();
});
