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
    // Example migration entry (DO NOT UNCOMMENT!)
    // 'example-migration': {
    //   version: '5.13.0',
    //   description: 'Update build command to use webpack profile flag.',
    //   migrationScript: './scripts/example-migration.js',
    // },
    '001-update-grafana-compose-extend': {
      version: '5.19.2',
      description: 'Update ./docker-compose.yaml to extend from ./.config/docker-compose-base.yaml.',
      migrationScript: './scripts/001-update-grafana-compose-extend.js',
    },
    '002-update-is-compatible-workflow': {
      version: '5.24.0',
      description:
        'Update ./.github/workflows/is-compatible.yml to use is-compatible github action instead of calling levitate directly',
      migrationScript: './scripts/002-update-is-compatible-workflow.js',
    },
    '003-update-eslint-deprecation-rule': {
      version: '5.24.1',
      description: 'Replace deprecated eslint-plugin-deprecation with @typescript-eslint/no-deprecated rule.',
      migrationScript: './scripts/003-update-eslint-deprecation-rule.js',
    },
    '004-eslint9-flat-config': {
      version: '5.25.4',
      description: 'Migrate eslint config to flat config format and update devDependencies to latest versions.',
      migrationScript: './scripts/004-eslint9-flat-config.js',
    },
  },
} as Migrations;
