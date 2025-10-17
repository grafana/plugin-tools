import { getAdditionByName, getAvailableAdditions, runAddition } from '../additions/manager.js';
import { isGitDirectory, isGitDirectoryClean } from '../utils/utils.git.js';

import { isPluginDirectory } from '../utils/utils.plugin.js';
import minimist from 'minimist';
import { output } from '../utils/utils.console.js';
import { promptI18nOptions } from './add/prompts.js';

export const add = async (argv: minimist.ParsedArgs) => {
  const subCommand = argv._[1];

  if (!subCommand) {
    const availableAdditions = getAvailableAdditions();
    const additionsList = Object.values(availableAdditions).map(
      (addition) => `${addition.name} - ${addition.description}`
    );

    output.error({
      title: 'No addition specified',
      body: [
        'Usage: npx @grafana/create-plugin add <addition-name>',
        '',
        'Available additions:',
        ...output.bulletList(additionsList),
      ],
    });
    process.exit(1);
  }

  await performPreAddChecks(argv);

  const addition = getAdditionByName(subCommand);

  if (!addition) {
    const availableAdditions = getAvailableAdditions();
    const additionsList = Object.values(availableAdditions).map((addition) => addition.name);

    output.error({
      title: `Unknown addition: ${subCommand}`,
      body: ['Available additions:', ...output.bulletList(additionsList)],
    });
    process.exit(1);
  }

  try {
    // Gather options based on the addition type
    let options = {};

    switch (addition.name) {
      case 'i18n':
        options = await promptI18nOptions();
        break;
      default:
        break;
    }

    const commitChanges = argv.commit;
    await runAddition(addition, options, { commitChanges });
  } catch (error) {
    if (error instanceof Error) {
      output.error({
        title: 'Addition failed',
        body: [error.message],
      });
    }
    process.exit(1);
  }
};

async function performPreAddChecks(argv: minimist.ParsedArgs) {
  if (!(await isGitDirectory()) && !argv.force) {
    output.error({
      title: 'You are not inside a git directory',
      body: [
        `In order to proceed please run ${output.formatCode('git init')} in the root of your project and commit your changes.`,
        `(This check is necessary to make sure that the changes are easy to revert and don't interfere with any changes you currently have.`,
        `In case you want to proceed as is please use the ${output.formatCode('--force')} flag.)`,
      ],
    });

    process.exit(1);
  }

  if (!(await isGitDirectoryClean()) && !argv.force) {
    output.error({
      title: 'Please clean your repository working tree before adding features.',
      body: [
        'Commit your changes or stash them.',
        `(This check is necessary to make sure that the changes are easy to revert and don't mess with any changes you currently have.`,
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
