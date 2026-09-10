import defaultAdditions from '../codemods/additions/additions.js';
import { runCodemod } from '../codemods/runner.js';
import { getPackageManagerExecCmd, getPackageManagerFromUserAgent } from '../utils/utils.packageManager.js';
import { performPreCodemodChecks } from '../utils/utils.checks.js';
import minimist from 'minimist';
import { output } from '../utils/utils.console.js';

export const add = async (argv: minimist.ParsedArgs) => {
  const subCommand = argv._[1];

  if (!subCommand) {
    await showAdditionsHelp();
    process.exit(1);
  }

  await performPreCodemodChecks(argv);

  try {
    const addition = defaultAdditions.find((addition) => addition.name === subCommand);
    if (!addition) {
      const additionsList = defaultAdditions.map((addition) => addition.name);
      throw new Error(`Unknown addition: ${subCommand}\n\nAvailable additions: ${additionsList.join(', ')}`);
    }

    // filter out minimist internal properties (_ and $0) before passing to codemod
    const { _, $0, ...codemodOptions } = argv;
    const context = await runCodemod(addition, codemodOptions);

    const nextSteps = context.listNextSteps();

    // the runner has already explained the skip. declining is not failing, so don't exit non-zero -
    // just don't follow the explanation with a success line that contradicts it.
    if (!context.getSkip()) {
      output.success({
        title: `Successfully added ${addition.name} to your plugin.`,
      });
    }

    // last, so it survives the change list and the dependency install above it
    if (nextSteps.length > 0) {
      output.log({ title: 'Next steps', body: output.bulletList(nextSteps) });
    }
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

async function showAdditionsHelp() {
  const additionsList = defaultAdditions.map((addition) => addition.name);
  const { packageManagerName, packageManagerVersion } = getPackageManagerFromUserAgent();

  output.error({
    title: 'No addition specified',
    body: [
      `Usage: ${getPackageManagerExecCmd(packageManagerName, packageManagerVersion)} add <addition-name> [options]`,
      '',
      'Available additions:',
      ...output.bulletList(additionsList),
    ],
  });
}
