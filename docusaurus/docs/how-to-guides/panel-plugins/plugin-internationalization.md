---
id: plugin-internationalization
title: How to add translations to your plugin
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

# How to add translations to your plugin

The Grafana UI is available in [several languages](https://grafana.com/docs/grafana/latest/administration/organization-preferences/#change-grafana-language). By default, plugins are available in English only and are not translated when you change your language settings. 

Grafana uses the [i18next internationalization framework](https://www.i18next.com/) for translation purposes. If you want your plugin to be translatable to other languages you need to perform the changes described in this document.  

## Before you begin

:::info
Available in Grafana >=v11.0.0 (US English) and Grafana >=v12.1.0 for the rest of languages.
:::

The following is recommended:

* Basic knowledge of Grafana plugin development
* Basic understanding of the [`t` function](https://www.i18next.com/overview/api#t)
* Basic understanding of the [`Trans` component](https://react.i18next.com/latest/trans-component)

## Overview of the files affected by translation

If you create your plugin running the `create-plugin` scaffolding tool, enabling plugin translation involves updating the following files:

- `docker-compose.yaml` 
- `plugin.json`
- `module.ts`
- `webpack.config.ts`
- `package.json`

By the end of the translation process you'll have a file structure like this:

```
myorg-myplugin-plugintype/
├── pkg/
│   ├── main.go
│   └── plugin/
├── src/
│   ├── locales
│      ├── en-US
│         └──myorg-myplugin-plugintype.json 
│      ├── pt-BR
│         └──--.json 
│   ├── module.ts
│   ├── plugin.json
└── tests/
├── docker-compose.yaml
├── webconfig.ts
├── package.json
```

## Set up your plugin for translation

Follow these steps to update your plugin and set it up for translation. While this example is based on a panel plugin, the process is the same for data source and app plugins.

### Enable translation in your Grafana instance 

To translate your plugin you need to enable the feature toggle `localizationForPlugins` in your Grafana instance.

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

Set up the translation languages for your plugin and the Grafana dependencies for translation. Remember that translation is available in Grafana >=v11.0.0 (US English) and Grafana >=v12.1.0 for the rest of languages.

To do so, add the relevant `grafanaDependency` and `languages` you want to translate to in the `plugin.json` file. For example, if you want to add US English and Brazilian Portuguese:

```json title="plugin.json"
"dependencies": {
    "grafanaDependency": ">=12.1.0", // @grafana/i18n works from version 11.0.0 and higher for en-US translations 
    "plugins": []
  },
"languages": ["en-US", "pt-BR"] // the languages that the plugin supports
```

### Extend your plugin configuration to include translation

Install the latest version of the `@grafana/i18n` translation package:

```shell npm2yarn
npm install @grafana/i18n@latest
```

Next, mark `i18next` as an external in your Webpack configuration. See how in [Extend default configurations](https://grafana.com/developers/plugin-tools/how-to-guides/extend-configurations).

```ts title="webpack.config.ts"
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig, { Env } from './.config/webpack/webpack.config';

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  const externals = baseConfig.externals as string[];
  return merge(baseConfig, { externals: [...externals, 'i18next'] });
};

:::caution
Remember to change the path to `webpack.config.ts` in `package.json`.
:::

export default config;
```

### Initialize translations in `module.ts` 

Add plugin translation to `module.ts`: 

```ts title="module.ts"
import { initPluginTranslations } from '@grafana/i18n';
import pluginJson from 'plugin.json';

await initPluginTranslations(pluginJson.id);
```

## Determine the text to translate

After you've configured your plugin for translation you can proceed to mark up the language strings you want to translate. Each translatable string is assigned an unique key that ends up in each translation file under `locales/<locale>/<plugin id>.json`. 
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

Example using the `Trans` component:
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
+            <Trans i18nKey="components.simpePanel.options.showSeriesCount">
+              Number of series: {{ numberOfSeries: data.series.length }}
+            </Trans>
+          </div>
         )}
-        <div>Text option value: {options.text}</div>
+        <Trans i18nKey="components.simpePanel.options.textOptionValue">
+          Text option value: {{ optionValue: options.text }}
+        </Trans>
       </div>
     </div>
   );
```

## Obtain the translated text

Use the `i18next` [parser](https://github.com/i18next/i18next-parser#readme) and [exta] to sweep all input files, extract tagged `i18n` keys, and save the translations. 

### Parse for translations

Install the `i18next` parser:

```shell npm2yarn
npm install i18next-parser
```

Next, create a configuration file `src/locales/i18next-parser.config.js` and configure it so the parser sweeps your plugin and extracts the translations into the `locales/[$LOCALE]/[your-plugin].json`:

:::danger
The path `locales/[$LOCALE]/[your-plugin-id].json` is mandatory. If you modify it translations won't work.
:::

```js title="i18next-parser.config.js"
const pluginJson = require('../plugin.json');

module.exports = {
  locales: ['en-US'], // Only en-US  is updated - Crowdin will PR with other languages
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

To test the plugin follow the steps in [Set up your development environment](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment#docker-development-environment).

