import { test, expect } from '../../../src';
import { ProvisionFile } from '../../../src/types';
import { QUERY_DATA_ANNOTATION_RESPONSE } from '../mocks/queryDataResponse';

test('should run successfully if valid query was provided', async ({
  annotationEditPage,
  page,
  selectors,
  readProvision,
}) => {
  const provision = await readProvision<ProvisionFile>({ filePath: 'datasources/redshift.yaml' });
  await annotationEditPage.datasource.set(provision.datasources?.[0]!.name!);
  await page.waitForFunction(() => (window as any).monaco);
  await annotationEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('SELECT starttime, eventname FROM event ORDER BY eventname ASC LIMIT 5 ');
  await expect(annotationEditPage.runQuery()).toBeOK();
});
