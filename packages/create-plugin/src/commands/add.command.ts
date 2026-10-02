import defaultAdditions, { hasPromptStep, isScriptAddition } from '../codemods/additions/additions.js';
import { buildAdditionTodosWarning, prepareAgenticAddition, runAgenticStep } from '../codemods/agentic/index.js';
import { buildDirectiveBlock, buildNextStepsLine, getPromptPath } from '../codemods/agentic/prompts.js';
import { buildVerifyWarning, runVerifyScripts } from '../codemods/agentic/verify.js';
import { Context } from '../codemods/context.js';
import { runCodemod } from '../codemods/runner.js';
import {
  getPackageManagerExecCmd,
  getPackageManagerFromUserAgent,
  getPackageManagerWithFallback,
} from '../utils/utils.packageManager.js';
import { performPreCodemodChecks } from '../utils/utils.checks.js';
import { findAdditionTodos, isGitDirectoryClean } from '../utils/utils.git.js';
import minimist from 'minimist';
import Enquirer from 'enquirer';
import { output } from '../utils/utils.console.js';
import { PluginEntry, resolveProject } from '../utils/utils.project.js';
import { selectAdditionTargets } from './add/select-targets.js';

const ADD_FEATURES_DOCS_URL = 'https://grafana.com/developers/plugin-tools/how-to-guides/add-features-to-a-plugin';

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

    // filter out minimist internal properties (_ and $0), the agent flag and the targeting flags before passing to codemod
    const { _, $0, agent: agentFlag, plugin, yes, ...codemodOptions } = argv;
    const requestedPlugins = [plugin].flat().filter((value): value is string => typeof value === 'string');
    const plugins = await selectAdditionTargets(addition, project, requestedPlugins, (allPlugins) =>
      confirmAllPlugins(addition.name, allPlugins, Boolean(yes))
    );
    const targetProject = { ...project, plugins };

    // resolved before any codemod work so a missing agent cannot leave a half-applied addition.
    // undefined when this addition carries no agent instructions
    const resolution = await prepareAgenticAddition(addition, agentFlag);

    // captured before the codemod flushes, so we know whether --force let unrelated changes through
    const treeWasDirty = resolution?.mode === 'enabled' ? !(await isGitDirectoryClean()) : false;

    let context: Context | undefined;
    if (isScriptAddition(addition)) {
      context = await runCodemod(addition, codemodOptions, targetProject);
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
        basePath: project.root,
        treeWasDirty,
      });

      const summaryBody = result.kind === 'applied' ? [result.summary] : [];
      const { packageManagerName } = getPackageManagerWithFallback(project.root);
      const verifyWarning = buildVerifyWarning(
        addition.name,
        packageManagerName,
        runVerifyScripts({ scripts: addition.verify ?? [], cwd: project.root, packageManagerName })
      );

      if (verifyWarning) {
        output.warning({ title: verifyWarning.title, body: [...summaryBody, ...verifyWarning.body] });
      } else {
        output.success({
          title: `Successfully added ${addition.name} to your plugin.`,
          body: summaryBody.length > 0 ? summaryBody : undefined,
        });
      }

      const todosWarning = buildAdditionTodosWarning(
        addition.name,
        await findAdditionTodos(addition.name, project.root)
      );
      if (todosWarning) {
        output.warning(todosWarning);
      }
      return;
    }

    // opted out, or already running inside an agent: the agent step is handed onwards
    const deferredAddition = {
      name: addition.name,
      description: addition.description,
      instructionsPath: getPromptPath(addition.prompt),
      verifyScripts: addition.verify ?? [],
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
      '',
      `Learn more: ${output.formatUrl(ADD_FEATURES_DOCS_URL)}`,
    ],
  });
}
