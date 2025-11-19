import { LEGACY_UPDATE_CUTOFF_VERSION } from '../../constants.js';
import { Codemod } from '../types.js';

export interface Migration extends Codemod {
  version: string;
}

export default [
  {
    name: '001-update-grafana-compose-extend',
    version: LEGACY_UPDATE_CUTOFF_VERSION,
    description: 'Update ./docker-compose.yaml to extend from ./.config/docker-compose-base.yaml.',
    scriptPath: import.meta.resolve('./scripts/001-update-grafana-compose-extend.js'),
  },
  {
    name: '002-update-is-compatible-workflow',
    version: LEGACY_UPDATE_CUTOFF_VERSION,
    description:
      'Update ./.github/workflows/is-compatible.yml to use is-compatible github action instead of calling levitate directly',
    scriptPath: import.meta.resolve('./scripts/002-update-is-compatible-workflow.js'),
  },
  {
    name: '003-update-eslint-deprecation-rule',
    version: LEGACY_UPDATE_CUTOFF_VERSION,
    description: 'Replace deprecated eslint-plugin-deprecation with @typescript-eslint/no-deprecated rule.',
    scriptPath: import.meta.resolve('./scripts/003-update-eslint-deprecation-rule.js'),
  },
  {
    name: '004-eslint9-flat-config',
    version: LEGACY_UPDATE_CUTOFF_VERSION,
    description: 'Migrate eslint config to flat config format and update devDependencies to latest versions.',
    scriptPath: import.meta.resolve('./scripts/004-eslint9-flat-config.js'),
  },
  {
    name: '005-react-18-3',
    version: '6.1.9',
    description: 'Update React and ReactDOM 18.x versions to ^18.3.0 to surface React 19 compatibility issues.',
    scriptPath: import.meta.resolve('./scripts/005-react-18-3.js'),
  },
  {
    name: '006-webpack-nested-fix',
    version: '6.1.11',
    description: 'Fix webpack variable replacement in nested plugins files.',
    scriptPath: import.meta.resolve('./scripts/006-webpack-nested-fix.js'),
  },
  {
    name: '007-remove-testing-library-types',
    version: '6.1.13',
    description:
      'Add setupTests.d.ts for @testing-library/jest-dom types and remove @types/testing-library__jest-dom npm package.',
    scriptPath: import.meta.resolve('./scripts/007-remove-testing-library-types.js'),
  },
  // Do not use LEGACY_UPDATE_CUTOFF_VERSION for new migrations. It is only used above to force migrations to run
  // for those written before the switch to updates as migrations.
] satisfies Migration[];
