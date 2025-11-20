import minimist from 'minimist';
import { isGitDirectory, isGitDirectoryClean } from './utils.git.js';
import { isPluginDirectory } from './utils.plugin.js';
import { output } from './utils.console.js';

/**
 * Ensures git directory exists, is clean, and we're in a plugin directory
 */
export async function performPreCodemodChecks(argv: minimist.ParsedArgs): Promise<void> {
  if (!(await isGitDirectory()) && !argv.force) {
    output.error({
      title: 'You are not inside a git directory',
      body: [
        `In order to proceed please run ${output.formatCode('git init')} in the root of your project and commit your changes.`,
        `(This check is necessary to make sure that changes are easy to revert and don't interfere with any changes you currently have.`,
        `In case you want to proceed as is please use the ${output.formatCode('--force')} flag.)`,
      ],
    });

    process.exit(1);
  }

  if (!(await isGitDirectoryClean()) && !argv.force) {
    output.error({
      title: 'Please clean your repository working tree before making changes.',
      body: [
        'Commit your changes or stash them.',
        `(This check is necessary to make sure that changes are easy to revert and don't mess with any changes you currently have.`,
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
        `(Please make sure to run this command from the root of your plugin folder. In case you want to proceed as is please use the ${output.formatCode('--force')} flag.)`,
      ],
    });

    process.exit(1);
  }
}
