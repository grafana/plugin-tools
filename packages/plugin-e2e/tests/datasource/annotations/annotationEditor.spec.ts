import { test, expect } from '../../../src';
import { ProvisionFile } from '../../../src/types';
import { REDSHIFT_SCHEMAS, REDSHIFT_TABLES } from '../mocks/resource';

test('should load resources and display them as options when clicking on an input', async ({
  annotationEditPage,
  page,
  readProvision,
}) => {
  await annotationEditPage.mockResourceResponse('schemas', REDSHIFT_SCHEMAS);
  const provision = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await annotationEditPage.datasource.set(provision.datasources?.[0]!.name!);
  await page.getByLabel('Schema').click();
  await expect(annotationEditPage.getByTestIdOrAriaLabel('Select option')).toContainText(REDSHIFT_SCHEMAS);
});
