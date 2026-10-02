import { Codemod } from '../types.js';

export interface Addition extends Codemod {
  // 'repo' additions change shared config (for example .config/) and therefore apply to every plugin.
  // 'plugin' additions can target specific plugins in a monorepo with --plugin.
  scope: 'repo' | 'plugin';
  // Additions that have not been made monorepo-aware refuse to run in a plugin monorepo.
  supportsMonorepo: boolean;
}

export default [
  {
    name: 'example-addition',
    description: 'Adds an example addition to the plugin',
    scriptPath: import.meta.resolve('./scripts/example-addition.js'),
    scope: 'plugin',
    supportsMonorepo: true,
  },
  {
    name: 'externalize-jsx-runtime',
    description: 'Externalizes the react JSX runtime to help migrate plugins to React 19',
    scriptPath: import.meta.resolve('./scripts/externalize-jsx-runtime.js'),
    scope: 'repo',
    supportsMonorepo: true,
  },
  {
    name: 'experimental-app-sdk',
    description: 'Adds grafana-app-sdk CUE kind code generation to an app plugin',
    scriptPath: import.meta.resolve('./scripts/experimental-app-sdk.js'),
    scope: 'plugin',
    supportsMonorepo: false,
  },
] satisfies Addition[];
