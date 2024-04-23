import { test, expect, AlertRuleEditPage } from '../../../../src';

test('should evaluate to true if query is valid', async ({ page, alertRuleEditPage, selectors }) => {
  const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
  await queryA.datasource.set('AWS Redshift');
  await page.waitForFunction(() => window.monaco);
  await queryA.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select * from long_format_example');
  await expect(alertRuleEditPage.evaluate()).toBeOK();
});

test('should evaluate to false if query is invalid', async ({ page, alertRuleEditPage, selectors }) => {
  const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
  await queryA.datasource.set('AWS Redshift');
  await page.waitForFunction(() => window.monaco);
  await queryA.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select !');
  await expect(alertRuleEditPage.evaluate()).not.toBeOK();
});

test('should evaluate to true when loading a provisioned query that is valid', async ({ gotoAlertRuleEditPage }) => {
  const alertRuleEditPage = await gotoAlertRuleEditPage({ uid: 'SKfRaUhSz' });
  await expect(alertRuleEditPage.evaluate()).toBeOK();
});
