---
id: provide-provisioning
title: Provision your plugin
description: How to add provisioning to your plugin to potentially speed up your plugin review process.
keywords:
  - github
  - provisioning
  - provision
  - review
sidebar_position: 5
---

# Plugin provisioning

Developers of community plugins often ask us these questions:

- How long does it take to review plugins for inclusion in the Grafana [plugin catalog](https://grafana.com/plugins)?
- How can Grafana Labs speed up the time it takes us to review their submissions?

We have heard you. Our response to these questions has been to allow plugin developers themselves to speed the review process by creating a test environment.

The mechanism for including such an environment with your plugin submission is called _provisioning_. Provisioning refers to the process of preparing and configuring your plugin environment to meet specific requirements, making it easier for reviewers to assess your plugin comprehensively.

## Mechanism to provide for provisioning

Grafana can be configured to have resources installed and enabled through a mechanism known as provisioning, where resources are configured in a YAML file under a `/provisioning` directory.

We have done this for some time in the [create-plugin tool](../get-started/get-started.mdx) for app plugins so that they can be automatically enabled (that is, provisioned) when using our Docker development environment.

We’re now extending provisioning to cover all plugin types (apps, scenes-apps, datasources, panels), and to include a sample dashboard as part of create-plugin.

## Why should plugin developers care about this?

There are several benefits to provisioning:

- **Much faster review times.** If you provision your plugin prior to submission, your wait for the review will be much shorter.
- **Easier contributions.** By having an out-of-the-box working example available, would-be contributors to your plugin can easily experiment with additions to the plugin and raise pull requests.
- **Easier set up for e2e tests.** By provisioning dashboards, e2e tests can run against specific scenarios across local development and in CI.
- **Enhanced transparency.** We have found that provisioned plugins make it easier for tech-savvy users to understand how the plugin works.

## What do plugin developers need to do?

:::note

Provisioning is not required; it's an optional part of the plugin submission process that will speed the review process.

:::

1. When you run the create-plugin tool, it will generate a folder called `provisioning` with additional files based on the plugin type selected.
1. When you run the Docker development environment, these files are used to automatically install (and if applicable, _enable_) your plugin and a sample dashboard.
1. We recommended that you use and update the sample dashboard to continuously verify behavior as part of your development process. And, as appropriate, use the dashboard to configure your plugin so that it can return data.
1. We recommend that you submit the provisioning files along with your plugin for review.

:::note

In the case where a plugin has been scaffolded with a previous version of create-plugin, a new command can be run to retrospectively add the provisioning files.

:::

---
