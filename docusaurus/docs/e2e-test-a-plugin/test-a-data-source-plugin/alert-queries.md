---
id: alert-queries
title: Test alert queries
description: Test alert queries to ensure the plugin is compatible with alerting
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - data-source
  - alert queries
sidebar_position: 60
---

## Introduction

For backend data source plugins that have alerting [enabled](../../tutorials/build-a-data-source-backend-plugin.md#enable-grafana-alerting), it should be possible to define alerts based on the data source queries. Before an alert can be saved, the conditions for an alert definition is evalauted by the alert engine to ensure that the response from the data source is shaped correctly. You can use the `alertRulePage` fixture to verify that alert rules can be created from the output of a query returned by the data source.

### Evaluating a new alert rule

The following example uses the `alertRulePage` fixture. With this fixture, the test starts in the page for adding a new alert rule. We then fill in the alert rule query and call the `evaluate` function. Evaluate clicks the `Preview` button which will trigger a call to the `eval` endpoint to evaluate that the response of the data source query can be used to create an alert. The `toBeOK` matcher is used to verify the evaluation was successful.

```ts
test('should evaluate to true if query is valid', async ({ page, alertRuleEditPage, selectors }) => {
  const queryA = alertRuleEditPage.getAlertRuleQueryRow('A');
  await queryA.datasource.set('gdev-prometheus');
  await queryA.locator.getByLabel('Code').click();
  await page.waitForFunction(() => window.monaco);
  await queryA.getByGrafanaSelector(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText('topk(5, max(scrape_duration_seconds) by (job))');
  await expect(alertRuleEditPage.evaluate()).toBeOK();
});
```

### Evaluating a provisioned alert rule

You can also use a provisioned alert rule to test that your data source is compatible with alerting.

```ts
test('should evaluate to true when loading a provisioned query that is valid', async ({
  gotoAlertRuleEditPage,
  readProvisionedAlertRule,
}) => {
  const alertRule = await readProvisionedAlertRule({ fileName: 'alerts.yml' });
  const alertRuleEditPage = await gotoAlertRuleEditPage(alertRule);
  await expect(alertRuleEditPage.evaluate()).toBeOK();
});
```
