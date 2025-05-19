import { gte } from 'semver';
import { test, expect } from '../../../../src';

test('create new, successful annotation query', async ({
  grafanaVersion,
  annotationEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await annotationEditPage.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('annotationQuery');
  await expect(annotationEditPage.runQuery()).toBeOK();
  if (gte(grafanaVersion, '11.0.0')) {
    await expect(annotationEditPage).toHaveAlert('success');
  }
});

test('create new, unsuccessful annotation query', async ({
  grafanaVersion,
  annotationEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
  await annotationEditPage.datasource.set(ds.name);
  await page.getByRole('textbox', { name: 'Query Text' }).fill('error');
  await expect(annotationEditPage.runQuery()).not.toBeOK();
  if (gte(grafanaVersion, '11.0.0')) {
    await expect(annotationEditPage).toHaveAlert('error');
  }
});

test('open provisioned, successful annotation query', async ({
  grafanaVersion,
  gotoAnnotationEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'testdatasource-annotations.json' });
  const annotationEditPage = await gotoAnnotationEditPage({ dashboard, id: '1' });
  await expect(annotationEditPage.runQuery()).toBeOK();
  if (gte(grafanaVersion, '11.0.0')) {
    await expect(annotationEditPage).toHaveAlert('success');
  }
});
