import minimist from 'minimist';
import { lt } from 'semver';
import { migrationUpdate } from './update.migrate.command.js';
import { isGitDirectory, isGitDirectoryClean } from '../utils/utils.git.js';
import { getConfig } from '../utils/utils.config.js';
import { output } from '../utils/utils.console.js';
import { isPluginDirectory } from '../utils/utils.plugin.js';
import { getPackageManagerExecCmd, getPackageManagerWithFallback } from '../utils/utils.packageManager.js';
import { BASELINE_VERSION_FOR_MIGRATIONS } from '../constants.js';

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

    output.error({
      title: 'Manual update required.',
      body: [
        `Please run the following commands before attempting to update your plugin to create-plugin v6+.`,

        `${output.formatCode(`${packageManagerExecCmd}@${BASELINE_VERSION_FOR_MIGRATIONS} update`)}`,
        `${output.formatCode(`${packageManagerName} install`)}`,
        `${output.formatCode(`git add .`)}`,
        `${output.formatCode(`git commit -m "chore: run create-plugin@${BASELINE_VERSION_FOR_MIGRATIONS} update"`)}`,
      ],
    });
    output.log({
      withPrefix: false,
      title: 'Why do I need to run these commands?',
      body: [
        'Create-plugin has made improvements to how it updates plugins.',
        'To take advantage of these improvements we need to make sure that your plugins configuration files are aligned with the latest v5 release.',
        'This is a one time operation and will not need to be repeated in the future.',
      ],
    });

    process.exit(0);
  }

  return await migrationUpdate(argv);
};
