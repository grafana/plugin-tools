import * as semver from 'semver';
import { test, expect, AnnotationPage } from '../../../../src';

test('should render annotations editor', async ({ annotationEditPage, page, readProvisionedDataSource }) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await annotationEditPage.datasource.set(ds.name);
  await expect(page.getByRole('textbox', { name: 'Query Text' })).toBeVisible();
});

test('should be able to add a new annotation when annotations already exist', async ({
  page,
  selectors,
  grafanaVersion,
  request,
  readProvisionedDashboard,
}, testInfo) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource-annotations.json' });
  const annotationPage = new AnnotationPage({ page, selectors, grafanaVersion, request, testInfo }, dashboard);
  await annotationPage.goto();
  await annotationPage.clickAddNew();
  if (semver.gte(grafanaVersion, '9.2.0')) {
    await expect(page).toHaveTitle(/New annotation.*/);
  } else {
    await expect(page.getByText('When enabled the annotation query is issued every dashboard refresh')).toBeVisible();
  }
});
