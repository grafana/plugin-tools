---
id: plugin-internationalization-grafana-11
title: Translate your plugin before Grafana 12.1.0
description: TTranslate your plugin before Grafana 12.1.0
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

### Change `semver` to a regular dependency

Change the `semver` package so we can toggle behavior depending on the runtime version of Grafana:

```shell npm2yarn
npm uninstall --save-dev semver
```

```shell npm2yarn
npm install --save semver
```

### Add `loadResources` file

To handle translation resource loading lets add `src/loadResources.ts`

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
import { loadResources } from 'loadResources';

// Before Grafana version 12.1.0 the plugin is responsible for loading translation resources
// In Grafana version 12.1.0 and later Grafana is responsible for loading translation resources
const loaders = semver.lt(config?.buildInfo?.version, '12.1.0') ? [loadResources] : [];

await initPluginTranslations(pluginJson.id, loaders);
```

## Determine the text to translate

After you've configured your plugin for translation you can proceed to mark up the language strings you want to translate. Each translatable string is assigned a unique key that ends up in each translation file under `locales/<locale>/<plugin id>.json`.
Example using the `t` function:

```diff
export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOption
   return builder
     .addTextInput({
       path: 'text',
-      name: 'Simple text option',
-      description: 'Description of panel option',
-      defaultValue: 'Default value of text input option',
+      name: t('panel.options.text.name', 'Simple text option'),
+      description: t('panel.options.text.description', 'Description of panel option'),
+      defaultValue: t('panel.options.text.defaultValue', 'Default value of text input option'),
     })
     .addBooleanSwitch({
       path: 'showSeriesCount',
-      name: 'Show series counter',
+      name: t('panel.options.showSeriesCount.name', 'Show series counter'),
       defaultValue: false,
     })
     .addRadio({
       path: 'seriesCountSize',
       defaultValue: 'sm',
-      name: 'Series counter size',
+      name: t('panel.options.seriesCountSize.name', 'Series counter size'),
       settings: {
         options: [
           {
             value: 'sm',
-            label: 'Small',
+            label: t('panel.options.seriesCountSize.options.sm', 'Small'),
           },
           {
             value: 'md',
-            label: 'Medium',
+            label: t('panel.options.seriesCountSize.options.md', 'Medium'),
           },
           {
             value: 'lg',
-            label: 'Large',
+            label: t('panel.options.seriesCountSize.options.lg', 'Large'),
           },
         ],
       },
```

### Example using the `Trans` component:

```diff
 import { SimpleOptions } from 'types';
 import { css, cx } from '@emotion/css';
 import { useStyles2, useTheme2 } from '@grafana/ui';
 import { PanelDataErrorView } from '@grafana/runtime';
+import { Trans } from '@grafana/i18n';

 interface Props extends PanelProps<SimpleOptions> {}

@@ -60,9 +61,15 @@ export const SimplePanel: React.FC<Props> = ({ options, data, width, height, fie

       <div className={styles.textBox}>
         {options.showSeriesCount && (
-          <div data-testid="simple-panel-series-counter">Number of series: {data.series.length}</div>
+          <div data-testid="simple-panel-series-counter">
+            <Trans i18nKey="components.simplePanel.options.showSeriesCount">
+              Number of series: {{ numberOfSeries: data.series.length }}
+            </Trans>
+          </div>
         )}
-        <div>Text option value: {options.text}</div>
+        <Trans i18nKey="components.simplePanel.options.textOptionValue">
+          Text option value: {{ optionValue: options.text }}
+        </Trans>
       </div>
     </div>
   );
```

## Obtain the translated text

Use the `i18next` [parser](https://github.com/i18next/i18next-parser#readme) and `i18n-extract` to sweep all input files, extract tagged `i18n` keys, and save the translations.

### Parse for translations

Install the `i18next` parser:

```shell npm2yarn
npm install i18next-parser
```

Next, create a configuration file `src/locales/i18next-parser.config.js` and configure it so the parser sweeps your plugin and extracts the translations into the `locales/[$LOCALE]/[your-plugin].json`:

:::warning
The path `locales/[$LOCALE]/[your-plugin-id].json` is mandatory. If you modify it translations won't work.
:::

```js title="i18next-parser.config.js"
const pluginJson = require('../plugin.json');

module.exports = {
  locales: ['en-US', 'es-ES'], // An array of the locales your plugin supports
  sort: true,
  createOldCatalogs: false,
  failOnWarnings: true,
  verbose: false,
  resetDefaultValueLocale: 'en-US', // Updates extracted values when they change in code
  defaultNamespace: pluginJson.id,
  input: ['../**/*.{tsx,ts}'],
  output: 'src/locales/$LOCALE/$NAMESPACE.json',
};
```

### Obtain your translation file

Add the translation script `i18n-extract` to `package.json`:

```json title="package.json"
  "scripts": {
    "i18n-extract": "i18next --config src/locales/i18next-parser.config.js",
  },
```

Run the script to translate the files:

```shell npm2yarn
npm run i18n-extract
```

The translation file will look similar to this:

```
{
  "components": {
    "simplePanel": {
      "options": {
        "showSeriesCount": "Number of series: {{numberOfSeries}}",
        "textOptionValue": "Text option value: {{optionValue}}"
      }
    }
  },
  "panel": {
    "options": {
      "seriesCountSize": {
        "name": "Series counter size",
        "options": {
          "lg": "Large",
          "md": "Medium",
          "sm": "Small"
        }
      },
      "showSeriesCount": {
        "name": "Show series counter"
      },
      "text": {
        "defaultValue": "Default value of text input option",
        "description": "Description of panel option",
        "name": "Simple text option"
      }
    }
  }
}
```

## Test the translated plugin

To test the plugin follow the steps in [Set up your development environment](../set-up/) to run your plugin locally.

You can then verify your plugin is displaying the appropriate text as you [change the language](https://grafana.com/docs/grafana/latest/administration/organization-preferences/#change-grafana-language).
