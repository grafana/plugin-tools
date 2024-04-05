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

# Introduction to plugin end-to-end testing

[`@grafana/plugin-e2e`](https://www.npmjs.com/package/@grafana/plugin-e2e?activeTab=readme) is designed specifically for Grafana plugin developers. It extends [`@playwright/test`](https://playwright.dev/) capabilities with relevant fixtures, models, and expect matchers; enabling comprehensive end-to-end testing of Grafana plugins across multiple versions of Grafana. This package simplifies the testing process, ensuring your plugin is robust and compatible with various Grafana environments.

## The problem

Plugin authors typically want their plugins to be compatible with a range of Grafana versions. This can be challenging because things such as environment, APIs and UI components may differ from one Grafana version to another. Therefore, manually testing a plugin across multiple versions of Grafana is a tedious process, so in most cases end-to-end testing offers a better solution.

## The solution

The `@grafana/plugin-e2e` tool offers a consistent way to interact with the Grafana UI without having to handle UI deviations in the plugin test code. The APIs of `@grafana/plugin-e2e` are guaranteed to work with all the latest minor versions of Grafana since 8.5.0. In addition to cross-version compatibility, the tool provides a set of features that simplify the end-to-end testing experience:

- **Predefined fixtures:** Offers a set of predefined fixtures that are tailored for Grafana plugin testing.
- **Custom models:** Provides custom models that represent pages and components in Grafana, simplifying maintenance and creating reusable code to avoid repetition.
- **Expect matchers:** Includes a range of expect matchers that are specialized for Grafana plugin assertions, helping you validate plugin behavior more effectively.
- **Integration with Playwright:** Seamlessly integrates with the Playwright testing framework, leveraging its powerful browser automation capabilities.
