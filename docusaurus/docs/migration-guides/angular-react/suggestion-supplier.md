---
id: add-suggestion-supplier
title: Add a suggestion supplier
sidebar_position: 9
description: How to add a suggestion supplier to a plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - React
  - ReactJS
  - Angular
  - migration
  - suggestion
---

# Angular to React: Add a suggestion supplier

You can add a suggestion supplier to examine query data coming from a panel and suggest usage of the plugin for the type of data detected. This guide provides instructions for doing so along with links to relevant examples.

A good example is the `stat` panel, which inspects the query resukts and ranks itself "high" for a single series, and "low" for multiple series (or even none).

## Add the suggestion supplier

Here is an example suggestion suppler seen as part of `module.ts`:

```ts
import { MyDataSuggestionsSupplier } from './suggestions';
...

.setSuggestionsSupplier(new MyDataSuggestionsSupplier());
```

Here is an example suggestion supplier derived from polystat:

```ts
import { VisualizationSuggestionsBuilder } from '@grafana/data';
import { MyOptions } from './types';

export class MyDataSuggestionsSupplier {
  getSuggestionsForData(builder: VisualizationSuggestionsBuilder) {
    const { dataSummary: ds } = builder;

    if (!ds.hasData) {
      return;
    }
    if (!ds.hasNumberField) {
      return;
    }

    const list = builder.getListAppender<MyOptions, {}>({
      name: 'MyPanel',
      pluginId: 'myorg-description-panel',
      options: {},
    });

    list.append({
      name: 'MyPanel',
    });
  }
}
```

:::note

When creating a suggestion supplier be certain the plugin can actually render something for the data being provided.

If the suggestion supplier ranks the plugin high incorrectly, the end result will often display a blank panel and/or an error message.

It's best to offer the plugin only to query data that matches well-known criteria that the plugin can process and visualize.

:::

## Additional resources

Reference these suggestion suppliers to get ideas for further customization:

- [Piechart panel](https://github.com/grafana/grafana/blob/main/public/app/plugins/panel/piechart/suggestions.ts#L7)

The piechart panel checks the query for more than 30 rows return and does not offer itself as a visualization, even though it could display the data it will be nearly unreadable.

- [Stat panel](https://github.com/grafana/grafana/blob/main/public/app/plugins/panel/stat/suggestions.ts#L7)

Similar to the piechart panel, this plugin offers itself for data row results less than 10. It also sets default options based on the types of fields inside the query results.

- [Heatmap panel](https://github.com/grafana/grafana/blob/main/public/app/plugins/panel/heatmap/suggestions.ts#L8)

This panel does some processing on the data, and if there are any warnings generated, it omits itself from being offered.
