---
id: distribute-a-plugin
title: Distribute a plugin
sidebar_position: 1
---

To distribute a Grafana plugin either to the community or privately, the plugin must be signed so the Grafana application can verify its authenticity. You can do this with the `@grafana/sign-plugin` package.

:::info

It's not necessary to sign a plugin during development. The [Docker development environment](/plugin-tools/docs/get-started/set-up-development-environment) that is scaffolded with `@grafana/create-plugin` will load the plugin without a signature.

:::

## Initial steps

Before signing a plugin, read the Grafana [plugin publishing and signing criteria](https://grafana.com/docs/grafana/latest/developers/plugins/publishing-and-signing-criteria/) documentation carefully.

`@grafana/create-plugin` adds the necessary commands and github workflows for signing and distributing a plugin via the Grafana plugins catalog.

Before signing a plugin for the first time please consult the Grafana [plugin signature levels](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/#plugin-signature-levels) documentation to understand the differences between the types of signature level.

1. Create a [Grafana Cloud account](https://grafana.com/signup).
2. Make sure that the first part of the plugin ID matches the slug of your Grafana Cloud account.
   - _You can find the plugin ID in the plugin.json file inside your plugin directory. For example, if your account slug is `acmecorp`, you need to prefix the plugin ID with `acmecorp-`._
3. Create a Grafana Cloud API key with the `PluginPublisher` role.
4. Keep a record of this API key as it will be required for [signing a plugin](/plugin-tools/docs/publish-a-plugin/sign-a-plugin).
