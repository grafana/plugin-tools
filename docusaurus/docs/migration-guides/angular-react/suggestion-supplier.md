---
id: adding-suggestion-supplier
title: Adding a suggestion supplier to a plugin
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
# Angular to React: Adding a Suggestion Supplier

The suggestion supplier examines query data coming from a panel and suggests usage of the plugin for the type of data detected.

A single stat panel would be rank "high" for a single series, and "low" for multiple series (or even none).

## Adding the suggestion supplier

Part of the `module.ts`

```ts
import { MyDataSuggestionsSupplier } from './suggestions';
...

.setSuggestionsSupplier(new MyDataSuggestionsSupplier());
```

An example suggestion supplier (derived from polystat):

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

## Special Notes

When creating a suggestion supplier be certain the plugin can actually render something for the data being provided.

## Additional Resources

These panels implemement suggestion suppliers, and can be referenced for further customization.

[Piechart Panel](https://github.com/grafana/grafana/blob/main/public/app/plugins/panel/piechart/suggestions.ts#L7)

[Stat Panel](https://github.com/grafana/grafana/blob/main/public/app/plugins/panel/stat/suggestions.ts#L7)

[Heatmap Panel](https://github.com/grafana/grafana/blob/main/public/app/plugins/panel/heatmap/suggestions.ts#L8)
