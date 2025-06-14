import type { Context } from '../context.js';

export default function migrate(context: Context): Context {
  if (context.doesFileExist('.config/.eslintrc')) {
    const eslintConfig = JSON.parse(context.getFile('.config/.eslintrc') || '{}');

    if (eslintConfig.overrides) {
      eslintConfig.overrides = eslintConfig.overrides.map((override: any) => {
        if (override.files?.includes('src/**/*.{ts,tsx}')) {
          if (override.plugins) {
            override.plugins = override.plugins.filter((plugin: string) => plugin !== 'deprecation');
          }

          if (override.rules) {
            delete override.rules['deprecation/deprecation'];
            override.rules['@typescript-eslint/no-deprecated'] = 'warn';
          }
        }
        return override;
      });
    }

    context.updateFile('.config/.eslintrc', JSON.stringify(eslintConfig, null, 2));
  }

  if (context.doesFileExist('package.json')) {
    const packageJson = JSON.parse(context.getFile('package.json') || '{}');

    if (packageJson.devDependencies) {
      delete packageJson.devDependencies['eslint-plugin-deprecation'];

      packageJson.devDependencies['@typescript-eslint/eslint-plugin'] = '^8.3.0';
      packageJson.devDependencies['@typescript-eslint/parser'] = '^8.3.0';
    }

    context.updateFile('package.json', JSON.stringify(packageJson, null, 2));
  }

  return context;
}
