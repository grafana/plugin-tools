import minimist from 'minimist';
import { gte } from 'semver';
import { getMigrationsToRun, runMigrations } from '../migrations/manager.js';
import { getConfig } from '../utils/utils.config.js';
import { getVersion } from '../utils/utils.version.js';
import { printHeader } from '../utils/utils.console.js';

export const migrationUpdate = async (argv: minimist.ParsedArgs) => {
  try {
    const projectCpVersion = getConfig().version;
    const packageCpVersion = getVersion();

    if (gte(projectCpVersion, packageCpVersion)) {
      console.warn('Nothing to update, exiting.');
      process.exit(0);
    }

    console.log(`Running migrations from ${projectCpVersion} to ${packageCpVersion}.`);

    const commitEachMigration = argv.commit;
    const migrations = getMigrationsToRun(projectCpVersion, packageCpVersion);
    await runMigrations(migrations, { commitEachMigration });
    printHeader('the update command completed successfully.');
    console.log('');
  } catch (error) {
    printHeader('the update command encountered an error.');
    console.log('');
    console.error(error);
    process.exit(1);
  }
};
