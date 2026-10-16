---
title: "Configure the {{{yamlEscape pluginName}}} data source"
description: "Add the {{{yamlEscape pluginName}}} data source in Grafana and connect it to your service."
sidebar_position: 2
---

This document explains how to add and configure the {{{pluginName}}} data source in Grafana. After you configure the data source, refer to the [{{{pluginName}}} query editor](./query-editor.md) to start querying your data.

## Before you begin

Before you configure the data source, ensure you have:

- **Grafana permissions:** The `Organization administrator` role. Only organization administrators can add data sources.

<!-- section-brief
Fill this in: Keep the list above. Add a bullet in the same **Label:** form for each other thing the reader needs: the instance of the service {{{pluginName}}} connects to and how Grafana reaches it, such as its address, default port and network access, and the credentials and permissions needed on it. If the service can sit behind a firewall, add a `> [!NOTE]` callout telling Grafana Cloud users to allowlist the Grafana Cloud outbound IP addresses, and link to https://grafana.com/docs/grafana-cloud/account-management/allow-traffic/.
-->

## Set up access in {{{pluginName}}}

<!-- section-brief
Fill this in: Steps the reader follows in the service {{{pluginName}}} connects to before adding the data source, such as creating a user, an API token or a cloud role. Take what's needed from the credential fields in the config editor, and work out the least access that works from what the backend calls, such as API endpoints, SQL statements or settings it changes. Say what fails if a permission is missing. Change the heading if necessary to name the task, such as "Create a read-only user". Leave the Grafana fields to Authentication below.

If the reader only needs credentials they already have, remove this section and keep them as a bullet in Before you begin.
-->

## Add the data source

To add the {{{pluginName}}} data source:

1. Click **Connections** in the left-side menu.
1. Click **Add new connection**.
1. Enter `{{{pluginName}}}` in the search bar.
1. Select **{{{pluginName}}}**.
1. Click **Add new data source**.

## Authentication

<!-- section-brief
Fill this in: Describe each authentication method the config editor offers, such as API key, basic auth, OAuth or cloud credentials. For each one, say when to use it and list the fields the reader fills in. Use a `> [!NOTE]` callout for a method that's only available in Grafana Cloud or Grafana Enterprise.

If the data source has no authentication settings, remove this section entirely.
-->

## Configure settings

<!-- section-brief
Fill this in: One table per group of settings, in the order they appear in the config editor, with this shape:

| Setting | Description |
| ------- | ----------- |

Use the field labels from the config editor, in bold, and say which settings are required. Find the settings in the config editor component and the options types in source (`jsonData` and `secureJsonData`). Leave out the authentication fields covered above.
-->

## Private data source connect

<!-- section-brief
Fill this in: Explain how to reach a service on a private network from Grafana Cloud with private data source connect (PDC), and link to https://grafana.com/docs/grafana-cloud/connect-externally-hosted/private-data-source-connect/ for setup.

Keep this section only if the plugin backend supports the secure SOCKS proxy (look for `EnableSecureSocksProxy` or `secureSocksProxyEnabled` in source). Otherwise, remove it entirely.
-->

## Verify the connection

<!-- section-brief
Fill this in: Tell the reader to click **Save & test**, then give the message they see when the connection works and the most common failure messages, each with what it means. Take the messages from the health check in source (`CheckHealth` in the backend, or `testDatasource` in the frontend), and link failures to the troubleshooting page.
-->

## Provision the data source

<!-- section-brief
Fill this in: Show how to set up {{{pluginName}}} as code. Start with a YAML provisioning file for Grafana, with `apiVersion: 1` and a `datasources:` list, that uses the real `jsonData` and `secureJsonData` keys from source and placeholder values for secrets. Link to https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources for where to put the file.

Then show the same setup as a Terraform `grafana_data_source` resource, and link to https://registry.terraform.io/providers/grafana/grafana/latest/docs/resources/data_source.
-->
