---
id: publish-a-plugin
title: Publish a plugin
sidebar_position: 210
---

# Publish or sign a plugin

To publish a Grafana plugin either to the community or privately, you should be familiar with the steps for packaging, distributing, and signing plugins. 

This section contains topics related to publishing and signing Grafana plugins.

- [Package a plugin](./package-a-plugin)
- [Publishing and signing criteria](./publishing-and-signing-criteria)
- [Publish or update a plugin](./publish-or-update-a-plugin)
- [Sign a plugin](./sign-a-plugin)
## Publish with `create-plugin` 

`@grafana/create-plugin` adds the necessary commands and github workflows for signing and distributing a plugin via the Grafana plugins catalog.

Before signing a plugin for the first time, consult the Grafana [plugin signature levels](./sign-a-plugin/#plugin-signature-levels) documentation to understand the differences between the types of signature level.

1. Create a [Grafana Cloud account](https://grafana.com/signup).
2. Make sure that the first part of the plugin ID matches the slug of your Grafana Cloud account.
   - _You can find the plugin ID in the plugin.json file inside your plugin directory. For example, if your account slug is `acmecorp`, you need to prefix the plugin ID with `acmecorp-`._
3. Create a Grafana Cloud API key with the `PluginPublisher` role.
4. Keep a record of this API key as it will be required for [signing a plugin](signing-your-plugin.md).