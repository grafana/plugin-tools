import { Context } from './context.js';
import { formatFiles, flushChanges, installNPMDependencies, printChanges } from './utils.js';
import { parseAndValidateOptions } from './schema-parser.js';
import { output } from '../utils/utils.console.js';
import { Codemod } from './types.js';

/**
 * Run a single codemod
 *
 * Steps:
 * 1. Load codemod module from scriptPath
 * 2. Parse and validate options from schema
 * 3. Execute codemod transformation
 * 4. Stop here and hand the context back if the codemod skipped - steps 5-8 are for work that happened
 * 5. Format files
 * 6. Flush changes to disk
 * 7. Print summary
 * 8. Install dependencies if needed
 *
 * Next steps a codemod recorded are rendered by the calling command afterwards, which is what keeps
 * them below the change list and the install.
 */
export async function runCodemod(codemod: Codemod, options?: Record<string, any>): Promise<Context> {
  const codemodModule = await import(codemod.scriptPath);
  if (!codemodModule.default || typeof codemodModule.default !== 'function') {
    throw new Error(`Codemod ${codemod.name} must export a default function`);
  }

  let codemodOptions = {};

  if (options && codemodModule.schema) {
    codemodOptions = parseAndValidateOptions(options, codemodModule.schema);
  }

  const basePath = process.cwd();
  const context = new Context(basePath);

  try {
    const changesBefore = Object.keys(context.listChanges()).length;
    const updatedContext = await codemodModule.default(context, codemodOptions);

    // a skip means nothing happened, so nothing is flushed, listed or installed. staging first and
    // then skipping would drop those edits silently, so treat it as a codemod bug.
    if (updatedContext.getSkip()) {
      if (Object.keys(updatedContext.listChanges()).length > changesBefore) {
        throw new Error('the codemod staged changes and then skipped. Skip before making any changes.');
      }
      printSkip(updatedContext, codemod.name);
      return updatedContext;
    }

    // standard post-processing pipeline
    await formatFiles(updatedContext);
    flushChanges(updatedContext);
    printChanges(updatedContext, codemod.name, codemod.description);
    installNPMDependencies(updatedContext);

    return updatedContext;
  } catch (error) {
    if (error instanceof Error) {
      const newError = new Error(`Error running ${codemod.name}: ${error.message}`);
      newError.cause = error;
      throw newError;
    }
    throw error;
  }
}

/**
 * Explains why a codemod declined, in the place its change list would have gone.
 *
 * Done here rather than in each command so `add` and `update` word it identically.
 */
function printSkip(context: Context, key: string) {
  const skip = context.getSkip();

  if (!skip) {
    return;
  }

  output.warning({ title: `Skipped ${key}: ${skip.reason}`, body: skip.hints.length > 0 ? skip.hints : undefined });
}
