import type { Context } from '../../context.js';
import { addDependenciesToPackageJson, removeDependenciesFromPackageJson } from '../../utils.js';

export default function migrate(context: Context) {
  if (context.doesFileExist('.config/.eslintrc') && context.doesFileExist('package.json')) {
    const eslintConfigRaw = context.getFile('.config/.eslintrc') || '';
    const [eslintComments, eslintConfigJSON] = splitEslintConfig(eslintConfigRaw);

    const eslintConfig = JSON.parse(eslintConfigJSON);

    const needsUpdate =
      eslintConfig.overrides &&
      eslintConfig.overrides.some((override: any) => override.rules?.['deprecation/deprecation']);

    if (needsUpdate) {
      eslintConfig.overrides = eslintConfig.overrides.map((override: any) => {
        if (override.files?.includes('src/**/*.{ts,tsx}')) {
          if (override.plugins) {
            override.plugins = override.plugins.filter((plugin: string) => plugin !== 'deprecation');
            if (override.plugins.length === 0) {
              delete override.plugins;
            }
          }

          if (override.rules) {
            delete override.rules['deprecation/deprecation'];
            override.rules['@typescript-eslint/no-deprecated'] = 'warn';
          }
        }
        return override;
      });

      const result = eslintComments.join('\n') + '\n' + JSON.stringify(eslintConfig, null, 2);
      context.updateFile('.config/.eslintrc', result);

      addDependenciesToPackageJson(context, {
        '@typescript-eslint/eslint-plugin': '^8.3.0',
        '@typescript-eslint/parser': '^8.3.0',
      });
      removeDependenciesFromPackageJson(context, [], ['eslint-plugin-deprecation']);
    } else {
      // no overrides use this plugin so remove it to clean up package.json
      removeDependenciesFromPackageJson(context, [], ['eslint-plugin-deprecation']);
    }
  }

  return context;
}

/**
 * Splits an ESLint configuration file into comments and JSON configuration
 * @param content The raw content of the ESLint configuration file
 * @returns A tuple containing [comments, config] where comments is an array of comment lines and config is the JSON configuration
 */
export function splitEslintConfig(content: string): [string[], any] {
  const [comments, config] = content.split('\n').reduce(
    (acc: [string[], string], line) => {
      if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('*/')) {
        acc[0].push(line);
      } else {
        acc[1] += line + '\n';
      }
      return acc;
    },
    [[], '']
  );

  return [comments, config];
}
