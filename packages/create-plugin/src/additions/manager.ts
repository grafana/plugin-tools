import { additionsDebug, flushChanges, formatFiles, installNPMDependencies, printChanges } from './utils.js';
import defaultAdditions, { AdditionMeta } from './additions.js';

import { Context } from '../migrations/context.js';
import { gitCommitNoVerify } from '../utils/utils.git.js';
import { output } from '../utils/utils.console.js';

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
