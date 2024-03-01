---
id: annotation-queries
title: Annotation queries
description: Test a custom annotation editor and annotation queries
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - data-source
  - annotation queries
sidebar_position: 50
---

## Introduction

Annotations can be used to mark points on a visualization with events such as `AB test started` and `Marketing campaign started`. If a data source plugin supports annotations, it means that the data source can be used to query for annotation events. Optionally, data sources plugins can implement a custom annotation editor that can be used to craft the annotation query. In many cases, the execution of annotation queries requires different handling than normal data queries, and in those cases you may want to write end-to-end tests that verifies that data source annotation support work as expected.

### Testing the annotation editor

If your data source plugin implements a custom annotation editor, you can write tests that verifies that the editor works as expected. If no custom editor is implemented, the built-in in editor will be used and then you don't need to write tests for that.

### Testing the entire annotation query execution flow

In the next example, we perform an integration test where we test a plugin's entire annotation query data flow.

```ts title="annotations.spec.ts"
test('should run successfully and display a success alert box when query is valid', async ({
  annotationEditPage,
  page,
  selectors,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await page.waitForFunction(() => window.monaco);
  await annotationEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText(`select time as time, humidity as text
  from dataset
  where $__timeFilter(time) and humidity > 95`);
  await expect(annotationEditPage.runQuery()).toBeOK();
  await expect(annotationEditPage).toHaveAlert('success');
});
```

#### Testing error scenarios

If an error occurs in the plugin or if the upstream API returns an error, you may want to capture that and return a meaningful error message to the user.

```ts title="annotations.spec.ts"
test('should fail and display an error alert box when time field is missing in the response', async ({
  annotationEditPage,
  page,
  selectors,
  readProvisionedDataSource,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await annotationEditPage.datasource.set(ds.name);
  await page.waitForFunction(() => window.monaco);
  await annotationEditPage.getByTestIdOrAriaLabel(selectors.components.CodeEditor.container).click();
  await page.keyboard.insertText(`select humidity as text
  from dataset
  where humidity > 95`);
  await expect(annotationEditPage.runQuery()).not.toBeOK();
  await expect(annotationEditPage).toHaveAlert('error', { hasText: 'Time field is missing' });
});
```
