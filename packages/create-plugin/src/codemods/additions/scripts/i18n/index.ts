import * as v from 'valibot';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';
import { updateDockerCompose, updatePluginJson, createI18nextConfig, ensureI18nextExternal } from './config-updates.js';
import { addI18nInitialization, createLoadResourcesFile } from './code-generation.js';
import { updateEslintConfig, addI18nDependency, addSemverDependency, addI18nextCli } from './tooling.js';
import { checkNeedsBackwardCompatibility, createLocaleFiles, checkReactVersion } from './utils.js';

/**
 * I18n addition schema using Valibot
 * Adds internationalization support to a plugin
 */
export const schema = v.object(
  {
    locales: v.pipe(
      v.union([v.string(), v.array(v.string())]),
      v.transform((input) => {
        // Handle both string (from CLI) and array (from tests)
        return typeof input === 'string' ? input.split(',').map((s) => s.trim()) : input;
      }),
      v.array(
        v.pipe(
          v.string(),
          v.regex(/^[a-z]{2}-[A-Z]{2}$/, 'Locale must be in format xx-XX (e.g., en-US, es-ES, sv-SE)')
        ),
        'Please provide a comma-separated list of all supported locales, e.g., "en-US,es-ES,sv-SE"'
      ),
      v.minLength(1, 'Please provide a comma-separated list of all supported locales, e.g., "en-US,es-ES,sv-SE"')
    ),
  },
  'Please provide a comma-separated list of all supported locales, e.g., "en-US,es-ES,sv-SE"'
);

type I18nOptions = v.InferOutput<typeof schema>;

export default function i18nAddition(context: Context, options: I18nOptions): Context {
  const { locales } = options;

  additionsDebug('Adding i18n support with locales:', locales);

  // Check React version early - @grafana/i18n requires React 18+
  checkReactVersion(context);

  // Determine if we need backward compatibility (Grafana < 12.1.0)
  const needsBackwardCompatibility = checkNeedsBackwardCompatibility(context);
  additionsDebug('Needs backward compatibility:', needsBackwardCompatibility);

  // 1. Update docker-compose.yaml with feature toggle
  updateDockerCompose(context);

  // 2. Update plugin.json with languages and grafanaDependency
  updatePluginJson(context, locales, needsBackwardCompatibility);

  // 3. Create locale folders and files
  createLocaleFiles(context, locales);

  // 4. Add @grafana/i18n dependency
  addI18nDependency(context);

  // 5. Add semver dependency for backward compatibility
  if (needsBackwardCompatibility) {
    addSemverDependency(context);
  }

  // 6. Update eslint.config.mjs if needed
  updateEslintConfig(context);

  // 7. Add i18n initialization to module file
  addI18nInitialization(context, needsBackwardCompatibility);

  // 8. Create loadResources.ts for backward compatibility
  if (needsBackwardCompatibility) {
    createLoadResourcesFile(context);
  }

  // 9. Add i18next-cli as dev dependency and add script
  addI18nextCli(context);

  // 10. Create i18next.config.ts
  createI18nextConfig(context);

  // 11. Ensure i18next is in externals array
  try {
    ensureI18nextExternal(context);
  } catch (error) {
    additionsDebug(`Error ensuring i18next external: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Success message with next steps
  console.log('\n✅ i18n support has been successfully added to your plugin!\n');
  console.log('Next steps:');
  console.log('1. Follow the instructions to translate your source code:');
  console.log(
    '   https://grafana.com/developers/plugin-tools/how-to-guides/plugin-internationalization-grafana-11#determine-the-text-to-translate'
  );
  console.log('2. Run the i18n-extract script to scan your code for translatable strings:');
  console.log('   npm run i18n-extract  (or yarn/pnpm run i18n-extract)');
  console.log('3. Fill in your locale JSON files with translated strings\n');

  return context;
}
