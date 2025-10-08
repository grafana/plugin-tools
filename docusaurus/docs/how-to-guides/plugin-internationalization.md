---
id: plugin-internationalization
title: Translate your plugin
description: Translate your plugins
keywords:
  - grafana
  - plugins
  - plugin
  - frontend
  - tooling
  - configuration
  - translation
  - localization
  - internationalization
  - webpack
---

import PluginInternationalizationShared from '@shared/plugin-internationalization-shared.md';

By default, plugins are available in English only and are not translated when you change your language settings in the [Grafana UI](https://grafana.com/docs/grafana/latest/administration/organization-preferences/#change-grafana-language).

If you want your plugin to be translatable to other languages you need to perform the changes described in this document. You can find the [list of available languages](https://github.com/grafana/grafana/blob/main/packages/grafana-i18n/src/constants.ts) in GitHub.

:::note
While this example is based on a panel plugin, the process is the same for data source and app plugins.
:::

## Before you begin

:::info
Translation is available starting from Grafana 12.1.0. If you're using Grafana 11.0.0 and later follow the steps in [Translate your plugin before Grafana 12.1.0](plugin-internationalization-grafana-11.md). If you're using older versions of Grafana the plugin will not work.
:::

The following is recommended:

- Basic knowledge of Grafana plugin development
- Basic understanding of the [`t` function](https://www.i18next.com/overview/api#t)
- Basic understanding of the [`Trans` component](https://react.i18next.com/latest/trans-component)

## Overview of the files affected by translation

If you create your plugin running the `create-plugin` scaffolding tool, enabling plugin translation involves updating the following files:

- `docker-compose.yaml`
- `plugin.json`
- `module.ts`
- `eslint.config.mjs`
- `package.json`

By the end of the translation process you'll have a file structure like this:

```
myorg-myplugin-plugintype/
├── src/
│   ├── locales
│   │  ├── en-US
│   │  │  └── myorg-myplugin-plugintype.json
│   │  └── es-ES
│   │     └── myorg-myplugin-plugintype.json
│   ├── module.ts
│   └── plugin.json
├── tests/
├── docker-compose.yaml
├── eslint.config.mjs
└── package.json
```

## Set up your plugin for translation

Follow these steps to update your plugin and set it up for translation.

### Enable translation in your Grafana instance (12.1.0 only)

To translate your plugin, you need to [enable the feature toggle](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/) `localizationForPlugins` in your Grafana instance.

To do so, update `docker-compose.yaml` in your plugin with the feature toggle `localizationForPlugins`:

```yaml title="docker-compose.yaml"
services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    environment:
      GF_FEATURE_TOGGLES_ENABLE: localizationForPlugins
```

### Define the languages and Grafana dependencies

Set up the translation languages for your plugin and the Grafana dependencies for translation.

To do so, add the relevant `grafanaDependency` and `languages` you want to translate to in the `plugin.json` file. For example, if you want to add English (US) and Spanish (Spain):

```json title="plugin.json"
"dependencies": {
    "grafanaDependency": ">=12.1.0", // @grafana/i18n works from version 11.0.0 and higher
    "plugins": []
  },
"languages": ["en-US", "es-ES"] // the languages that the plugin supports
```

### Update to the latest version of `create-plugin`

Update your `create-plugin` configs to the latest version using the following command:

```shell npm2yarn
npx @grafana/create-plugin@latest update
```

### Initialize translations in `module.ts`

Add plugin translation to `module.ts`:

```ts title="module.ts"
import { initPluginTranslations } from '@grafana/i18n';
import pluginJson from 'plugin.json';

await initPluginTranslations(pluginJson.id);
```

<PluginInternationalizationShared />
