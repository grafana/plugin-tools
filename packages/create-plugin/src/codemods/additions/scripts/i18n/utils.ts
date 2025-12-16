import { coerce, gte } from 'semver';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';

/**
 * Checks if React version is >= 18
 * @throws Error if React < 18 (since @grafana/i18n requires React 18+)
 */
export function checkReactVersion(context: Context): void {
  const packageJsonRaw = context.getFile('package.json');
  if (!packageJsonRaw) {
    return;
  }

  try {
    const packageJson = JSON.parse(packageJsonRaw);
    const reactVersion =
      packageJson.dependencies?.react || packageJson.devDependencies?.react || packageJson.peerDependencies?.react;

    if (reactVersion) {
      const reactVersionStr = reactVersion.replace(/[^0-9.]/g, '');
      const reactVersionCoerced = coerce(reactVersionStr);

      if (reactVersionCoerced && !gte(reactVersionCoerced, '18.0.0')) {
        throw new Error(
          `@grafana/i18n requires React 18 or higher. Your plugin is using React ${reactVersion}.\n\n` +
            `Please upgrade to React 18+ to use i18n support.\n` +
            `Update your package.json to use "react": "^18.3.0" and "react-dom": "^18.3.0".`
        );
      }
    }
  } catch (error) {
    // If it's our version check error, re-throw it
    if (error instanceof Error && error.message.includes('@grafana/i18n requires React')) {
      throw error;
    }
    // Otherwise, just log and continue (can't determine React version)
    additionsDebug('Error checking React version:', error);
  }
}

export function checkNeedsBackwardCompatibility(context: Context): boolean {
  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    // Default to backward compat for safety when plugin.json is missing
    return true;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);
    const currentGrafanaDep = pluginJson.dependencies?.grafanaDependency;

    if (!currentGrafanaDep) {
      additionsDebug(
        'Warning: grafanaDependency is missing from plugin.json. Assuming backward compatibility mode is needed.'
      );
      return true;
    }

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
