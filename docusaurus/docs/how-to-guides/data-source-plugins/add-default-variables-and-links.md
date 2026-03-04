---
id: add-default-variables-and-links
title: Add default variables and links
description: Learn how to register default variables and dashboard links from a data source plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - datasource
  - variables
  - dashboard links
  - default variables
  - default links
---

# Add default variables and links

:::note

This feature is available from Grafana 13.0 and later.

:::

Data source plugins can register default variables and dashboard links that are automatically loaded onto any dashboard using that data source. This is useful when your data source requires certain filter variables or benefits from having quick-access links to external documentation or related tools.

## Before you begin

Ensure your development environment meets the following prerequisites:

- **Grafana version:** Grafana 13.0 or later.
- **`@grafana/data`:** Version 13.0.0 or later.
- **`@grafana/schema`:** Version 13.0.0 or later.

## Key behaviors

- **Not persisted.** Default variables and links are loaded at dashboard load time. They are not saved as part of the dashboard model.
- **URL sync.** Default variables appear in the URL as query parameters, so shared dashboard links preserve the selected values.
- **Read-only.** Default variables and links are displayed as read-only in the dashboard settings views. Users cannot edit or remove them from the dashboard.

## Add default variables

Implement the optional `getDefaultVariables` method on your `DataSourceApi` class to return an array of `VariableKind` objects using the v2 dashboard schema. Set `hide` to `'inControlsMenu'` so that default variables appear in the dashboard controls menu rather than the main variable bar:

```ts title="src/datasource.ts"
import { DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';
import { VariableKind, DashboardLink } from '@grafana/schema/apis/dashboard.grafana.app/v2';

import { MyQuery, MyDataSourceOptions } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  async getDefaultVariables(): Promise<VariableKind[]> {
    return [
      {
        kind: 'CustomVariable',
        spec: {
          name: 'environment',
          label: 'Environment',
          query: 'production,staging,development',
          current: {
            value: 'production',
            text: 'Production',
          },
          options: [
            { value: 'production', text: 'Production' },
            { value: 'staging', text: 'Staging' },
            { value: 'development', text: 'Development' },
          ],
          allowCustomValue: false,
          skipUrlSync: false,
          hide: 'inControlsMenu',
          multi: false,
        },
      },
    ];
  }

  // ... other methods
}
```

## Add default dashboard links

Implement the optional `getDefaultLinks` method on your `DataSourceApi` class to return an array of `DashboardLink` objects. Set `placement` to `'inControlsMenu'` so that default links appear in the dashboard controls menu:

```ts title="src/datasource.ts"
async getDefaultLinks(): Promise<DashboardLink[]> {
  return [
    {
      title: 'Documentation',
      type: 'link',
      url: 'https://example.com/docs',
      tooltip: '',
      targetBlank: true,
      icon: 'doc',
      tags: [],
      asDropdown: false,
      includeVars: false,
      keepTime: false,
      placement: 'inControlsMenu',
    },
  ];
}
```

