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

Provisioning is not required as part of the plugin submission process but it will speed the reviewing process. Refer to [Plugin submission review](./publish-or-update-a-plugin.md#plugin-submission-review) for more details.

:::

Developers often ask us how long it takes for a plugin to be reviewed for publishing to the Grafana [plugin catalog](https://grafana.com/plugins). Although we [can't provide estimates](/publish-a-plugin/publish-faqs#how-long-does-it-take-to-review-a-submission), there's ways to reduce cycle times.

By far the most time consuming aspect of a plugin's review is the creation of a suitable test environment so we can verify its behavior. This step often involves a number of back-and-forth conversations between the plugin developer and the review team.

To improve the review time, add [_provisioning_](https://grafana.com/docs/grafana/latest/administration/provisioning/#provision-grafana) to your plugin. Provisioning refers to the process of preparing and configuring a test environment within the plugin's [Docker development environment](/set-up/).

## Why provisioning test environments?

There are several benefits to provisioning:

- **Much faster review times.** If you provision your plugin prior to submission, your wait for the review will be much shorter.
- **Easier contributions.** By having an out-of-the-box working example available, would-be contributors to your plugin can easily experiment with additions to the plugin and raise pull requests.
- **Easier set up for e2e tests.** By provisioning dashboards, e2e tests can run against specific scenarios across local development and in CI.
- **Improved clarity.** We have found that provisioned plugins make it easier for tech-savvy users to understand how the plugin works.

## How to provide a test environment

You can configure Grafana to have resources installed and enabled through a mechanism known as [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#provision-grafana), where resources are configured in a YAML file under a `/provisioning` directory.

Starting in v2.8.0, `create-plugin` generates provisioning capabilities for all plugin types (apps, scenes-apps, datasources, panels) and includes a sample dashboard.

### What do you need to do?

To provision follow these steps:

1. Run the `create-plugin` tool to generate the `provisioning` folder with additional files based on the plugin type selected.
1. When you run the Docker development environment, these files are used to automatically install (and if applicable, _enable_) your plugin and a sample dashboard.

Notes:

- Use and update the sample dashboard to continuously verify behavior as part of your development process. If appropriate, configure your plugin so that it can return data.

- If you scaffolded your plugin with a previous version of `create-plugin`, you can run a new command to add the missing provisioning files.




