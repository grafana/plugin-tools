import defaultAdditions from '../codemods/additions/additions.js';
import { runCodemod } from '../codemods/runner.js';
import { getPackageManagerExecCmd, getPackageManagerFromUserAgent } from '../utils/utils.packageManager.js';
import { performPreCodemodChecks } from '../utils/utils.checks.js';
import minimist from 'minimist';
import Enquirer from 'enquirer';
import { output } from '../utils/utils.console.js';
import { PluginEntry, resolveProject } from '../utils/utils.project.js';
import { selectAdditionTargets } from './add/select-targets.js';

export const add = async (argv: minimist.ParsedArgs) => {
  const subCommand = argv._[1];

  if (!subCommand) {
    await showAdditionsHelp();
    process.exit(1);
  }

  const project = resolveProject();
  await performPreCodemodChecks(argv, project);

  try {
    const addition = defaultAdditions.find((addition) => addition.name === subCommand);
    if (!addition) {
      const additionsList = defaultAdditions.map((addition) => addition.name);
      throw new Error(`Unknown addition: ${subCommand}\n\nAvailable additions: ${additionsList.join(', ')}`);
    }

    // filter out minimist internal properties (_ and $0) and the targeting flags before passing to codemod
    const { _, $0, plugin, yes, ...codemodOptions } = argv;
    const requestedPlugins = [plugin].flat().filter((value): value is string => typeof value === 'string');
    const plugins = await selectAdditionTargets(addition, project, requestedPlugins, (allPlugins) =>
      confirmAllPlugins(addition.name, allPlugins, Boolean(yes))
    );
    const context = await runCodemod(addition, codemodOptions, { ...project, plugins });

    const message = context.getMessage();
    if (message) {
      output[message.level]({ title: message.title, body: message.body });
    } else {
      output.success({
        title: `Successfully added ${addition.name} to your plugin.`,
      });
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

async function confirmAllPlugins(additionName: string, plugins: PluginEntry[], skipPrompt: boolean) {
  if (skipPrompt) {
    return true;
  }

  const answer: unknown = await new Enquirer().prompt({
    type: 'confirm',
    name: 'applyToAll',
    message: `Add ${additionName} to all ${plugins.length} plugins (${plugins.map((p) => p.id ?? p.dir).join(', ')})?`,
    initial: false,
  });

  return typeof answer === 'object' && answer !== null && 'applyToAll' in answer && answer.applyToAll === true;
}

async function showAdditionsHelp() {
  const additionsList = defaultAdditions.map((addition) => addition.name);
  const { packageManagerName, packageManagerVersion } = getPackageManagerFromUserAgent();

  output.error({
    title: 'No addition specified',
    body: [
      `Usage: ${getPackageManagerExecCmd(packageManagerName, packageManagerVersion)} add <addition-name> [--plugin <plugin-id>] [options]`,
      '',
      'Available additions:',
      ...output.bulletList(additionsList),
    ],
  });
}
