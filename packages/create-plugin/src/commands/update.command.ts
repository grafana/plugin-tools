import minimist from 'minimist';
import chalk from 'chalk';
import { EXTRA_TEMPLATE_VARIABLES } from '../constants.js';
import { updateDotConfigFolder, isPluginDirectory } from '../utils/utils.plugin.js';
import { getRuntimeVersion } from '../utils/utils.version.js';
import { printRedBox, printBlueBox } from '../utils/utils.console.js';
import { updatePackageJson, updateNpmScripts } from '../utils/utils.npm.js';
import { isGitDirectory, isGitDirectoryClean } from '../utils/utils.git.js';

export const update = async (argv: minimist.ParsedArgs) => {
  try {
    if (!(await isGitDirectory()) && !argv.force) {
      printRedBox({
        title: 'You are not inside a git directory',
        content: `In order to proceed please run "git init" in the root of your project and commit your changes.\n
(This check is necessary to make sure that the updates are easy to revert and don't mess with any changes you currently have.
In case you want to proceed as is please use the ${chalk.bold('--force')} flag.)`,
      });

      process.exit(1);
    }

    if (!(await isGitDirectoryClean()) && !argv.force) {
      printRedBox({
        title: 'Please clean your repository working tree before updating.',
        subtitle: '(Commit your changes or stash them.)',
        content: `(This check is necessary to make sure that the updates are easy to revert and don't mess with any changes you currently have.
In case you want to proceed as is please use the ${chalk.bold('--force')} flag.)`,
      });

      process.exit(1);
    }

    if (!isPluginDirectory() && !argv.force) {
      printRedBox({
        title: 'Are you inside a plugin directory?',
        subtitle: 'We couldn\'t find a "src/plugin.json" file under your current directory.',
        content: `(Please make sure to run this command from the root of your plugin folder. In case you want to proceed as is please use the ${chalk.bold(
          '--force'
        )} flag.)`,
      });

      process.exit(1);
    }

    updateDotConfigFolder();
    updateNpmScripts();
    updatePackageJson({
      onlyOutdated: true,
      ignoreGrafanaDependencies: false,
      devOnly: false,
    });

    printBlueBox({
      title: 'Update successful ✔',
      content: `${chalk.bold('@grafana/* package version:')} ${EXTRA_TEMPLATE_VARIABLES.grafanaVersion}
${chalk.bold('@grafana/create-plugin version:')} ${getRuntimeVersion()}

${chalk.bold.underline('Next steps:')}
- 1. Run ${chalk.bold('npm install')} to install the package updates
- 2. Check if your encounter any breaking changes
  (If yes please check our migration guide: https://grafana.com/developers/plugin-tools/migration-guides/update-from-grafana-versions/)


${chalk.bold('Do you have questions?')}
Please don't hesitate to reach out in one of the following ways:
- Open an issue/discussion in https://github.com/grafana/plugin-tools
- Ask a question in the community forum at https://community.grafana.com/
- Join our community slack channel at https://slack.grafana.com/`,
    });
  } catch (error) {
    if (error instanceof Error) {
      printRedBox({
        title: 'Something went wrong while updating your plugin.',
        content: error.message,
      });
    } else {
      console.error(error);
    }
  }
};
