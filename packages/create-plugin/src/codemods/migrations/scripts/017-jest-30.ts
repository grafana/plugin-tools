import type { Context } from '../../context.js';
import { addDependenciesToPackageJson, readJsonFile } from '../../utils.js';
import { output } from '../../../utils/utils.console.js';

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

  const before = context.getFile('package.json');
  addDependenciesToPackageJson(context, {}, devDependencies);

  if (context.getFile('package.json') !== before) {
    output.warning({
      title: 'Jest was updated to v30',
      body: [
        'Jest 30 is a major release, so existing tests may need small fixes (jsdom 26, removed matcher aliases like `toBeCalled`).',
        'See https://jestjs.io/docs/upgrading-to-jest30 if `npm run test:ci` fails after the update.',
      ],
    });
  }

  return context;
}
