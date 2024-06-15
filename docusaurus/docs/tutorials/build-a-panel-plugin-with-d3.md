---
id: build-a-panel-plugin-with-d3
title: Build a panel plugin with D3.js
sidebar_position: 7
description: Learn how to use D3.js in your panel plugins.
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - d3js
  - d3
  - panel
  - panel plugin
---

import CreatePlugin from '@shared/create-plugin-frontend.md';

## Introduction

Panels, which allow you to visualize data in different ways, are one of the fundamental building blocks of Grafana. Grafana has several types of panels already included, and many more available in the [Grafana plugin Catalog](https://grafana.com/grafana/plugins/).

To add support for other visualizations, you can create your own panel plugin. Panels are [ReactJS components](https://reactjs.org/docs/components-and-props.html) and can be scaffolded with the `create-plugin` tool.

For more information about panels, refer to the documentation on [Panels](https://grafana.com/docs/grafana/latest/panels/).

This tutorial gives you a hands-on walkthrough of creating your own panel using [D3.js](https://d3js.org/).

In this tutorial, you'll:

- Build a simple panel plugin to visualize a bar chart.
- Learn how to use D3.js to build a panel using data-driven transformations.

### Prerequisites

- Grafana v9.0 or later
- [LTS](https://nodejs.dev/en/about/releases/) version of Node.js

## Create a new plugin

<CreatePlugin pluginType="panel" />

## Data-driven documents

[D3.js](https://d3js.org/) is a JavaScript library for manipulating documents based on data. It lets you transform arbitrary data into HTML, and is commonly used for creating visualizations.

Wait a minute. Manipulating documents based on data? That's sounds an awful lot like React. In fact, much of what you can accomplish with D3 you can already do with React. So before we start looking at D3, let's see how you can create an SVG from data, using only React.

1. For the purposes of this tutorial, remove the following code:

   ```tsx title="src/components/SimplePanel.tsx"
   viewBox={`-${width / 2} -${height / 2} ${width} ${height}`}
   ```

   and

   ```tsx title="src/components/SimplePanel.tsx"
   <div className={styles.textBox}>
     {options.showSeriesCount && <div>Number of series: {data.series.length}</div>}
     <div>Text option value: {options.text}</div>
   </div>
   ```

1. Now, change the SVG group `g` to return a `rect` element rather than a circle.

   ```tsx title="src/components/SimplePanel.tsx"
   <g>
     <rect x={0} y={0} width={30} height={10} fill={theme.visualization.getColorByName('green')} />
   </g>
   ```

One single rectangle might not be very exciting, so let's see how you can create rectangles from data.

1.  Create some data that we can visualize.

    ```ts title="src/components/SimplePanel.tsx"
    const values = [4, 8, 15, 16, 23, 42];
    ```

1.  Calculate the height of each bar based on the height of the panel.

    ```ts title="src/components/SimplePanel.tsx"
    const barHeight = height / values.length;
    ```

1.  Inside the SVG group `g`, create a `rect` element for every value in the dataset. Each rectangle uses the value as its width.

    ```tsx title="src/components/SimplePanel.tsx"
    <g>
      {values.map((value, i) => (
        <rect
          key={value}
          x={0}
          y={i * barHeight}
          width={value}
          height={barHeight - 1}
          fill={theme.visualization.getColorByName('green')}
        />
      ))}
    </g>
    ```

As you can see, React is perfectly capable of dynamically creating HTML elements. In fact, creating elements using React is often faster than creating them using D3.

So why would you use even use D3? In the next step, we'll see how you can take advantage of D3's data transformations.

## Transform data using D3.js

In this step, you'll see how you can transform data using D3 before rendering it using React.

D3 is already bundled with Grafana, and you can access it by importing the `d3` package. However, we're going to need the type definitions while developing.

1. Install the D3 type definitions:

   ```bash
   npm install --save-dev @types/d3
   ```

1. Import `d3`:

   ```ts title="src/components/SimplePanel.tsx"
   import * as d3 from 'd3';
   ```

In the previous step, we had to define the width of each bar in pixels. Instead, let's use _scales_ from the D3 library to make the width of each bar depend on the width of the panel.

Scales are functions that map a range of values to another range of values. In this case, we want to map the values in our datasets to a position within our panel.

1. Create a scale to map a value between 0 and the maximum value in the dataset, to a value between 0 and the width of the panel. We'll be using this to calculate the width of the bar.

   ```ts title="src/components/SimplePanel.tsx"
   const scale = d3
     .scaleLinear()
     .domain([0, d3.max(values) || 0.0])
     .range([0, width]);
   ```

1. Pass the value to the scale function to calculate the width of the bar in pixels.

   ```tsx title="src/components/SimplePanel.tsx"
   return (
     <svg width={width} height={height}>
       <g>
         {values.map((value, i) => (
           <rect
             key={value}
             x={0}
             y={i * barHeight}
             width={scale(value)}
             height={barHeight - 1}
             fill={theme.visualization.getColorByName('green')}
           />
         ))}
       </g>
     </svg>
   );
   ```

As you can see, even if we're using React to render the actual elements, the D3 library contains useful tools that you can use to transform your data before rendering it.

## Add an axis

Another useful tool in the D3 toolbox is the ability to generate _axes_. Adding axes to our chart makes it easier for the user to understand the differences between each bar.

Let's see how you can use D3 to add a horizontal axis to your bar chart.

1. Create a D3 axis. Notice that by using the same scale as before, we make sure that the bar width aligns with the ticks on the axis.

   ```ts title="src/components/SimplePanel.tsx"
   const axis = d3.axisBottom(scale);
   ```

1. Generate the axis. While D3 needs to generate the elements for the axis, we can encapsulate it by generating them within an anonymous function which we pass as a `ref` to a group element `g`.

   ```tsx title="src/components/SimplePanel.tsx"
   <g
     ref={(node) => {
       d3.select(node).call(axis as any);
     }}
   />
   ```

By default, the axis renders at the top of the SVG element. We'd like to move it to the bottom, but to do that, we first need to make room for it by decreasing the height of each bar.

1. Calculate the new bar height based on the padded height.

   ```ts title="src/components/SimplePanel.tsx"
   const padding = 20;
   const chartHeight = height - padding;
   const barHeight = chartHeight / values.length;
   ```

1. Translate the axis by adding a transform to the `g` element.

   ```tsx title="src/components/SimplePanel.tsx"
   <g
     transform={`translate(0, ${chartHeight})`}
     ref={(node) => {
       d3.select(node).call(axis as any);
     }}
   />
   ```

Congrats! You've created a simple and responsive bar chart.

## Complete example

```tsx title="src/components/SimplePanel.tsx"
import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import * as d3 from 'd3';

interface Props extends PanelProps<SimpleOptions> {}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
  };
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const values = [4, 8, 15, 16, 23, 42];
  const padding = 20;
  const chartHeight = height - padding;
  const barHeight = chartHeight / values.length;
  const scale = d3
    .scaleLinear()
    .domain([0, d3.max(values) || 0.0])
    .range([0, width]);
  const axis = d3.axisBottom(scale);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <svg
        className={styles.svg}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <g>
          {values.map((value, i) => (
            <rect
              key={value}
              x={0}
              y={i * barHeight}
              width={scale(value)}
              height={barHeight - 1}
              fill={theme.visualization.getColorByName('green')}
            />
          ))}
        </g>
        <g
          transform={`translate(0, ${chartHeight})`}
          ref={(node) => {
            d3.select(node).call(axis as any);
          }}
        />
      </svg>
    </div>
  );
};
```

## Summary

In this tutorial you built a panel plugin with D3.js.
