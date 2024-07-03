---
id: error-handling
title: Error handling
description: How to handle errors in data source plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - errors
  - error handling
---

This guide explains how to handle errors in data source plugins.

## Provide usable defaults

Allow the user to learn your plugin in small steps. Provide a useful default configuration so that:

- The user can get started right away.
- You can avoid unnecessary error messages.

For example, by selecting the first field of an expected type, the panel can display a visualization without any user configuration. If a user explicitly selects a field, then use that one. Otherwise, default to the first field of type `string`:

```ts
const numberField = frame.fields.find((field) =>
  options.numberFieldName ? field.name === options.numberFieldName : field.type === FieldType.number
);
```

## Display error messages

To display an error message to the user, `throw` an `Error` with the message you want to display:

```ts
throw new Error('An error occurred');
```

Grafana displays the error message in the top-left corner of the panel:

![Panel error.](/img/panel_error.png)

We recommend that you avoid displaying overly technical error messages to the user. If you want to let technical users report an error, consider logging it to the console instead.

```ts
try {
  failingFunction();
} catch (err) {
  console.error(err);
  throw new Error('Something went wrong');
}
```

:::note

Grafana displays the exception message in the UI as written, so use grammatically correct sentences. For more information, refer to the [Documentation style guide](https://grafana.com/docs/writers-toolkit/).

:::

## See also

- [Error handling in panel plugins](../panel-plugins/error-handling-for-panel-plugins.md)
