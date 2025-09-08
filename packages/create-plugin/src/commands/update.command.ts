import minimist from 'minimist';
import { lt } from 'semver';
import { migrationUpdate } from './update.migrate.command.js';
import { gitCommitNoVerify, isGitDirectory, isGitDirectoryClean } from '../utils/utils.git.js';
import { getConfig } from '../utils/utils.config.js';
import { output } from '../utils/utils.console.js';
import { isPluginDirectory } from '../utils/utils.plugin.js';
import { getPackageManagerExecCmd, getPackageManagerWithFallback } from '../utils/utils.packageManager.js';
import { BASELINE_VERSION_FOR_MIGRATIONS } from '../constants.js';
import { exec } from 'node:child_process';

export const update = async (argv: minimist.ParsedArgs) => {
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

  const config = getConfig();

  if (lt(config.version, BASELINE_VERSION_FOR_MIGRATIONS)) {
    const { packageManagerName, packageManagerVersion } = getPackageManagerWithFallback();
    const packageManagerExecCmd = getPackageManagerExecCmd(packageManagerName, packageManagerVersion);

    try {
      output.warning({
        title: `Update to create-plugin ${BASELINE_VERSION_FOR_MIGRATIONS} required.`,
        body: [
          `The following commands will be run before updating your plugin to create-plugin v6+.`,

          `${output.formatCode(`${packageManagerExecCmd}@${BASELINE_VERSION_FOR_MIGRATIONS} update`)}`,
          `${output.formatCode(`${packageManagerName} install`)}`,
          `${output.formatCode(`git add -A`)}`,
          `${output.formatCode(`git commit -m "chore: run create-plugin@${BASELINE_VERSION_FOR_MIGRATIONS} update"`)}`,
        ],
      });

      await exec(`${packageManagerExecCmd}@${BASELINE_VERSION_FOR_MIGRATIONS} update`);
      await exec(`${packageManagerName} install`);
      await gitCommitNoVerify(`chore: run create-plugin@${BASELINE_VERSION_FOR_MIGRATIONS} update`);
    } catch (error) {
      output.error({
        title: `Update to create-plugin ${BASELINE_VERSION_FOR_MIGRATIONS} failed.`,
        body: [
          'Please run the following commands manually and try again.',
          `${output.formatCode(`${packageManagerExecCmd}@${BASELINE_VERSION_FOR_MIGRATIONS} update`)}`,
          `${output.formatCode(`${packageManagerName} install`)}`,
          `${output.formatCode(`git add -A`)}`,
          `${output.formatCode(`git commit -m "chore: run create-plugin@${BASELINE_VERSION_FOR_MIGRATIONS} update"`)}`,
        ],
      });
      process.exit(1);
    }
  }

  return await migrationUpdate(argv);
};
