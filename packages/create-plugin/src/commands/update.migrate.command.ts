import minimist from 'minimist';
import { gte } from 'semver';
import { getMigrationsToRun, runMigrations } from '../migrations/manager.js';
import { getConfig } from '../utils/utils.config.js';
import { CURRENT_APP_VERSION } from '../utils/utils.version.js';
import { output } from '../utils/utils.console.js';

export const migrationUpdate = async (argv: minimist.ParsedArgs) => {
  try {
    const projectCpVersion = getConfig().version;
    const packageCpVersion = CURRENT_APP_VERSION;

    if (gte(projectCpVersion, packageCpVersion)) {
      output.log({
        title: 'Nothing to update, exiting.',
      });

      process.exit(0);
    }

    const commitEachMigration = argv.commit;
    const migrations = getMigrationsToRun(projectCpVersion, packageCpVersion);
    await runMigrations(migrations, { commitEachMigration });
    output.success({
      title: `Successfully updated create-plugin from ${projectCpVersion} to ${packageCpVersion}.`,
    });
  } catch (error) {
    if (error instanceof Error) {
      output.error({
        title: 'Update failed',
        body: [error.message],
      });
    }
    process.exit(1);
  }
};
