import { LEGACY_UPDATE_CUTOFF_VERSION } from '../constants.js';

export type MigrationMeta = {
  version: string;
  description: string;
  migrationScript: string;
};

type Migrations = {
  migrations: Record<string, MigrationMeta>;
};

// Do not use LEGACY_UPDATE_CUTOFF_VERSION for new migrations. It was used to force migrations to run
// for those written before the switch to updates as migrations.
export default {
  migrations: {
    '001-update-grafana-compose-extend': {
      version: LEGACY_UPDATE_CUTOFF_VERSION,
      description: 'Update ./docker-compose.yaml to extend from ./.config/docker-compose-base.yaml.',
      migrationScript: './scripts/001-update-grafana-compose-extend.js',
    },
    '002-update-is-compatible-workflow': {
      version: LEGACY_UPDATE_CUTOFF_VERSION,
      description:
        'Update ./.github/workflows/is-compatible.yml to use is-compatible github action instead of calling levitate directly',
      migrationScript: './scripts/002-update-is-compatible-workflow.js',
    },
    '003-update-eslint-deprecation-rule': {
      version: LEGACY_UPDATE_CUTOFF_VERSION,
      description: 'Replace deprecated eslint-plugin-deprecation with @typescript-eslint/no-deprecated rule.',
      migrationScript: './scripts/003-update-eslint-deprecation-rule.js',
    },
    '004-eslint9-flat-config': {
      version: LEGACY_UPDATE_CUTOFF_VERSION,
      description: 'Migrate eslint config to flat config format and update devDependencies to latest versions.',
      migrationScript: './scripts/004-eslint9-flat-config.js',
    },
    '005-react-18-3': {
      version: '6.1.9',
      description: 'Update React and ReactDOM 18.x versions to ^18.3.0 to surface React 19 compatibility issues.',
      migrationScript: './scripts/005-react-18-3.js',
    },
    '006-webpack-nested-fix': {
      version: '6.1.11',
      description: 'Fix webpack variable replacement in nested plugins files.',
      migrationScript: './scripts/006-webpack-nested-fix.js',
    },
    '007-remove-testing-library-types': {
      version: '6.1.13',
      description:
        'Add setupTests.d.ts for @testing-library/jest-dom types and remove @types/testing-library__jest-dom npm package.',
      migrationScript: './scripts/007-remove-testing-library-types.js',
    },
  },
} as Migrations;
