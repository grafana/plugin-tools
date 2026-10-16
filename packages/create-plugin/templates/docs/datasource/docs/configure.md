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
Fill this in: Steps the reader follows in the service {{{pluginName}}} connects to before adding the data source, such as creating a user, an API token or a cloud role. Take what's needed from the credential fields in the config editor, and work out the least access that works from what the backend calls, such as API endpoints, SQL statements or settings it changes. Say what fails if a permission is missing. Change the heading if necessary to name the task, such as "Create a read-only user". Leave the Grafana fields to Configure settings below.

If the reader only needs credentials they already have, remove this section and keep them as a bullet in Before you begin.
-->

## Add the data source

To add the {{{pluginName}}} data source:

1. Click **Connections** in the left-side menu.
1. Click **Add new connection**.
1. Enter `{{{pluginName}}}` in the search bar.
1. Select **{{{pluginName}}}**.
1. Click **Add new data source**.

## Configure settings

<!-- section-brief
Fill this in: An H3 for each section of the config editor, named and ordered as the editor shows them, such as Connection, Authentication, TLS or Additional settings. Under each H3, a table with this shape:

| Setting | Description | Required |
| ------- | ----------- | -------- |

Start the first table with **Name** and **Default**. Use the field labels from the config editor, in bold. Find the settings in the config editor component and the options type, including `jsonData` and `secureJsonData`.

In a description, say when a field only appears for some choice, such as a protocol, and when it affects another setting, such as a port that must change when TLS is turned on. If source shows the editor lacks an option readers expect, such as TLS settings, say so and what to do instead. For each authentication method, say when to use it. Use a `> [!NOTE]` callout for a method or setting that's only available in Grafana Cloud or Grafana Enterprise.

When a feature needs more than a table row, such as forwarding OAuth identity or HTTP headers, or cloud provider auth like AWS SigV4, give it its own H2 after this section with its setup, requirements and behavior.
-->
{{#if hasBackend}}

## Private data source connect

<!-- section-brief
Fill this in: Explain how to reach a service on a private network from Grafana Cloud with private data source connect (PDC), and link to https://grafana.com/docs/grafana-cloud/connect-externally-hosted/private-data-source-connect/ for setup. Start with a `> [!NOTE]` callout saying PDC is only available in Grafana Cloud. Name the toggle the config editor shows, and say it only appears when the secure SOCKS proxy is enabled for the Grafana instance. For self-managed Grafana, show the setting that enables it:

```ini
[secure_socks_datasource_proxy]
enabled = true
```

Keep this section only if the backend supports the secure SOCKS proxy (look for `EnableSecureSocksProxy` or `secureSocksProxyEnabled` in source). Otherwise, remove it entirely.
-->
{{/if}}

## Verify the connection

Click **Save & test** to verify the connection.

<!-- section-brief
Fill this in: Give the message the reader sees when the connection works and the most common failure messages, each with what it means. Take the messages from the health check in source (`CheckHealth` in the backend, or `testDatasource` in the frontend). Link failures to [troubleshooting](./troubleshooting.md) with a relative link.
-->
{{#if hasBackend}}

## Query caching

In Grafana Cloud and Grafana Enterprise, you can use the **Cache** tab on the data source page to enable query caching, which reduces load on {{{pluginName}}} by reusing recent query results. For more information, refer to [Query and resource caching](https://grafana.com/docs/grafana/latest/administration/data-source-management/#query-and-resource-caching).
{{/if}}

## Provision the data source

You can provision the {{{pluginName}}} data source as code, with a Grafana provisioning file or with the Grafana Terraform provider.

<!-- section-brief
Fill this in: List the placeholders the examples below use, such as `<HOST>` or `<API_TOKEN>`, each with what to replace it with.
-->

### Provision with a configuration file

You can define the data source in a YAML file as part of the Grafana provisioning system. For more information, refer to [Provision Grafana](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources).

<!-- section-brief
Fill this in: A YAML example with this shape, using the real `jsonData` and `secureJsonData` keys from the options type and placeholders for every value the reader must supply:

```yaml
apiVersion: 1

datasources:
  - name: {{{pluginName}}}
    type: {{pluginId}}
    jsonData: {}
    secureJsonData: {}
```

Follow it with a table of the keys it uses and what each one sets. Include `url`, `user` or other top-level fields only if the plugin reads them.
-->

### Provision with Terraform

You can provision the data source with the [Grafana Terraform provider](https://registry.terraform.io/providers/grafana/grafana/latest/docs/resources/data_source) using the `grafana_data_source` resource.

<!-- section-brief
Fill this in: A Terraform example with `type = "{{pluginId}}"` that sets the same values as the YAML example. Pass `jsonData` through `json_data_encoded` and `secureJsonData` through `secure_json_data_encoded`, both wrapped in `jsonencode()`.
-->
