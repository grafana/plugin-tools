import type { Context } from '../context.js';

export default function migrate(context: Context): Context {
  // Check if .eslintrc exists
  if (context.doesFileExist('.eslintrc')) {
    const eslintConfig = JSON.parse(context.getFile('.eslintrc') || '{}');

    // Update the overrides section if it exists
    if (eslintConfig.overrides) {
      eslintConfig.overrides = eslintConfig.overrides.map((override: any) => {
        if (override.files?.includes('src/**/*.{ts,tsx}')) {
          // Remove deprecation plugin if it exists
          if (override.plugins) {
            override.plugins = override.plugins.filter((plugin: string) => plugin !== 'deprecation');
          }

          // Update rules
          if (override.rules) {
            // Remove old deprecation rule
            delete override.rules['deprecation/deprecation'];
            // Add new TypeScript ESLint rule
            override.rules['@typescript-eslint/no-deprecated'] = 'warn';
          }
        }
        return override;
      });
    }

    context.updateFile('.eslintrc', JSON.stringify(eslintConfig, null, 2));
  }

  // Update package.json to remove eslint-plugin-deprecation and update @typescript-eslint versions
  if (context.doesFileExist('package.json')) {
    const packageJson = JSON.parse(context.getFile('package.json') || '{}');

    if (packageJson.devDependencies) {
      // Remove eslint-plugin-deprecation
      delete packageJson.devDependencies['eslint-plugin-deprecation'];

      // Update @typescript-eslint versions
      packageJson.devDependencies['@typescript-eslint/eslint-plugin'] = '^8.3.0';
      packageJson.devDependencies['@typescript-eslint/parser'] = '^8.3.0';
    }

    context.updateFile('package.json', JSON.stringify(packageJson, null, 2));
  }

  return context;
}
