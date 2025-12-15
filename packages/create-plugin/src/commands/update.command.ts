import { getMigrationsToRun, runMigrations } from '../codemods/migrations/manager.js';
import {
  getPackageManagerExecCmd,
  getPackageManagerSilentInstallCmd,
  getPackageManagerWithFallback,
} from '../utils/utils.packageManager.js';
import { gte, lt } from 'semver';
import { performPreCodemodChecks } from '../utils/utils.checks.js';

import { CURRENT_APP_VERSION } from '../utils/utils.version.js';
import { LEGACY_UPDATE_CUTOFF_VERSION } from '../constants.js';
import { getConfig } from '../utils/utils.config.js';
import minimist from 'minimist';
import { output } from '../utils/utils.console.js';
import { spawnSync } from 'node:child_process';

export const update = async (argv: minimist.ParsedArgs) => {
  await performPreCodemodChecks(argv);
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

    const migrations = getMigrationsToRun(version, CURRENT_APP_VERSION);
    // filter out minimist internal properties (_ and $0) before passing to codemod
    const { _, $0, ...codemodOptions } = argv;
    await runMigrations(migrations, {
      commitEachMigration: !!argv.commit,
      codemodOptions,
    });
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

/**
 * Prepares a plugin for migrations by running the legacy update command and installing dependencies.
 * This is a one time operation that ensures the plugin configs are "as expected" by the new migration system.
 */
function preparePluginForMigrations(argv: minimist.ParsedArgs) {
  const { packageManagerName, packageManagerVersion } = getPackageManagerWithFallback();
  const packageManagerExecCmd = getPackageManagerExecCmd(packageManagerName, packageManagerVersion);
  const installCmd = getPackageManagerSilentInstallCmd(packageManagerName, packageManagerVersion);

  const updateCmdList = [
    `${packageManagerExecCmd}@${LEGACY_UPDATE_CUTOFF_VERSION} update${argv.force ? ' --force' : ''}`,
    installCmd,
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
      const spawn = spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: process.cwd() });
      if (spawn.status !== 0) {
        throw new Error(spawn.stderr.toString());
      }
    }

    if (argv.commit) {
      for (const cmd of gitCmdList) {
        output.log({
          title: `Running ${output.formatCode(cmd)}`,
        });
        const spawn = spawnSync(cmd, { shell: true, cwd: process.cwd() });
        if (spawn.status !== 0) {
          throw new Error(spawn.stderr.toString());
        }
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
