---
id: migrate-angularjs-to-react-custom-config-components
title: Custom Configuration Components
sidebar_position: 4
description: How to migrate a Grafana plugin from AngularJS with custom fields to React with custom components.
keywords:
  - grafana
  - plugins
  - plugin
  - React
  - ReactJS
  - Angular
  - migration
---

# Angular to React: Custom Configuration Components

## Background

The Grafana SDK provides many useful configuration components for developers like entering number ranges, thresholds, unit selections, color selections, you can see these in action here: Grafana design system

Some panels have more complex configuration options, and will require building a custom component to support porting to React.

## An Angular Custom Configuration Example

This document is focused around the `grafana-polystat-panel` as an example of a large complex plugin that was converted from Angular to React.

The Angular version of polystat has a custom editor for Composites. A composite is a synthetic metric made by grouping related metrics source from multiple queries. This allows viewing a service (or any device) as a unit for overall health.

An example would be a server with queries for CPU usage, memory usage, disk usage, network bandwidth, and an API response rate. A single metric is composed to represent all of these different metrics, with thresholds unique to each of them, and results in a polygon displayed with the “worst” state.

The composite editor contains global options, and many customization options that apply to that specific composite.

![AngularJS Composite](/img/migration-screenshots/composite-editor-angular.png)

Expanding a composite (COMPOSITE1) will show details for the composite. Adding a new composite will provide reasonable default values, and will give an ordered name on the left.
Source code for v1 of the panel can be viewed here:Polystat Panel v1.x
The angular composite editor was a combination of [html](https://github.com/grafana/grafana-polystat-panel/blob/v1.2.11/src/partials/editor.composites.html) and code to [manage the UI](https://github.com/grafana/grafana-polystat-panel/blob/v1.2.11/src/composites_manager.ts).

![AngularJS Composite Editor Expanded](/img/migration-screenshots/composite-editor-angular-expanded.png)

This AngularJS plugin does work in G10, but the editor is hard to use as it requires scrolling left and right to see all values, and expanding the editor side panel to near full size to see all of the options. Once AngularJS is disable, the plugin will no longer function.

## React Component

Porting this over to React required creating a custom editor component that looks like this:

![React Composite Editor](/img/migration-screenshots/composite-react-component.png)

![React Composite Editor Expanded](/img/migration-screenshots/composite-component-react-expanded.png)

![React Composite Editor Add Metric](/img/migration-screenshots/composite-react-component-add-metric.png)

The composite editor is now vertical and does not require scrolling left and right to see all of the options. It can also be filtered in the same way the rest of the configuration items can be filtered.

Source code for the component is now self-contained and can be viewed [here](https://github.com/grafana/grafana-polystat-panel/tree/main/src/components/composites)

The new editor supports re-ordering the composites, naming them for easier identification,, and leverages the built in input fields and validators, reducing the amount of code required to support the panel.

This panel has some very complex configuration options which are easier to implement in React, like having the name of the composite be derived from regular expressions and/or template variables.

This panel plugin had additional custom editors for thresholds and overrides which needed to be built, and can be used as a reference on how some of the simpler editors can be built.
