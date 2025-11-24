import { coerce, gte } from 'semver';
import { parseDocument, stringify } from 'yaml';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';

export function updateDockerCompose(context: Context): void {
  if (!context.doesFileExist('docker-compose.yaml')) {
    additionsDebug('docker-compose.yaml not found, skipping');
    return;
  }

  const composeContent = context.getFile('docker-compose.yaml');
  if (!composeContent) {
    return;
  }

  try {
    const composeDoc = parseDocument(composeContent);
    const currentEnv = composeDoc.getIn(['services', 'grafana', 'environment']);

    if (!currentEnv) {
      additionsDebug('No environment section found in docker-compose.yaml, skipping');
      return;
    }

    // Check if the feature toggle is already set
    if (typeof currentEnv === 'object') {
      const envMap = currentEnv as any;
      const toggleValue = envMap.get('GF_FEATURE_TOGGLES_ENABLE');

      if (toggleValue) {
        const toggleStr = toggleValue.toString();
        if (toggleStr.includes('localizationForPlugins')) {
          additionsDebug('localizationForPlugins already in GF_FEATURE_TOGGLES_ENABLE');
          return;
        }
        // Append to existing feature toggles
        composeDoc.setIn(
          ['services', 'grafana', 'environment', 'GF_FEATURE_TOGGLES_ENABLE'],
          `${toggleStr},localizationForPlugins`
        );
      } else {
        // Set new feature toggle
        composeDoc.setIn(['services', 'grafana', 'environment', 'GF_FEATURE_TOGGLES_ENABLE'], 'localizationForPlugins');
      }

      context.updateFile('docker-compose.yaml', stringify(composeDoc));
      additionsDebug('Updated docker-compose.yaml with localizationForPlugins feature toggle');
    }
  } catch (error) {
    additionsDebug('Error updating docker-compose.yaml:', error);
  }
}

export function updatePluginJson(context: Context, locales: string[], needsBackwardCompatibility: boolean): void {
  if (!context.doesFileExist('src/plugin.json')) {
    additionsDebug('src/plugin.json not found, skipping');
    return;
  }

  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    return;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);

    // Merge locales with existing languages (defensive: avoid duplicates)
    const existingLanguages = Array.isArray(pluginJson.languages) ? pluginJson.languages : [];
    const mergedLanguages = [...new Set([...existingLanguages, ...locales])];
    pluginJson.languages = mergedLanguages;

    // Update grafanaDependency based on backward compatibility needs
    if (!pluginJson.dependencies) {
      pluginJson.dependencies = {};
    }

    const currentGrafanaDep = pluginJson.dependencies.grafanaDependency || '>=11.0.0';
    const targetVersion = needsBackwardCompatibility ? '11.0.0' : '12.1.0';
    const minVersion = coerce(targetVersion);
    const currentVersion = coerce(currentGrafanaDep.replace(/^[><=]+/, ''));

    if (!currentVersion || !minVersion || !gte(currentVersion, minVersion)) {
      pluginJson.dependencies.grafanaDependency = `>=${targetVersion}`;
      additionsDebug(`Updated grafanaDependency to >=${targetVersion}`);
    }

    context.updateFile('src/plugin.json', JSON.stringify(pluginJson, null, 2));
    additionsDebug('Updated src/plugin.json with languages:', locales);
  } catch (error) {
    additionsDebug('Error updating src/plugin.json:', error);
  }
}

export function createI18nextConfig(context: Context): void {
  // Defensive: skip if already exists
  if (context.doesFileExist('i18next.config.ts')) {
    additionsDebug('i18next.config.ts already exists, skipping');
    return;
  }

  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    additionsDebug('Cannot create i18next.config.ts without plugin.json');
    return;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);
    const pluginId = pluginJson.id;

    if (!pluginId) {
      additionsDebug('No plugin ID found in plugin.json');
      return;
    }

    const i18nextConfig = `import { defineConfig } from 'i18next-cli';
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
`;

    context.addFile('i18next.config.ts', i18nextConfig);
    additionsDebug('Created i18next.config.ts');
  } catch (error) {
    additionsDebug('Error creating i18next.config.ts:', error);
  }
}
