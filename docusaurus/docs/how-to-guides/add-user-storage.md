---
id: add-user-storage
title: Add user storage to your plugin
description: How to add individual user storage to your plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - storage
---

# Add user storage to your plugin

User storage allows your Grafana plugin to store user-specific data in the Grafana database. This data is accessible only to the individual user. However, keep in mind that the data is not encrypted and should not be used to store sensitive information. Typical use cases for user storage include saving user preferences or settings.

:::important

- This feature is available in Grafana 11.5 and later.
- It requires the `userStorageAPI` feature flag to be enabled.
- If a plugin uses this feature but it's not enabled in the Grafana instance, the browser `localStorage` will be used as the storage mechanism instead.

:::

## Example: Adding user storage to a query editor

In this example, we'll enhance a `QueryEditor` component by incorporating user storage. It has a `Select` field where you can select the kind of query result that you expect to return. The goal is to remember the user's preferred query type (for example, "Timeseries" or "Table") and use it as the default the next time the query editor is opened.

```tsx
import React, { ReactElement, useEffect } from 'react';
import { InlineFieldRow, InlineField, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { usePluginUserStorage } from '@grafana/runtime';

import { DataSource } from 'datasource';
import { MyDataSourceOptions, MyQuery } from 'types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor(props: Props): ReactElement {
  const { query, onChange } = props;
  const queryTypes = [
    {
      label: 'Timeseries',
      value: 'timeseries',
    },
    {
      label: 'Table',
      value: 'table',
    },
  ];
  const storage = usePluginUserStorage();
  useEffect(() => {
    // Load the default query type from user storage
    storage.getItem('queryType').then((value) => {
      if (value && !query.queryType) {
        onChange({
          ...query,
          queryType: value,
        });
      }
    });
  }, []);

  const onChangeQueryType = (type: SelectableValue<string>) => {
    if (type.value) {
      onChange({
        ...query,
        queryType: type.value,
      });
      // Save the query type to user storage to be used by default for the next time
      storage.setItem('queryType', type.value);
    }
  };

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Query type" grow>
          <Select options={queryTypes} onChange={onChangeQueryType} value={{ value: query.queryType }} />
        </InlineField>
      </InlineFieldRow>
    </>
  );
}
```
