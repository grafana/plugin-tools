---
id: add-datalinks-support
title: Add datalinks support to panel plugins
description: How to add datalinks support to panel plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - datalinks
---

# How to implement data links in a panel plugin

Data links allow users to navigate from panel visualizations to other dashboards, external systems, or any URL. This guide shows you how to implement data links in your Grafana panel plugin.

## Prerequisites

- Basic knowledge of Grafana panel plugin development
- Familiarity with React and TypeScript

## Understanding data links

In Grafana, data links are configured by users in the field options of a panel. Your panel plugin needs to:

1. Access these configured links from the field data
2. Check if links exist for a particular data point
3. Render a clickable element that opens the links menu
4. Use the `DataLinksContextMenu` component to display and handle the links

## How it works: step by step

### 1. Access field data with links

The `getFieldDisplayValues` function processes your panel data and applies field configurations, including data links:

```tsx title="YourPanel.tsx"
const fieldDisplayValues = getFieldDisplayValues({
  fieldConfig, // Contains field configurations including data links
  reduceOptions: options.reduceOptions,
  data: data.series,
  theme,
  replaceVariables, // For variable interpolation in links
  timeZone,
});
```

### 2. Check for data links

For each field value, check if it has links using the `hasLinks` and `getLinks` properties:

```tsx
if (displayValue.hasLinks && displayValue.getLinks) {
  // This field value has data links configured
}
```

### 3. Use DataLinksContextMenu component

Wrap your visualization elements with the `DataLinksContextMenu` component:

```tsx title="YourPanel.tsx"
<DataLinksContextMenu links={displayValue.getLinks} config={displayValue.field}>
  {(api) => (
    <YourVisualizationElement
      onClick={api.openMenu} // This opens the links menu when clicked
      // other props
    />
  )}
</DataLinksContextMenu>
```

## Behind the scenes

1. **User Configuration**: Users configure data links in the field options of your panel
2. **Data Processing**: Grafana processes these links and attaches them to field values
3. **Rendering**: Your panel checks for links and renders clickable elements
4. **Interaction**: When a user clicks an element with links, the context menu opens
5. **Navigation**: The user selects a link and navigates to the target

## Notes

- Data links must be configured in the field options for your panel
- The `getLinks` function returns a function that returns an array of `LinkModel` objects
- Data links support variable interpolation using the `replaceVariables` function
- The context menu handles all the UI for displaying and navigating links

By implementing data links, you enhance your panel's interactivity, allowing users to navigate from your visualization to related dashboards or external resources.

## Complete implementation example

Here's a complete example showing how all the pieces fit together in a panel component:

```tsx title="YourPanel.tsx"
import React from 'react';
import { PanelProps, getFieldDisplayValues, LinkModel, FieldConfig } from '@grafana/data';
import { DataLinksContextMenu, useStyles2, useTheme2 } from '@grafana/ui';

interface Props extends PanelProps<YourPanelOptions> {}

export const YourPanel = ({ data, width, height, options, replaceVariables, fieldConfig, timeZone }: Props) => {
  const theme = useTheme2();

  // Handle compatibility with different Grafana versions
  const ContextMenu = DataLinksContextMenu as React.FC<{
    links: () => LinkModel[];
    config: FieldConfig;
    children: (api: { openMenu: React.MouseEventHandler<HTMLElement> }) => React.ReactNode;
  }>;

  // 1. Get the field display values which contain link information
  const fieldDisplayValues = getFieldDisplayValues({
    fieldConfig,
    reduceOptions: options.reduceOptions,
    data: data.series,
    theme,
    replaceVariables,
    timeZone,
  });

  return (
    <div style={{ width, height }}>
      {/* 2. Render your visualization with data links */}
      <div className="visualization-container">
        {fieldDisplayValues.map((displayValue, index) => {
          // 3. Check if this field has data links
          if (displayValue.hasLinks && displayValue.getLinks) {
            // 4. Use DataLinksContextMenu to handle links
            return (
              <ContextMenu key={index} links={displayValue.getLinks} config={displayValue.field}>
                {(api) => (
                  <div
                    className="data-point"
                    onClick={api.openMenu} // 5. Attach the openMenu handler
                    style={{
                      cursor: 'pointer',
                      // Visualization styling
                    }}
                  >
                    {displayValue.display.text}
                  </div>
                )}
              </ContextMenu>
            );
          }

          // Render elements without links
          return (
            <div key={index} className="data-point">
              {displayValue.display.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```
