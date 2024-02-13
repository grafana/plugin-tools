---
id: introduction
title: Introduction
description: Introduction
draft: true
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Introduction

[`@grafana/plugin-e2e`](https://www.npmjs.com/package/@grafana/plugin-e2e?activeTab=readme) is designed specifically for Grafana plugin developers. It extends [`Playwright test`](https://playwright.dev/) capabilities with relevant fixtures, models, and expect matchers; enabling comprehensive end-to-end testing of Grafana plugins across multiple versions of Grafana. This package simplifies the testing process, ensuring your plugin is robust and compatible with various Grafana environments.

## The problem `@grafana/plugin-e2e` aims to solve

Plugin authors typically want their plugins to be compatible with a range of Grafana versions. This can be challenging as things such as environment, APIs and UI components may differ from one Grafana version to another. Manually testing a plugin across multiple versions of Grafana is a tedious process, so in most cases E2E testing offers a better solution. `@grafana/plugin-e2e` offers a consitent way to interact with the Grafana UI so that plugin authors can focus on testing their plugins.

## Compatibility

`@grafana/plugin-e2e` API's are guaranteed to work with all the latest minor versions of Grafana since 8.5.0.
