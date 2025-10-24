---
id: publish-faqs
title: Publish a plugin FAQs
sidebar_position: 4
description: Publish a plugin FAQs.
keywords:
  - grafana
  - plugins
  - plugin
  - publish plugin
  - update plugin
  - provision
  - faqs
---

import PublishReviewNote from '@shared/publish-review-note.md';

<PublishReviewNote />

# Publish a plugin: Frequently asked questions

## Do I need to submit a private plugin?

- No. Please only submit plugins that you wish to make publicly available for the Grafana community.

## How long does it take to review a submission?

- We're not able to give an estimate because each plugin submission is unique, though we're constantly working to improve the time it takes to review a plugin. Providing a [provisioned](./provide-test-environment.md) test environment can drastically speed up your review.

## Can I decide a date when my plugin will be published?

- No. We cannot guarantee specific publishing dates, as plugins are immediately published after a review based on our internal prioritization.

## Can I see metrics of my plugin installs, downloads or usage?

- No. We don't offer this information at the moment to plugin authors.

## How can I update my plugin's catalog page?

- The plugin's catalog page content is extracted from the plugin README file.
  To update the plugin's catalog page, submit an updated plugin with the new content included in the README file.

## Can I unlist a plugin?

- In the event of a bug, unlisting the plugin from our catalog may be possible in exceptional cases, such as security concerns. However, we don't have control over the instances where the plugin is installed.

- Also, refer to the Grafana Labs [Plugin Deprecation Policy](https://grafana.com/legal/plugin-deprecation/) to learn more about plugin deprecation.

## Can I distribute my plugin somewhere else other than the Grafana plugin catalog?

- The official method for distributing Grafana plugins is through our catalog. Alternative methods, such as installing private or development plugins on local Grafana instances, are available as per the guidelines provided in [this guide](https://grafana.com/docs/grafana/latest/administration/plugin-management#install-plugin-on-local-grafana).

## Can I still use Angular for a plugin?

- No. We will not accept any new plugin submissions written in Angular. For more information, refer to our [Angular support deprecation documentation](https://grafana.com/docs/grafana/latest/developers/angular_deprecation/).

## Can I submit plugins built with Toolkit?

- The @grafana/toolkit tool is deprecated. Please [migrate to `create-plugin`](../migration-guides/migrate-from-toolkit.mdx). In the future, we will reject submissions based on @grafana/toolkit as it becomes increasingly out-of-date.

## Do all plugins require signatures?

- All plugins require signatures unless they are in development or being submitted to review for the first time.

## Do plugin signatures expire?

- Plugin signatures do not currently expire.

## What source code URL formats are supported?

- Using a tag or branch: `https://github.com/grafana/clock-panel/tree/v2.1.3`
- Using a tag or branch and the code is in a subdirectory (important for mono repos): `https://github.com/grafana/clock-panel/tree/v2.1.3/plugin/` (here, the plugin contains the plugin code)
- Using the latest main or master branch commit: `https://github.com/grafana/clock-panel/` (not recommended, it's better to pass a tag or branch)
