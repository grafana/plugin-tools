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

Developers often ask us how long it takes for a plugin to be reviewed for publishing to the Grafana [plugin catalog](https://grafana.com/plugins). Although we [can't provide estimates](https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin#how-long-does-it-take-to-review-a-submission), we are always looking for ways to reduce cycle times.

By far the most time consuming aspect of a plugin's review is the creation of a suitable test environment so we can verify its behavior. This step often involves a number of back-and-forth conversations between the plugin developer and the review team.

To drastically improve the review time, developers can provide this themselves by [_provisioning_](https://grafana.com/docs/grafana/latest/administration/provisioning/#provision-grafana) their plugin. Provisioning refers to the process of preparing and configuring a test environment within the plugin's [Docker development environment](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment).

## Why should plugin developers care about this?

There are several benefits to provisioning:

- **Much faster review times.** If you provision your plugin prior to submission, your wait for the review will be much shorter.
- **Easier contributions.** By having an out-of-the-box working example available, would-be contributors to your plugin can easily experiment with additions to the plugin and raise pull requests.
- **Easier set up for e2e tests.** By provisioning dashboards, e2e tests can run against specific scenarios across local development and in CI.
- **Improved clarity.** We have found that provisioned plugins make it easier for tech-savvy users to understand how the plugin works.

## Mechanism to provide a test environment

Grafana can be configured to have resources installed and enabled through a mechanism known as [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#provision-grafana), where resources are configured in a YAML file under a `/provisioning` directory.

Since create-plugin v2.8.0, we generate provisioning capabilities for all plugin types (apps, scenes-apps, datasources, panels), and to include a sample dashboard as part of create-plugin.

## What do plugin developers need to do?

:::note

Provisioning is not required; it's an optional part of the plugin submission process that will speed the review.

:::

1. When you run the create-plugin tool, it will generate a folder called `provisioning` with additional files based on the plugin type selected.
1. When you run the Docker development environment, these files are used to automatically install (and if applicable, _enable_) your plugin and a sample dashboard.
1. We recommended that you use and update the sample dashboard to continuously verify behavior as part of your development process. And, as appropriate, configure your plugin so that it can return data.

:::note

In the case where a plugin has been scaffolded with a previous version of create-plugin, a new command can be run to retrospectively add the provisioning files.

:::

---
