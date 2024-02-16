---
id: introduction
title: Introduction
description: Introduction
keywords:
  - grafana
  - plugins
  - plugin
  - testing
  - e2e
  - end-to-end
sidebar_position: 1
---

# Introduction

[`@grafana/plugin-e2e`](https://www.npmjs.com/package/@grafana/plugin-e2e?activeTab=readme) is designed specifically for Grafana plugin developers. It extends [`Playwright test`](https://playwright.dev/) capabilities with relevant fixtures, models, and expect matchers; enabling comprehensive end-to-end testing of Grafana plugins across multiple versions of Grafana. This package simplifies the testing process, ensuring your plugin is robust and compatible with various Grafana environments.

:::warning
`@grafana/plugin-e2e` is still in beta and subject to breaking changes.
:::

## The problem

Plugin authors typically want their plugins to be compatible with a range of Grafana versions. This can be challenging as things such as environment, APIs and UI components may differ from one Grafana version to another. Manually testing a plugin across multiple versions of Grafana is a tedious process, so in most cases end-to-end testing offers a better solution.

## The solution

`@grafana/plugin-e2e` offers a consistent way to interact with the Grafana UI without having to handle UI deviations in the plugin test code. The API's of `@grafana/plugin-e2e` are guaranteed to work with all the latest minor versions of Grafana since 8.5.0. In addition to cross version compatibility, it provides a set of features that simplifies the end-to-end testing experience:

- **Predefined Fixtures:** Offers a set of predefined fixtures that are tailored for Grafana plugin testing.
- **Custom Models:** Provides custom models that represent pages and components in Grafana, simplifying maintenance and creating reusable code to avoid repetition.
- **Expect Matchers:** Includes a range of expect matchers that are specialized for Grafana plugin assertions, helping you validate plugin behavior more effectively.
- **Integration with Playwright:** Seamlessly integrates with the Playwright testing framework, leveraging its powerful browser automation capabilities.
