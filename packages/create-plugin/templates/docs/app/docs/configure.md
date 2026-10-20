---
title: Configure
description: "Change the {{{yamlEscape pluginName}}} settings in Grafana or provision them as code."
keywords:
  - "{{{yamlEscape pluginName}}}"
  - app
  - configuration
  - provisioning
sidebar_position: 2
---

This document explains how to configure {{{pluginName}}} after you enable it.

## Before you begin

Before you configure the app, ensure you have:

- **Grafana permissions:** The `Organization administrator` role. Only organization administrators can configure apps.
- **The app enabled:** Follow [Enable the app](./index.md#enable-the-app).

## Open the configuration page

To open the {{{pluginName}}} configuration page:

1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.
1. Enter `{{{pluginName}}}` in the search bar.
1. Select **{{{pluginName}}}**.

<!-- section-brief
Fill this in: After the list above, add one sentence that names the tab to click, using the `title` of the page passed to `addConfigPage` in `src/module.ts(x)`, such as "Then click the **Configuration** tab." Keep it a sentence rather than another step of the list. If the app adds more than one config page, name each tab and what it holds.
-->

## Configure settings

<!-- section-brief
Fill this in: An H3 for each section of the config page, named and ordered as the page shows them, such as Connection, Authentication or Features. Under each H3, a table with this shape:

| Setting | Description | Required |
| ------- | ----------- | -------- |

Use the field labels from the config page, in bold. If the config page has no settings of its own, such as when it only turns the app on or off, say so in one sentence and document what its buttons do instead of a table. Find the settings in the components passed to `addConfigPage` and the settings type, including `jsonData` and `secureJsonData`. When a field's default matches none of the values it offers, such as a different case, give what the page actually does with it. In a description, say when a field only appears for some choice and when it affects another setting. Use a `> [!NOTE]` callout for a setting that's only available in Grafana Cloud or Grafana Enterprise.

End with the button that saves the settings and what the reader sees when it works.
-->

## Provision the app

You can provision {{{pluginName}}} as code with a Grafana provisioning file. For more information, refer to [Provision Grafana](https://grafana.com/docs/grafana/latest/administration/provisioning/#plugins).

<!-- section-brief
Fill this in: A YAML example with this shape, using the real `jsonData` and `secureJsonData` keys from the settings type and placeholders for every value the reader must supply, such as `<API_URL>`:

```yaml
apiVersion: 1

apps:
  - type: {{pluginId}}
    org_id: 1
    disabled: false
    jsonData: {}
    secureJsonData: {}
```

Follow it with a table of the keys it uses and what each one sets, and list each placeholder with what to replace it with. If `provisioning/plugins/` has a file for the app, base the example on it.
-->
