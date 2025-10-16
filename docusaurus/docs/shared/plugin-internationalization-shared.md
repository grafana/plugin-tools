## Determine the text to translate

After you've configured your plugin for translation, you can proceed to mark up the language strings you want to translate. Each translatable string is assigned a unique key that ends up in each translation file under `locales/<locale>/<plugin id>.json`.
The following example uses the `t` function:

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

Use the [`i18next-cli`](https://github.com/i18next/i18next-cli#readme) and `i18n-extract` to sweep all input files, extract tagged `i18n` keys, and save the translations.

### Parse for translations

Install the `i18next-cli`:

```shell npm2yarn
npm install --save-dev i18next-cli
```

Next, create a configuration file `i18next.config.ts` and configure it so the CLI sweeps your plugin and extracts the translations into the `src/locales/[$LOCALE]/[your-plugin].json`:

:::warning
The path `src/locales/[$LOCALE]/[your-plugin-id].json` is mandatory. If you modify it translations won't work.
:::

```ts title="i18next.config.ts"
import { defineConfig } from 'i18next-cli';
import pluginJson from './src/plugin.json';

export default defineConfig({
  locales: pluginJson.languages,
  extract: {
    input: ['src/**/*.{tsx,ts}'],
    output: 'src/locales/{{language}}/{{namespace}}.json',
    defaultNS: pluginJson.id,
    functions: ['t', '*.t'],
    transComponents: ['Trans'],
  },
});
```

### Obtain your translation file

Add the translation script `i18n-extract` to `package.json`:

```json title="package.json"
  "scripts": {
    "i18n-extract": "i18next-cli extract --sync-primary"
  },
```

Run the script to translate the files:

```shell npm2yarn
npm run i18n-extract
```

The translation file will look similar to this:

```json title="src/locales/en-US/[your-plugin-id].json"
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

## Configure ESLint rules for translations

Add the `@grafana/i18n` rules in `eslint.config.mjs`:

```js title="eslint.config.mjs"
/* existing imports */
import grafanaI18nPlugin from '@grafana/i18n/eslint-plugin';

export default defineConfig([
  /* existing config */
  {
    name: 'grafana/i18n-rules',
    plugins: { '@grafana/i18n': grafanaI18nPlugin },
    rules: {
      '@grafana/i18n/no-untranslated-strings': ['error', { calleesToIgnore: ['^css$', 'use[A-Z].*'] }],
      '@grafana/i18n/no-translation-top-level': 'error',
    },
  },
]);
```

You can find more detailed description of the rules [here](https://github.com/grafana/grafana/blob/main/packages/grafana-i18n/src/eslint/README.md).
