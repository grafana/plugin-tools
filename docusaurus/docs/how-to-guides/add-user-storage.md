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

Add user storage to your plugin to store user-specific data in Grafana. This data is stored in the Grafana database and is accessible only to that user. Note that this data is not encrypted and should not be used to store sensitive information. The typical use case for this feature is to store user preferences or other settings.

:::important

This feature is only available in Grafana 11.5 and later. It also requires the feature flag `userStorageAPI` to be enabled. If a plugin uses this feature but it's not enabled in the Grafana instance, the browser `localStorage` will be used as the storage mechanism instead.

:::

## Sample query editor

Let's say you have a `QueryEditor` that looks similar to the example below. It has a `Select` field where you can select the kind of query result that you expect to return. We will add user storage to this component to save the user's preferred query type so that it can be used as the default next time the user opens the query editor.

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
