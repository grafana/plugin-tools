import defaultAdditions, { hasPromptStep, isScriptAddition } from '../codemods/additions/additions.js';
import { prepareAgenticAddition, runAgenticStep } from '../codemods/agentic/index.js';
import { buildDirectiveBlock, buildNextStepsLine, getPromptPath } from '../codemods/agentic/prompts.js';
import { Context } from '../codemods/context.js';
import { runCodemod } from '../codemods/runner.js';
import { getPackageManagerExecCmd, getPackageManagerFromUserAgent } from '../utils/utils.packageManager.js';
import { performPreCodemodChecks } from '../utils/utils.checks.js';
import { isGitDirectoryClean } from '../utils/utils.git.js';
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

    // filter out minimist internal properties (_ and $0) and the agent flag before passing to codemod
    const { _, $0, agent: agentFlag, ...codemodOptions } = argv;

    // resolved before any codemod work so a missing agent cannot leave a half-applied addition.
    // undefined when this addition carries no agent instructions
    const resolution = await prepareAgenticAddition(addition, agentFlag);

    // captured before the codemod flushes, so we know whether --force let unrelated changes through
    const treeWasDirty = resolution?.mode === 'enabled' ? !(await isGitDirectoryClean()) : false;

    let context: Context | undefined;
    if (isScriptAddition(addition)) {
      context = await runCodemod(addition, codemodOptions);
    }

    const message = context?.getMessage();
    if (message) {
      output[message.level]({ title: message.title, body: message.body });
    }

    if (!resolution || !hasPromptStep(addition)) {
      if (!message) {
        output.success({
          title: `Successfully added ${addition.name} to your plugin.`,
        });
      }
      return;
    }

    if (resolution.mode === 'enabled') {
      const result = await runAgenticStep({
        addition,
        agent: resolution.agent,
        context,
        basePath: process.cwd(),
        treeWasDirty,
      });

      output.success({
        title: `Successfully added ${addition.name} to your plugin.`,
        body: result.kind === 'applied' ? [result.summary] : undefined,
      });
      return;
    }

    // opted out, or already running inside an agent: the agent step is handed onwards
    const deferredAddition = {
      name: addition.name,
      description: addition.description,
      instructionsPath: getPromptPath(addition.prompt),
    };

    if (resolution.mode === 'inside-agent') {
      output.logSingleLine(buildDirectiveBlock(deferredAddition));
      return;
    }

    output.warning({
      title: `${addition.name} includes AI-agent instructions that were not applied.`,
      body: [buildNextStepsLine(deferredAddition)],
    });
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
