import { additionsDebug, flushChanges, formatFiles, installNPMDependencies, printChanges } from './utils.js';
import defaultAdditions, { AdditionMeta } from './additions.js';

import { Context } from '../migrations/context.js';
import { gitCommitNoVerify } from '../utils/utils.git.js';
import { output } from '../utils/utils.console.js';
import { setFeatureFlag } from '../utils/utils.config.js';

export type AdditionFn = (context: Context, options?: AdditionOptions) => Context | Promise<Context>;

export type AdditionOptions = Record<string, any>;

type RunAdditionOptions = {
  commitChanges?: boolean;
};

export function getAvailableAdditions(
  additions: Record<string, AdditionMeta> = defaultAdditions.additions
): Record<string, AdditionMeta> {
  return additions;
}

export function getAdditionByName(
  name: string,
  additions: Record<string, AdditionMeta> = defaultAdditions.additions
): AdditionMeta | undefined {
  return additions[name];
}

export async function getAdditionFlags(addition: AdditionMeta): Promise<any[]> {
  try {
    const module = await import(addition.scriptPath);
    return module.flags || [];
  } catch (error) {
    return [];
  }
}

export async function parseAdditionFlags(addition: AdditionMeta, argv: any): Promise<AdditionOptions> {
  try {
    const module = await import(addition.scriptPath);
    if (module.parseFlags && typeof module.parseFlags === 'function') {
      return module.parseFlags(argv);
    }
    return {};
  } catch (error) {
    return {};
  }
}

async function validateAdditionOptions(addition: AdditionMeta, options: AdditionOptions): Promise<void> {
  const flags = await getAdditionFlags(addition);

  if (!flags || flags.length === 0) {
    return;
  }

  const missingFlags: string[] = [];

  for (const flag of flags) {
    if (flag.required) {
      const value = options[flag.name];
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        missingFlags.push(flag.name);
      }
    }
  }

  if (missingFlags.length > 0) {
    const flagDocs = flags.filter((f) => missingFlags.includes(f.name)).map((f) => `  --${f.name}: ${f.description}`);

    throw new Error(
      `Missing required flag${missingFlags.length > 1 ? 's' : ''}:\n\n` +
        flagDocs.join('\n') +
        `\n\nExample: npx @grafana/create-plugin add ${addition.name} --${missingFlags[0]}=value`
    );
  }
}

export async function runAdditionByName(
  additionName: string,
  argv: any,
  runOptions: RunAdditionOptions = {}
): Promise<void> {
  const addition = getAdditionByName(additionName);
  if (!addition) {
    const availableAdditions = getAvailableAdditions();
    const additionsList = Object.keys(availableAdditions);
    throw new Error(`Unknown addition: ${additionName}\n\nAvailable additions: ${additionsList.join(', ')}`);
  }

  const options = await parseAdditionFlags(addition, argv);
  await validateAdditionOptions(addition, options);
  await runAddition(addition, options, runOptions);
}

export async function runAddition(
  addition: AdditionMeta,
  additionOptions: AdditionOptions = {},
  runOptions: RunAdditionOptions = {}
): Promise<void> {
  const basePath = process.cwd();

  output.log({
    title: `Running addition: ${addition.name}`,
    body: [addition.description],
  });

  try {
    const context = new Context(basePath);
    const updatedContext = await executeAddition(addition, context, additionOptions);
    const shouldCommit = runOptions.commitChanges && updatedContext.hasChanges();

    additionsDebug(`context for "${addition.name} (${addition.scriptPath})":`);
    additionsDebug('%O', updatedContext.listChanges());

    await formatFiles(updatedContext);
    flushChanges(updatedContext);
    printChanges(updatedContext, addition.name, addition);

    installNPMDependencies(updatedContext);

    await setFeatureFlag(addition.featureName, true);
    additionsDebug(`Set feature flag '${addition.featureName}' to true in .cprc.json`);

    if (shouldCommit) {
      await gitCommitNoVerify(`chore: add ${addition.name} support via create-plugin`);
    }

    output.success({
      title: `Successfully added ${addition.name} to your plugin.`,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error running addition "${addition.name} (${addition.scriptPath})": ${error.message}`);
    }
    throw error;
  }
}

export async function executeAddition(
  addition: AdditionMeta,
  context: Context,
  options: AdditionOptions = {}
): Promise<Context> {
  const module: { default: AdditionFn } = await import(addition.scriptPath);
  return module.default(context, options);
}
