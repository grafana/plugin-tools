---
id: read-data-from-a-data-source
title: Read data frames returned by a data source plugin
description: A guide to reading data frames in Grafana panel plugin development.
keywords:
  - grafana
  - plugins
  - plugin
  - panel
  - data source
  - datasource
  - data frames
  - dataframes
---

The [data frame](../../key-concepts/data-frames) is a columnar data structure that allows for efficient querying of large amounts of data. Since data frames are a central concept when developing plugins for Grafana, in this guide we'll look at some ways you can use them in your panel plugin to visualize data returned by a data source query.

The `DataFrame` interface contains a `name` and an array of `fields` where each field contains the name, type, and the values for the field.

# Read values from a data frame

When you're building a panel plugin, the data frames returned by the data source are available from the `data` prop in your panel component.

```ts
function SimplePanel({ data: Props }) {
  const frame = data.series[0];

  // ...
}
```

Before you start reading the data, think about what data you expect. For example, to visualize a time series you need at least one time field and one number field.

```ts
const timeField = frame.fields.find((field) => field.type === FieldType.time);
const valueField = frame.fields.find((field) => field.type === FieldType.number);
```

Other types of visualizations might need multiple dimensions. For example, a bubble chart that uses three numeric fields: the X-axis, Y-axis, and one for the radius of each bubble. In this case, instead of hard coding the field names, we recommend that you let the user choose the field to use for each dimension.

```ts
const x = frame.fields.find((field) => field.name === xField);
const y = frame.fields.find((field) => field.name === yField);
const size = frame.fields.find((field) => field.name === sizeField);

for (let i = 0; i < frame.length; i++) {
  const row = [x?.values[i], y?.values[i], size?.values[i]];

  // ...
}
```

Alternatively, you can use the `DataFrameView`, which gives you an array of objects that contain a property for each field in the frame.

```ts
const view = new DataFrameView(frame);

view.forEach((row) => {
  console.log(row[options.xField], row[options.yField], row[options.sizeField]);
});
```

## Display values from a data frame

Field options let the user control how Grafana displays the data in a data frame.

To apply the field options to a value, use the `display` method on the corresponding field. The result contains information such as the color and suffix to use when display the value.

```tsx
const valueField = frame.fields.find((field) => field.type === FieldType.number);

return (
  <div>
    {valueField
      ? valueField.values.map((value) => {
          const displayValue = valueField.display!(value);
          return (
            <p style={{ color: displayValue.color }}>
              {displayValue.text} {displayValue.suffix ? displayValue.suffix : ''}
            </p>
          );
        })
      : null}
  </div>
);
```

To apply field options to the name of a field, use `getFieldDisplayName`.

```ts
const valueField = frame.fields.find((field) => field.type === FieldType.number);
const valueFieldName = getFieldDisplayName(valueField, frame);
```
