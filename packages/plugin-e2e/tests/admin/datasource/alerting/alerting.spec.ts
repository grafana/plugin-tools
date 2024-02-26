import { test, expect } from '../../../../src';
import { AlertRulePage } from '../../../../src/models/AlertRulePage';

test('should evaluate to true if query is valid', async ({ page, alertRulePage, selectors }) => {
  const queryA = alertRulePage.getAlertRuleQueryRow('A');
  await queryA.datasource.set('AWS Redshift');
  await page.waitForFunction(() => window.monaco);
  await queryA.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select * from long_format_example');
  await expect(alertRulePage.evaluate()).toBeOK();
});

test('should evaluate to false if query is invalid', async ({ page, alertRulePage, selectors }) => {
  const queryA = alertRulePage.getAlertRuleQueryRow('A');
  await queryA.datasource.set('AWS Redshift');
  await page.waitForFunction(() => window.monaco);
  await queryA.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('select !');
  await expect(alertRulePage.evaluate()).not.toBeOK();
});

test('should evaluate to true when loading a provisioned query that is invalid', async ({
  page,
  selectors,
  grafanaVersion,
  request,
}) => {
  const alertRulePage = new AlertRulePage({ request, page, selectors, grafanaVersion }, { uid: 'SKfRaUhSz' });
  await alertRulePage.goto();
  await expect(alertRulePage.evaluate()).toBeOK();
});
