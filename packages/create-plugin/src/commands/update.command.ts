import minimist from 'minimist';
import { gte, lt } from 'semver';
import { isGitDirectory, isGitDirectoryClean } from '../utils/utils.git.js';
import { getConfig } from '../utils/utils.config.js';
import { output } from '../utils/utils.console.js';
import { isPluginDirectory } from '../utils/utils.plugin.js';
import { getPackageManagerExecCmd, getPackageManagerWithFallback } from '../utils/utils.packageManager.js';
import { LEGACY_UPDATE_CUTOFF_VERSION } from '../constants.js';
import { spawnSync } from 'node:child_process';
import { getMigrationsToRun, runMigrations } from '../migrations/manager.js';
import { CURRENT_APP_VERSION } from '../utils/utils.version.js';

export const update = async (argv: minimist.ParsedArgs) => {
  performPreUpdateChecks(argv);
  const { version } = getConfig();

  if (lt(version, LEGACY_UPDATE_CUTOFF_VERSION)) {
    preparePluginForMigrations(argv);
  }

  try {
    if (gte(version, CURRENT_APP_VERSION)) {
      output.log({
        title: 'Nothing to update, exiting.',
      });

      process.exit(0);
    }

    const commitEachMigration = argv.commit;
    const migrations = getMigrationsToRun(version, CURRENT_APP_VERSION);
    await runMigrations(migrations, { commitEachMigration });
    output.success({
      title: `Successfully updated create-plugin from ${version} to ${CURRENT_APP_VERSION}.`,
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

async function performPreUpdateChecks(argv: minimist.ParsedArgs) {
  if (!(await isGitDirectory()) && !argv.force) {
    output.error({
      title: 'You are not inside a git directory',
      body: [
        `In order to proceed please run ${output.formatCode('git init')} in the root of your project and commit your changes.`,
        `(This check is necessary to make sure that the updates are easy to revert and don't interfere with any changes you currently have.`,
        `In case you want to proceed as is please use the ${output.formatCode('--force')} flag.)`,
      ],
    });

    process.exit(1);
  }

  if (!(await isGitDirectoryClean()) && !argv.force) {
    output.error({
      title: 'Please clean your repository working tree before updating.',
      body: [
        'Commit your changes or stash them.',
        `(This check is necessary to make sure that the updates are easy to revert and don't mess with any changes you currently have.`,
        `In case you want to proceed as is please use the ${output.formatCode('--force')} flag.)`,
      ],
    });

    process.exit(1);
  }

  if (!isPluginDirectory() && !argv.force) {
    output.error({
      title: 'Are you inside a plugin directory?',
      body: [
        `We couldn't find a "src/plugin.json" file under your current directory.`,
        `(Please make sure to run this command from the root of your plugin folder. In case you want to proceed as is please use the ${output.formatCode(
          '--force'
        )} flag.)`,
      ],
    });

    process.exit(1);
  }
}

function preparePluginForMigrations(argv: minimist.ParsedArgs) {
  const { packageManagerName, packageManagerVersion } = getPackageManagerWithFallback();
  const packageManagerExecCmd = getPackageManagerExecCmd(packageManagerName, packageManagerVersion);

  const updateCmdList = [
    `${packageManagerExecCmd}@${LEGACY_UPDATE_CUTOFF_VERSION} update`,
    `${packageManagerName} install`,
  ];
  const gitCmdList = [
    'git add -A',
    `git commit -m 'chore: run create-plugin@${LEGACY_UPDATE_CUTOFF_VERSION} update' --no-verify`,
  ];

  try {
    output.warning({
      title: `Update to create-plugin ${LEGACY_UPDATE_CUTOFF_VERSION} required.`,
      body: ['Running additional commands before updating your plugin to create-plugin v6+.'],
    });

    for (const cmd of updateCmdList) {
      output.log({
        title: `Running ${output.formatCode(cmd)}`,
      });
      spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: process.cwd() });
    }

    if (argv.commit) {
      for (const cmd of gitCmdList) {
        output.log({
          title: `Running ${output.formatCode(cmd)}`,
        });
        spawnSync(cmd, { shell: true, cwd: process.cwd() });
      }
    }
  } catch (error) {
    output.error({
      title: `Update to create-plugin ${LEGACY_UPDATE_CUTOFF_VERSION} failed.`,
      body: [
        'Please run the following commands manually and try again.',
        ...updateCmdList,
        ...(argv.commit ? gitCmdList : []),
        'error:',
        error instanceof Error ? error.message : String(error),
      ],
    });
    process.exit(1);
  }
}
