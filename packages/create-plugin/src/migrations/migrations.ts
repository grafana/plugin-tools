import { LEGACY_UPDATE_CUTOFF_VERSION } from '../constants.js';

export type MigrationMeta = {
  version: string;
  description: string;
  migrationScript: string;
};

type Migrations = {
  migrations: Record<string, MigrationMeta>;
};

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
    // Do not use LEGACY_UPDATE_CUTOFF_VERSION for new migrations. It is only used above to force migrations to run
    // for those written before the switch to updates as migrations.
  },
} as Migrations;
