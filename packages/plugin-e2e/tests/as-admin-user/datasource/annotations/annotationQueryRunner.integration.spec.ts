import * as semver from 'semver';
import semverLt from 'semver/functions/lt';
import { test, expect } from '../../../../src';

test('should run successfully if valid Redshift query was provided', async ({
  annotationEditPage,
  page,
  selectors,
  readProvisionedDataSource,
  grafanaVersion,
}, testInfo) => {
  testInfo.skip(semverLt(grafanaVersion, '9.2.0'), 'Code editor seems to trigger one query per character typed');
  const ds = await readProvisionedDataSource({ fileName: 'redshift.yaml' });
  await annotationEditPage.datasource.set(ds.name);
  await page.waitForFunction(() => (window as any).monaco);
  await annotationEditPage.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('SELECT starttime, eventname FROM event ORDER BY eventname ASC LIMIT 5 ');
  await expect(annotationEditPage.runQuery()).toBeOK();
  await expect(page.getByText('.38 Special')).toBeTruthy();
});

test('should run successfully if valid Google Sheets query was provided', async ({
  annotationEditPage,
  page,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'google-sheets-datasource-jwt.yaml' });
  await annotationEditPage.datasource.set(ds.name);
  await page.getByText('Enter SpreadsheetID').click();
  await page.keyboard.insertText('1TZlZX67Y0s4CvRro_3pCYqRCKuXer81oFp_xcsjPpe8');
  await page.keyboard.press('Enter');
  await expect(annotationEditPage.runQuery()).toBeOK();
});

test('should run successfully if valid Redshift query was provided in provisioned dashboard', async ({
  gotoAnnotationEditPage,
  readProvisionedDashboard,
  grafanaVersion,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'redshift.json' });
  const annotationEditPage = await gotoAnnotationEditPage({ dashboard, id: '1' });
  await expect(annotationEditPage.runQuery()).toBeOK();
  if (semver.gte(grafanaVersion, '11.0.0')) {
    await expect(annotationEditPage).toHaveAlert('warning', { hasText: 'No events found' });
  }
});
