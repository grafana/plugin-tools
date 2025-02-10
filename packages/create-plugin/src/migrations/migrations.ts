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
  },
} as Migrations;
