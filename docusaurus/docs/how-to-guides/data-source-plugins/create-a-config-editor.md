---
id: create-a-config-editor
title: Creating a Config Editor for a Grafana Data Source Plugin
description: Learn how to create a config editor for a data source
keywords:
  - grafana
  - plugins
  - config
  - editor
  - datasource
---

## Creating a Config Editor for a Grafana Data Source Plugin

## Introduction

A Config Editor in Grafana is a user interface that allows users to configure a data source instance.
It includes settings such as URL, authentication, and secure storage of sensitive data like API keys.
This tutorial will guide you through creating a Config Editor using UI components from @grafana/ui.

## Creating a Config Editor

### Step 1: Set Up the Basic Structure

First, create a new component for your Config Editor. This component will be responsible for rendering the UI elements:

```tsx
import React from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Input, Field, SecretInput, Button } from '@grafana/ui';

interface MyDataSourceOptions {
  url: string;
  secureJsonData?: {
    apiKey?: string;
  };
}

export const ConfigEditor: React.FC<DataSourcePluginOptionsEditorProps<MyDataSourceOptions>> = ({
  options,
  onOptionsChange,
}) => {
  const onURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({ ...options, url: event.target.value });
  };

  const onAPIKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: { ...options.secureJsonData, apiKey: event.target.value },
    });
  };

  const onResetAPIKey = () => {
    onOptionsChange({ ...options, secureJsonData: { ...options.secureJsonData, apiKey: undefined } });
  };

  return (
    <div>
      <Field label="URL">
        <Input value={options.url || ''} onChange={onURLChange} />
      </Field>
      <Field label="API Key">
        {options.secureJsonData?.apiKey ? (
          <Button onClick={onResetAPIKey}>Reset API Key</Button>
        ) : (
          <SecretInput value={options.secureJsonData?.apiKey || ''} onChange={onAPIKeyChange} />
        )}
      </Field>
    </div>
  );
};
```

### Step 2: Integrate the Config Editor into the Plugin

Next, integrate your ConfigEditor into the DataSource Plugin. This will ensure Grafana uses your Config Editor for the data source configuration.

```tsx
import { DataSourcePlugin } from '@grafana/data';
import { MyDataSource } from './datasource';
import { ConfigEditor } from './ConfigEditor';

export const plugin = new DataSourcePlugin(MyDataSource).setConfigEditor(ConfigEditor);
```

### Step 3: Set Defaults

Set default values for your configuration options. This can be done within the ConfigEditor component or when defining the data source plugin.

```tsx
const defaultOptions = {
  url: 'http://localhost:8080',
  secureJsonData: {
    apiKey: '',
  },
};

export const plugin = new DataSourcePlugin(MyDataSource).setConfigEditor(ConfigEditor).setDefaults(defaultOptions);
```

## Summary

In this tutorial, you learned how to create a Config Editor using UI components from @grafana/ui.
You set up the basic structure, integrated it into the DataSource Plugin, and set default values for configuration options.
This allows users to configure a data source instance, including URL and basic authentication, and store sensitive data securely.
