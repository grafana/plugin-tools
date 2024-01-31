---
id: custom-config-components
title: Custom configuration components
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

# AngularJS to React: Custom configuration components

## Background

The Grafana SDK provides many useful configuration components for developers like entering number ranges, thresholds, unit selections, and color selections. You can see descriptions of these elements in the [Grafana design system](https://grafana.com/developers/saga/about/overview).

Some panels have more complex configuration options than others. These panels require you to build a custom component to support porting from AngularJS to React.

## An Angular custom configuration example

This document is focused around the `grafana-polystat-panel` as an example of a large complex plugin that was converted from AngularJS to React.

The AngularJS version of `polystat` has a custom editor for composites. A composite is a synthetic metric made by grouping related metrics source from multiple queries. This allows viewing a service (or any device) as a unit for overall health.

An example of a composite is a server with queries for CPU usage, memory usage, disk usage, network bandwidth, and an API response rate. A single metric is composed to represent all of these different metrics, with thresholds unique to each of them, and results in a polygon displayed with the “worst” state (that is, the lowest value).

The composite editor contains global options, and many customization options that apply to that specific composite.

![AngularJS Composite](/img/migration-screenshots/composite-editor-angular.png)

When you expand a composite (COMPOSITE1), it shows details. Adding a new composite provides reasonable default values, and displays an ordered name on the left.
Source code for v1 of the panel can be viewed here: `Polystat Panel v1.x`.
The angular composite editor was a combination of [HTML](https://github.com/grafana/grafana-polystat-panel/blob/v1.2.11/src/partials/editor.composites.html) and code to [manage the UI](https://github.com/grafana/grafana-polystat-panel/blob/v1.2.11/src/composites_manager.ts).

![AngularJS composite editor expanded](/img/migration-screenshots/composite-editor-angular-expanded.png)

This AngularJS plugin works in Grafana version 10, but the editor is hard to use because it requires scrolling left and right to see all the values. Additionally, you must expand the editor side panel to near full size to see all of the options. Once AngularJS is disabled, the plugin no longer functions.

## React component

Porting your component over to React requires creating a custom editor component that looks like this:

![React composite editor](/img/migration-screenshots/composite-react-component.png)

![React composite editor expanded](/img/migration-screenshots/composite-component-react-expanded.png)

![React composite editor add metric](/img/migration-screenshots/composite-react-component-add-metric.png)

The composite editor is now shown vertically and does not require scrolling left and right to see all of the options. You can also filter the editor in the same way that the rest of the configuration items can be filtered.

Source code for the component is now self-contained and can be viewed in the [code](https://github.com/grafana/grafana-polystat-panel/tree/main/src/components/composites).

The new editor supports re-ordering the composites, naming them for easier identification. The editor also leverages the built-in input fields and validators, reducing the amount of code required to support the panel.

This panel has some very complex configuration options which are easier to implement in React. For example, you have the option to have the name of the composite be derived from regular expressions, template variables, or both.

This panel plugin had additional custom editors for thresholds and overrides which needed to be built, and can be used as a reference on how some of the simpler editors can be built.
