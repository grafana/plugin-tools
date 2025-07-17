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

* Basic knowledge of Grafana panel plugin development
* Basic understanding of the [i18next internationalization framework](https://www.i18next.com/)

## Overview of the files affected by translation

If you create your plugin running the `create-plugin` scaffolding tool you'll get the following folder layout and key file:

```
myorg-myplugin-plugintype/
├── pkg/
│   ├── main.go
│   └── plugin/
├── src/
│   ├── module.ts
│   ├── plugin.json
└── tests/
├── CHANGELOG.md
├── docker-compose.yaml
├── go.mod
├── package.json
├── LICENSE
├── Magefile.go
├── README.md
```

:::note

Since `create-plugin` is constantly being improved your folder structure could look slightly different.

:::

Enabling plugin translation involves updating the following files:

- `docker-compose.yaml` 
- `plugin.json`
- `module.ts`
- `webpack.config.ts`

## Set up your plugin for translation

Follow these steps to update your plugin and set it up for translation:

### Enable translation in your Grafana instance 

To translate your plugin you need to enable the feature toggle `localizationForPlugins` on your Grafana instance.

To do so, update `docker-compose.yaml` in your plugin:

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

Set up the translation languages for your plugin. 

To do so, insert a `languages` section into the `plugin.json` file of the plugin. For example, if you want to add US English and Brazilian Portuguese:

```json title="plugin.json"
"dependencies": {
    "grafanaDependency": ">=11.0.0", // @grafana/i18n works from version 11.0.0 and higher for en-US translations 
    "plugins": []
  }
"languages": ["en-US", "pt-BR"] // the languages that the plugin supports
```

### Extend your plugin configuration to include translation

Add the latest version of the `@grafana/i18n` translation package:

```shell npm2yarn
npm install @grafana/i18n@latest
```

Next, mark `i18next` as an external in your Webpack configuration. See how in [Extend default configurations](https://grafana.com/developers/plugin-tools/how-to-guides/extend-configurations).

```ts title="webpack.config.ts"
const config = async (env: Record<string, unknown>): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  const externals = baseConfig.externals as string[];

  return merge(baseConfig, { externals: [...externals, 'i18next'] });
};
```

### Include translation in `module.ts` 

Add plugin translation to `module.ts`: 

```ts title="module.ts"
import { initPluginTranslations } from '@grafana/i18n';
import pluginJson from 'plugin.json';

await initPluginTranslations(pluginJson.id);
```

## Determine the text to translate

After you've configured your plugin for translation you can proceed to mark up the language strings you want to translate. Each translatable string is assigned an unique key that ends up in each translation file under `locales/<locale>/<plugin id>.json`. 

For example:

```tsx title="ColorEditor.tsx"
import { t } from '@grafana/i18n';

export function ColorEditor(props: any) {
  const styles = getStyles(config.theme);
  const defaultValue = t('colorEditor.defaultValue', 'Pick Color');
  let prefix: React.ReactNode = null;
  let suffix: React.ReactNode = null;
  if (props.value) {
    suffix = <Icon className={styles.trashIcon} name="trash-alt" onClick={() => props.onChange(undefined)} />;
  }

  prefix = (
    <div className={styles.inputPrefix}>
      <div className={styles.colorPicker}>
        <ColorPicker
          color={props.value || config.theme.colors.panelBg}
          onChange={props.onChange}
          enableNamedColors={true}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Input type="text" value={props.value || defaultValue} prefix={prefix} suffix={suffix} readOnly={true} />
    </div>
  );
}  
```

## Extract marked up tags automatically

Use the `i18next` [parser](https://github.com/i18next/i18next-parser#readme) to sweep all input files, extract tagged `i18n` keys, and save the translations. 

To do so, install the parser:

```shell npm2yarn
npm install i18next-parser
```

Next, configure the parser to sweep your plugin and extract the translations into the `locales/[$LOCALE]/[your-plugin].json`:

```cjs title="i18next-parser.config.csj"
module.exports = {
  locales: ['en-US'], // Only en-US  is updated - Crowdin will PR with other languages
  sort: true,
  createOldCatalogs: false,
  failOnWarnings: true,
  verbose: false,
  resetDefaultValueLocale: 'en-US', // Updates extracted values when they change in code

  defaultNamespace: 'grafana-clock-panel',
  input: ['../**/*.{tsx,ts}'],
  output: 'src/locales/$LOCALE/$NAMESPACE.json',
};
```

## Test the translated plugin 

To test the plugin follow the steps in [Set up your development environment](https://grafana.com/developers/plugin-tools/get-started/set-up-development-environment#docker-development-environment).

## Monitor your plugin 

If you want to see queues or warnings in your development environment use [ESlint](https://github.com/eslint/eslint).

To do so, go to the `eslint.config.msj` file and make the following updates:

- Import the ESlint plugin

```msj
import grafanaI18nPlugin from '@grafana/i18n/eslint-plugin';
```

- Add the error rules for translation

```msj
plugins: {
  '@grafana/i18n': grafanaI18nPlugin,
},
files: ['src/**/*.{ts,tsx,js,jsx}'],
rules: {
  '@grafana/i18n/no-untranslated-strings': 'error',
  '@grafana/i18n/no-translation-top-level': 'error',
},
```