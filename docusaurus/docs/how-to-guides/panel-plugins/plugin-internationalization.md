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

The plugin translation feature requires Grafana version 10.2.0 or later for US English translations, and Grafana version 12.1.0 for the rest of translations.

The following is recommended:

* Basic knowledge of Grafana panel plugin development
* Basic understanding of the [i18next internationalization framework](https://www.i18next.com/)

## Example: Translate the plugin

### Set up your plugin for translation

#### Enable translation in your Grafana instance 

To translate your plugin you need to enable the feature toggle `localizationForPlugins` on your Grafana instance.

To do so, update `docker-compose.yaml` in your plugin:

```yaml title="docker-compose.yaml"
services:
  grafana:
    container_name: 'grafana-clock-panel'
    platform: 'linux/amd64'
    build:
      context: ./.config
      args:
        grafana_image: ${GRAFANA_IMAGE:-grafana-enterprise}
        grafana_version: ${GRAFANA_VERSION:-12.0.0}
        development: ${DEVELOPMENT:-false}
    ports:
      - 3000:3000/tcp
    volumes:
      - ./dist:/var/lib/grafana/plugins/grafana-clock-panel
      - ./provisioning:/etc/grafana/provisioning
    environment:
      NODE_ENV: development
      GF_FEATURE_TOGGLES_ENABLE: localizationForPlugins
```

#### Define the languages and Grafana dependencies

Set up the translation languages for your plugin. 

To do so, insert a `languages` section into the `plugin.json` file of the plugin. For example, if you want to add US English and Brazilian Portuguese:

```json title="plugin.json"
"dependencies": {
    "grafanaDependency": ">=11.0.0", // @grafana/i18n works from version 11.0.0 and higher for en-US translations 
    "plugins": []
  }
"languages": ["en-US", "pt-BR"] // the languages that the plugin supports
```

#### Extend your plugin configuration to include translation

Add the latest version of the `@grafana/i18n` translation package:

```shell npm2yarn
yarn add @grafana/i18n@latest

Next, mark `i18next` as an external in your webpack configuration:

```ts
const config = async (env: Record<string, unknown>): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  const externals = baseConfig.externals as string[];

  return merge(baseConfig, { externals: [...externals, 'i18next'] });
};
```

To learn more about how to modify default configurations see [Extend default configurations](https://grafana.com/developers/plugin-tools/how-to-guides/extend-configurations).

#### Include translation in `module.ts` 

Add plugin translation to `module.ts`: 

```ts
import { initPluginTranslations } from '@grafana/i18n';
import pluginJson from 'plugin.json';

await initPluginTranslations(pluginJson.id);
```

### Determine the text to translate

After you've configured your plugin for translation you can proceed to “mark” up the language strings you want to translate. Each translatable string is assigned an unique key that ends up in each translation file under `locales/<locale>/<plugin id>.json`. 

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

You can aslo modify `options.ts` and `RenderTime.tsx`.

### Extract marked up tags automatically

Use the `i18next` [parser](https://github.com/i18next/i18next-parser#readme) to sweep all input files, extract tagged `i18n` keys, and write them into the `<plugin id>.json` output file, located under `locales/en-US`: 

```shell
yarn add @grafana/i18n@latest
```

Next, include `i18next` as an external in your webpack configuration:

```shell
yarn add -D i18next-parser
```

## Test the translated plugin 





