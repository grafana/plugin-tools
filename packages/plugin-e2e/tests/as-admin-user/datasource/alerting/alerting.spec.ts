import * as semver from 'semver';
import { test, expect } from '../../../../src';

const skipMsg = 'Alerting rule test API are only compatible with Grafana 9.5.0 and later';

test.use({ featureToggles: { alertingQueryAndExpressionsStepMode: false, alertingNotificationsStepMode: false } });

test.describe('Test new alert rules', () => {
  test('should evaluate to true if query is valid', async ({
    grafanaVersion,
    page,
    alertRuleEditPage,
    selectors,
    readProvisionedDataSource,
  }) => {
    test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
    const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
    const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
    await queryA.datasource.set(ds.name);
    await page.getByRole('textbox', { name: 'Query Text' }).fill('some query');
    await expect(alertRuleEditPage.evaluate()).toBeOK();
  });

  test('should evaluate to false if query is invalid', async ({
    grafanaVersion,
    page,
    alertRuleEditPage,
    readProvisionedDataSource,
  }) => {
    test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
    const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
    const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
    await queryA.datasource.set(ds.name);
    await page.getByRole('textbox', { name: 'Query Text' }).fill('error');
    await expect(alertRuleEditPage.evaluate()).not.toBeOK();
  });

  test('should be possible to add multiple rows', async ({
    grafanaVersion,
    alertRuleEditPage,
    selectors,
    readProvisionedDataSource,
    page,
  }) => {
    test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
    const { rows } = selectors.components.QueryEditorRows;
    const ds = await readProvisionedDataSource({ fileName: 'testdatasource.yaml' });
    const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
    await queryA.datasource.set(ds.name);
    const rowCount = await alertRuleEditPage.getByGrafanaSelector(rows).count();
    semver.gte(grafanaVersion, '11.5.0') && (await page.getByLabel('Advanced options').nth(1).check());
    await alertRuleEditPage.clickAddQueryRow();
    await expect(alertRuleEditPage.getByGrafanaSelector(rows)).toHaveCount(rowCount + 1);
    await alertRuleEditPage.clickAddQueryRow();
    await expect(alertRuleEditPage.getByGrafanaSelector(rows)).toHaveCount(rowCount + 2);
  });
});

test.describe('Tests existing alert rules', () => {
  test('should evaluate to true when loading a provisioned query that is valid', async ({
    grafanaVersion,
    gotoAlertRuleEditPage,
    readProvisionedAlertRule,
  }) => {
    test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
    const alertRule = await readProvisionedAlertRule({
      fileName: 'testdatasource.yml',
      ruleTitle: 'successful-alert',
    });
    const alertRuleEditPage = await gotoAlertRuleEditPage(alertRule);
    await expect(alertRuleEditPage.evaluate()).toBeOK();
  });

  test('should evaluate to false when loading a provisioned query that is invalid', async ({
    grafanaVersion,
    gotoAlertRuleEditPage,
    readProvisionedAlertRule,
  }) => {
    test.skip(semver.lt(grafanaVersion, '9.5.0'), skipMsg);
    const alertRule = await readProvisionedAlertRule({ fileName: 'testdatasource.yml', ruleTitle: 'broken-alert' });
    const alertRuleEditPage = await gotoAlertRuleEditPage(alertRule);
    await expect(alertRuleEditPage.evaluate()).not.toBeOK();
  });
});
