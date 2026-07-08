import { expect, test } from '../../../../src';

test('should render variable editor', async ({ variableEditPage, page, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await variableEditPage.datasource.set(ds.name);
  await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('create new variable and execute successful query', async ({
  variableEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await variableEditPage.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('annotationQuery');
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['A', 'B']);
});

test('create new variable and preview values that carry additional properties', async ({
  variableEditPage,
  readProvisionedDataSource,
  selectors,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await variableEditPage.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('humidityQuery');
  // a data frame field not named "value" or "text" becomes an option property.
  // since Grafana 13.1.0, options with properties are previewed in a table instead of labels
  await page.route(selectors.apis.DataSource.queryPattern, async (route) => {
    const refId = route.request().postDataJSON()?.queries?.[0]?.refId ?? 'A';
    await route.fulfill({
      json: {
        results: {
          [refId]: {
            status: 200,
            frames: [
              {
                schema: {
                  refId,
                  fields: [{ name: 'humidity', type: 'string', typeInfo: { frame: 'string' } }],
                },
                data: { values: [['25.3', '22.1', '19.5']] },
              },
            ],
          },
        },
      },
      status: 200,
    });
  });
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['25.3', '22.1', '19.5']);
});

test('open existing variable and execute successful query', async ({
  gotoVariableEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource.json' });
  const variableEditPage = await gotoVariableEditPage({ dashboard, id: '0' });
  const queryDataRequest = variableEditPage.waitForQueryDataRequest();
  await variableEditPage.runQuery();
  await queryDataRequest;
  await expect(variableEditPage).toDisplayPreviews(['A', 'B']);
});
