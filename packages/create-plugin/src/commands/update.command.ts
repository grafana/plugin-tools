import minimist from 'minimist';
import { standardUpdate } from './update.standard.command.js';
import { migrationUpdate } from './update.migrate.command.js';
import { isGitDirectory, isGitDirectoryClean } from '../utils/utils.git.js';
import { output } from '../utils/utils.console.js';
import chalk from 'chalk';
import { isPluginDirectory } from '../utils/utils.plugin.js';

export const update = async (argv: minimist.ParsedArgs) => {
  if (!(await isGitDirectory()) && !argv.force) {
    output.error({
      title: 'You are not inside a git directory',
      body: [
        `In order to proceed please run "git init" in the root of your project and commit your changes.`,
        `(This check is necessary to make sure that the updates are easy to revert and don't interfere with any changes you currently have.`,
        `In case you want to proceed as is please use the ${chalk.bold('--force')} flag.)`,
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
        `In case you want to proceed as is please use the ${chalk.bold('--force')} flag.)`,
      ],
    });

    process.exit(1);
  }

  if (!isPluginDirectory() && !argv.force) {
    output.error({
      title: 'Are you inside a plugin directory?',
      body: [
        `We couldn't find a "src/plugin.json" file under your current directory.`,
        `(Please make sure to run this command from the root of your plugin folder. In case you want to proceed as is please use the ${chalk.bold(
          '--force'
        )} flag.)`,
      ],
    });

    process.exit(1);
  }

  if (argv.experimentalUpdates) {
    return await migrationUpdate(argv);
  }

  return await standardUpdate();
};
