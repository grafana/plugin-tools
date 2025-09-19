---
id: add-features-for-explore-queries
title: Add features for Explore queries
description: Add features to Explore queries in Grafana plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - queries
  - explore queries
  - explore
---

[Explore](https://grafana.com/docs/grafana/latest/explore/) allows you to make ad-hoc queries without having to use a dashboard. This is useful when you want to troubleshoot or learn more about the data. Your data source supports Explore by default and uses the existing query editor. 

This guide explains how to extend functionality for Explore queries in a data source plugin.

## Add an Explore-specific query editor

To extend the Explore functionality for your data source, define an Explore-specific query editor.

1. Create a file `ExploreQueryEditor.tsx` in the `src` directory of your plugin, with content similar to this:

   ```tsx title="src/ExploreQueryEditor.tsx"
   import React from 'react';

   import { QueryEditorProps } from '@grafana/data';
   import { QueryField } from '@grafana/ui';
   import { DataSource } from './DataSource';
   import { MyQuery, MyDataSourceOptions } from './types';

   type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

   export default (props: Props) => {
     return <h2>My Explore-specific query editor</h2>;
   };
   ```

1. Modify your base query editor in `QueryEditor.tsx` to render the Explore-specific query editor. For example:

   ```tsx title="src/QueryEditor.tsx"
   // [...]
   import { CoreApp } from '@grafana/data';
   import ExploreQueryEditor from './ExploreQueryEditor';

   type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

   export default (props: Props) => {
     const { app } = props;

     switch (app) {
       case CoreApp.Explore:
         return <ExploreQueryEditor {...props} />;
       default:
         return <div>My base query editor</div>;
     }
   };
   ```

## Select a preferred visualization type

By default, Explore identifies your returned data (time series, logs, or something else) and creates the right type of visualization.

However, if you want a custom visualization, you can add a hint to your returned data frame by setting the `meta` attribute to `preferredVisualisationType`.

Construct a data frame with specific metadata like this:

```ts
const firstResult = createDataFrame({
    fields: [...],
    meta: {
        preferredVisualisationType: 'logs',
    },
});
```

For possible options, refer to [PreferredVisualisationType](https://github.com/grafana/grafana/blob/main/packages/grafana-data/src/types/data.ts#L25).
