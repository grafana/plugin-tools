---
id: plugin-internationalization-grafana-11
title: Translate your plugin before Grafana 12.1.0
description: Translate your plugin before Grafana 12.1.0
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
This is for plugins that need to support Grafana versions >= 11.0.0 and use translations. If your plugin only needs to support Grafana 12.1.0 and later, then follow the steps in [Translate your plugin](plugin-internationalization) instead. If you're using older versions of Grafana, the plugin will not work.
:::

## Overview of the files affected by translation

If you create your plugin running the `create-plugin` scaffolding tool, enabling plugin translation involves updating the following files:

- `docker-compose.yaml`
- `plugin.json`
- `module.ts`
- `loadResources.ts`
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
│   ├── loadResources.ts
│   └── plugin.json
├── tests/
├── docker-compose.yaml
├── eslint.config.mjs
└── package.json
```

## Set up your plugin for translation

Follow these steps to update your plugin and set it up for translation.

### Make Grafana 11.0.0 your default image version

To do so, update `docker-compose.yaml` in your plugin with the correct `grafana_version`:

```yaml title="docker-compose.yaml"
services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    build:
      args:
        grafana_version: ${GRAFANA_VERSION:-11.0.0}
```

### Define the languages and Grafana dependencies

Set up the translation languages for your plugin and the Grafana dependencies for translation.

To do so, add the relevant `grafanaDependency` and `languages` you want to translate to in the `plugin.json` file. For example, if you want to add English (US) and Spanish (Spain):

```json title="plugin.json"
"dependencies": {
    "grafanaDependency": ">=11.0.0",
    "plugins": []
  },
"languages": ["en-US", "es-ES"] // the languages that the plugin supports
```

### Update to the latest version of `create-plugin`

Update your `create-plugin` configs to the latest version using the following command:

```shell npm2yarn
npx @grafana/create-plugin@latest update
```

### Update `semver` to a regular dependency

Update the semver package to enable version-based behavior toggling:

```shell npm2yarn
npm uninstall semver
npm install --save semver
npm install --save-dev @types/semver
```

### Add `loadResources` file

To handle translation resource loading let's add `src/loadResources.ts`

```ts title="src/loadResources.ts"
import { LANGUAGES, ResourceLoader, Resources } from '@grafana/i18n';
import pluginJson from 'plugin.json';

const resources = LANGUAGES.reduce<Record<string, () => Promise<{ default: Resources }>>>((acc, lang) => {
  acc[lang.code] = async () => await import(`./locales/${lang.code}/${pluginJson.id}.json`);
  return acc;
}, {});

export const loadResources: ResourceLoader = async (resolvedLanguage: string) => {
  try {
    const translation = await resources[resolvedLanguage]();
    return translation.default;
  } catch (error) {
    // This makes sure that the plugin doesn't crash when the resolved language in Grafana isn't supported by the plugin
    console.error(`The plugin '${pluginJson.id}' doesn't support the language '${resolvedLanguage}'`, error);
    return {};
  }
};
```

### Initialize translations in `module.ts`

Add plugin translation and loaders logic to `module.ts`:

```ts title="module.ts"
import { initPluginTranslations } from '@grafana/i18n';
import pluginJson from 'plugin.json';
import { config } from '@grafana/runtime';
import semver from 'semver';
import { loadResources } from './loadResources';

// Before Grafana version 12.1.0 the plugin is responsible for loading translation resources
// In Grafana version 12.1.0 and later Grafana is responsible for loading translation resources
const loaders = semver.lt(config?.buildInfo?.version, '12.1.0') ? [loadResources] : [];

await initPluginTranslations(pluginJson.id, loaders);
```

<PluginInternationalizationShared />
