---
id: validate-config-editor-fields
title: Validate config editor fields
description: How to use the DataSourceConfigValidationAPI to validate fields in your data source config editor.
keywords:
  - grafana
  - plugins
  - plugin
  - datasource
  - data source
  - validation
  - config editor
---

:::note

`DataSourceConfigValidationAPI` is currently in alpha and may change in future Grafana releases.

:::

This guide explains how to validate fields in a data source config editor. Frontend validation catches missing or invalid configuration before the form is submitted — preventing both the save request and the backend health check from running when required fields are missing.

## How it works

Grafana passes a `validation` prop of type `DataSourceConfigValidationAPI` to your config editor via `DataSourcePluginOptionsEditorProps`. The object is stable across renders, so it's safe to pass to hooks and effects.

When the user clicks **Save & test**, Grafana calls `validation.validate()`, which runs all registered validators. If any validator returns `false`, the save and the backend health check are both skipped, and a summary of the field errors is shown where the health check result normally appears.

The `DataSourceConfigValidationAPI` interface provides:

| Method | Description |
|---|---|
| `registerValidation(validator)` | Registers a function called on submit. Returns a cleanup function that unregisters it. |
| `validate()` | Runs all registered validators. Returns `true` if all pass. Called automatically on submit. |
| `setError(field, message)` | Records an error message for the given field. |
| `clearError(field)` | Clears the recorded error for the given field. |
| `isValid()` | Returns `true` if there are no active field errors. Useful for conditionally disabling UI. |
| `getErrors()` | Returns the current map of field errors, keyed by field name. |

## Block submission with a validator

Use `registerValidation` to prevent saving when required fields are missing. Collect errors into an object, record them via `setError`, and return `false` to block the save.

```tsx
import { useEffect } from 'react';
import { type DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

export function ConfigEditor({ options, onOptionsChange, validation }: DataSourcePluginOptionsEditorProps) {
  useEffect(() => {
    if (!validation) {
      return;
    }

    // registerValidation returns a cleanup function — return it from the effect
    // so the validator is removed when the component unmounts.
    return validation.registerValidation(() => {
      const errors: Record<string, string> = {};

      if (!options.url) {
        errors.url = 'URL is required.';
      }

      Object.entries(errors).forEach(([field, msg]) => validation.setError(field, msg));
      if (!errors.url) {
        validation.clearError('url');
      }

      return Object.keys(errors).length === 0;
    });
  }, [options.url, validation]);

  return (
    <Field label="URL" required>
      <Input
        value={options.url}
        onChange={(e) => onOptionsChange({ ...options, url: e.currentTarget.value })}
      />
    </Field>
  );
}
```

Validators can also be async, making it possible to run checks like verifying a connection before allowing a save:

```tsx
return validation.registerValidation(async () => {
  try {
    await testConnection(options);
    validation.clearError('connection');
    return true;
  } catch (e) {
    validation.setError('connection', 'Could not connect. Check your URL and credentials.');
    return false;
  }
});
```

## Add inline field errors

The API stores errors by field name but does not render them or trigger re-renders. To display errors next to fields, maintain your own `fieldErrors` state and keep it in sync with the API.

A `validateField` helper updates both at once. Call it in `onBlur` handlers so errors appear as the user moves between fields. The registered validator re-runs all checks on submit, resetting `fieldErrors` to the current state of every field — catching anything the user never blurred.

The `useEffect` must also pre-clear errors for fields that are already populated when the editor loads, so existing data source configurations don't show errors on open.

```tsx
import { useEffect, useState } from 'react';
import { type DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

export function ConfigEditor({ options, onOptionsChange, validation }: DataSourcePluginOptionsEditorProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, hasValue: boolean, errorMsg: string) => {
    if (!validation) {
      return;
    }
    if (!hasValue) {
      setFieldErrors((prev) => ({ ...prev, [field]: errorMsg }));
      validation.setError(field, errorMsg);
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      validation.clearError(field);
    }
  };

  useEffect(() => {
    if (!validation) {
      return;
    }

    // Pre-clear errors for fields that are already populated on load.
    if (options.url) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.url;
        return next;
      });
      validation.clearError('url');
    }

    return validation.registerValidation(() => {
      const errors: Record<string, string> = {};

      if (!options.url) {
        errors.url = 'URL is required.';
      }

      setFieldErrors(errors);
      Object.entries(errors).forEach(([field, msg]) => validation.setError(field, msg));
      if (!errors.url) {
        validation.clearError('url');
      }

      return Object.keys(errors).length === 0;
    });
  }, [options.url, validation]);

  return (
    <Field label="URL" required invalid={!!fieldErrors.url} error={fieldErrors.url}>
      <Input
        value={options.url}
        onBlur={(e) => validateField('url', !!e.target.value, 'URL is required.')}
        onChange={(e) => onOptionsChange({ ...options, url: e.currentTarget.value })}
      />
    </Field>
  );
}
```

## See also

- [Error handling in data source plugins](./error-handling-in-data-source-plugins.md)
