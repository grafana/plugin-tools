---
id: provide-test-environment
title: Help us test your plugin
description: How to add provisioning to your plugin to speed up your plugin review process.
keywords:
  - github
  - provisioning
  - provision
  - review
sidebar_position: 5
---

# Help us test your plugin

:::note

Providing us with additional test configurations and environments isn't required as part of the plugin submission process, but will speed up the review process. For more details, refer to [Plugin submission review](./publish-or-update-a-plugin.md#plugin-submission-review).

:::

Developers often ask us how long it takes to review a plugin for publishing to the Grafana [plugin catalog](https://grafana.com/plugins). Although we [can't give you an estimate](/publish-a-plugin/publish-faqs#how-long-does-it-take-to-review-a-submission), you can reduce cycle times.

The most time-consuming task when reviewing a plugin is creating suitable test configurations and environments so we can verify your plugin's behavior. This step often involves several back-and-forth conversations between you, the plugin developer, and us, the review team.

To help us test your plugin and improve the review time, you can add testing resources to your plugin via [provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#provision-grafana). 

Depending on the type and complexity of your plugin, we require the following resources to test your plugin:

- A simple test JSON dashboard for simple panel or data source plugins.
- The plugin's [Docker development environment](/set-up/). 
- For more complex plugins, we could require access to a test API to thoroughly try out your plugin. 

## Why include testing provisioning?

Providing testing context offers several benefits:

- **Faster review times.** If you include provisioning information for your plugin before submission, your wait for the review is much shorter.
- **Easier reviews.** An out-of-the-box working example allows us to easily experiment with additions to the plugin and raise pull requests.
- **Easier setup for e2e tests.** Provisioned dashboards allow e2e tests to run against specific scenarios across local development and in CI.
- **Improved clarity.** Provisioned plugins make it easier for tech-savvy users to understand how the plugin works.

## How to provide test configurations and environments

Provisioning allows you to add resources in a YAML file under a `/provisioning` directory. We can then use those files to test your plugin as you intented it to work, and provide a better and faster review.

Starting in v2.8.0, `create-plugin` generates provisioning capabilities for all plugin types (apps, datasources and panels) and includes a sample dashboard.

### What you need to do

To provision your plugin with testing files, follow these steps:

1. Run the `create-plugin` tool to generate the `provisioning` folder with additional files based on the plugin type you selected.
1. When you run the Docker development environment, Grafana uses these files to automatically install (and if applicable, _enable_) your plugin and a sample dashboard.

**Notes:**

- Use and update the sample dashboard to continuously verify behavior as part of your development process. If appropriate, configure your plugin so that it can return data.

- If you scaffolded your plugin with a previous version of `create-plugin`, you can run a new command to add the missing provisioning files.




