import * as semver from 'semver';
import { test, expect } from '../../../../src';

const skipMsg = 'Alerting rule test API are only compatible with Grafana 9.5.0 and later';
test(
  'should evaluate to true if query is valid',
  { tag: '@integration' },
  async ({ grafanaVersion, page, alertRuleEditPage, selectors }) => {
    test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
    const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
    await queryA.datasource.set('AWS Redshift');
    await alertRuleEditPage.alertRuleNameField.fill('Test Alert Rule');
    await page.waitForFunction(() => window.monaco);
    await queryA.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
    await page.keyboard.insertText('select * from long_format_example where $__timeFilter(time) ');
    await expect(alertRuleEditPage.evaluate()).toBeOK();
  }
);

test('should evaluate to false if query is invalid', async ({ grafanaVersion, page, alertRuleEditPage, selectors }) => {
  test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
  const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
  await queryA.datasource.set('AWS Redshift');
  await page.waitForFunction(() => window.monaco);
  await alertRuleEditPage.alertRuleNameField.fill('Test Alert Rule');
  await queryA.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select !');
  await expect(alertRuleEditPage.evaluate()).not.toBeOK();
});

test('should be possible to add multiple rows', async ({ grafanaVersion, alertRuleEditPage, selectors }) => {
  test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
  const { rows } = selectors.components.QueryEditorRows;
  const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
  await queryA.datasource.set('AWS Redshift');
  const rowCount = await alertRuleEditPage.getByGrafanaSelector(rows).count();
  await alertRuleEditPage.clickAddQueryRow();
  await expect(alertRuleEditPage.getByGrafanaSelector(rows)).toHaveCount(rowCount + 1);
  await alertRuleEditPage.clickAddQueryRow();
  await expect(alertRuleEditPage.getByGrafanaSelector(rows)).toHaveCount(rowCount + 2);
});

test(
  'should evaluate to true when loading a provisioned query that is valid',
  { tag: '@integration' },
  async ({ grafanaVersion, gotoAlertRuleEditPage, readProvisionedAlertRule }) => {
    test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
    const alertRule = await readProvisionedAlertRule({ fileName: 'alerts.yml' });
    const alertRuleEditPage = await gotoAlertRuleEditPage(alertRule);
    await expect(alertRuleEditPage.evaluate()).toBeOK();
  }
);

test('should evaluate to false when loading a provisioned query that is invalid', async ({
  grafanaVersion,
  gotoAlertRuleEditPage,
  readProvisionedAlertRule,
}) => {
  test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
  const alertRule = await readProvisionedAlertRule({ fileName: 'alerts.yml', ruleTitle: 'broken_rule' });
  const alertRuleEditPage = await gotoAlertRuleEditPage(alertRule);
  await expect(alertRuleEditPage.evaluate()).not.toBeOK();
});
