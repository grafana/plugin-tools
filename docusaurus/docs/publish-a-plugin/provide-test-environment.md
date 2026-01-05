---
id: provide-test-environment
title: Provide a test environment
description: How to add provisioning to your plugin to speed up your plugin review process.
keywords:
  - github
  - provisioning
  - provision
  - review
sidebar_position: 5
---

# Provide a test environment

:::note

Provisioning isn't required as part of the plugin submission process, but it speeds up the review process. For more details, refer to [Plugin submission review](./publish-or-update-a-plugin.md#plugin-submission-review).

:::

Developers often ask us how long it takes to review a plugin for publishing to the Grafana [plugin catalog](https://grafana.com/plugins). Although we [can't provide estimates](/publish-a-plugin/publish-faqs#how-long-does-it-take-to-review-a-submission), you can reduce cycle times.

The most time-consuming aspect of a plugin's review is creating a suitable test environment so we can verify its behavior. This step often involves several back-and-forth conversations between the plugin developer and the review team.

To improve the review time, add [_provisioning_](https://grafana.com/docs/grafana/latest/administration/provisioning/#provision-grafana) to your plugin. Provisioning prepares and configures a test environment within the plugin's [Docker development environment](/set-up/).

## Why provision test environments?

Provisioning offers several benefits:

- **Faster review times.** If you provision your plugin before submission, your wait for the review is much shorter.
- **Easier contributions.** An out-of-the-box working example allows would-be contributors to your plugin to easily experiment with additions to the plugin and raise pull requests.
- **Easier setup for e2e tests.** Provisioned dashboards allow e2e tests to run against specific scenarios across local development and in CI.
- **Improved clarity.** Provisioned plugins make it easier for tech-savvy users to understand how the plugin works.

## How to provide a test environment

You can configure Grafana to have resources installed and enabled through [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#provision-grafana), where you configure resources in a YAML file under a `/provisioning` directory.

Starting in v2.8.0, `create-plugin` generates provisioning capabilities for all plugin types (apps, scenes-apps, datasources, panels) and includes a sample dashboard.

### What you need to do

To provision your plugin, follow these steps:

1. Run the `create-plugin` tool to generate the `provisioning` folder with additional files based on the plugin type you selected.
1. When you run the Docker development environment, Grafana uses these files to automatically install (and if applicable, _enable_) your plugin and a sample dashboard.

**Notes:**

- Use and update the sample dashboard to continuously verify behavior as part of your development process. If appropriate, configure your plugin so that it can return data.

- If you scaffolded your plugin with a previous version of `create-plugin`, you can run a new command to add the missing provisioning files.




