import { coerce, gte } from 'semver';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';

export function checkNeedsBackwardCompatibility(context: Context): boolean {
  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    return false;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);
    const currentGrafanaDep = pluginJson.dependencies?.grafanaDependency || '>=11.0.0';
    const minVersion = coerce('12.1.0');
    const currentVersion = coerce(currentGrafanaDep.replace(/^[><=]+/, ''));

    // If current version is less than 12.1.0, we need backward compatibility
    if (currentVersion && minVersion && gte(currentVersion, minVersion)) {
      return false; // Already >= 12.1.0, no backward compat needed
    }
    return true; // < 12.1.0, needs backward compat
  } catch (error) {
    additionsDebug('Error checking backward compatibility:', error);
    return true; // Default to backward compat on error
  }
}

export function createLocaleFiles(context: Context, locales: string[]): void {
  // Get plugin ID from plugin.json
  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    additionsDebug('Cannot create locale files without plugin.json');
    return;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);
    const pluginId = pluginJson.id;

    if (!pluginId) {
      additionsDebug('No plugin ID found in plugin.json');
      return;
    }

    // Create locale files for each locale (defensive: only if not already present)
    for (const locale of locales) {
      const localePath = `src/locales/${locale}/${pluginId}.json`;

      if (!context.doesFileExist(localePath)) {
        context.addFile(localePath, JSON.stringify({}, null, 2));
        additionsDebug(`Created ${localePath}`);
      } else {
        additionsDebug(`${localePath} already exists, skipping`);
      }
    }
  } catch (error) {
    additionsDebug('Error creating locale files:', error);
  }
}
