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
    '002-update-eslint-deprecation-rule': {
      version: '5.22.2',
      description: 'Replace deprecated eslint-plugin-deprecation with @typescript-eslint/no-deprecated rule.',
      migrationScript: './scripts/002-update-eslint-deprecation-rule.js',
    },
  },
} as Migrations;
