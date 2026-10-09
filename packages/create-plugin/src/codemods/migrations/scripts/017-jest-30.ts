import type { Context } from '../../context.js';
import { addDependenciesToPackageJson, readJsonFile } from '../../utils.js';

const JEST_30_DEPENDENCIES: Record<string, string> = {
  jest: '^30.5.0',
  'jest-environment-jsdom': '^30.5.0',
  '@types/jest': '^30.0.0',
};

// Jest 29 depends on micromatch, which pulls in braces. Jest 30 uses picomatch instead.
export default function migrate(context: Context) {
  if (!context.doesFileExist('package.json')) {
    return context;
  }

  const packageJson = readJsonFile(context, 'package.json');
  const installed = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Only bump the jest packages the plugin already has.
  const devDependencies = Object.fromEntries(
    Object.entries(JEST_30_DEPENDENCIES).filter(([name]) => Boolean(installed[name]))
  );

  addDependenciesToPackageJson(context, {}, devDependencies);

  return context;
}
