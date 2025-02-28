---
id: error-handling-for-panel-plugins
title: Error handling for panel plugins
description: How to handle errors in panel plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - errors
  - error handling
  - panel
---

# Error handling

This guide explains how to handle errors in panel plugins and provides suggestions for common scenarios.

## Provide usable defaults

Allow the user to learn your panel plugin in small steps. Provide a useful default configuration so that:

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

Grafana displays the exception message in the UI as written, so use grammatically correct sentences. For more information, refer to the [documentation style guide](https://grafana.com/docs/writers-toolkit/).

:::

## Common error scenarios

Here are some examples of situations where you might want to display an error to the user.

### Invalid query response

Users have full freedom when they create data source queries for panels. If your panel plugin requires a specific format for the query response, then use the panel canvas to guide the user.

```ts
if (!numberField) {
  throw new Error('Query result is missing a number field');
}

if (frame.length === 0) {
  throw new Error('Query returned an empty result');
}
```
