import { Context } from './context.js';
import { formatFiles, flushChanges, installNPMDependencies, printChanges } from './utils.js';
import { parseAndValidateOptions } from './schema-parser.js';
import { Codemod } from './types.js';

/**
 * Run a single codemod
 *
 * Steps:
 * 1. Load codemod module from scriptPath
 * 2. Parse and validate options from schema
 * 3. Execute codemod transformation
 * 4. Format files
 * 5. Flush changes to disk
 * 6. Print summary
 * 7. Install dependencies if needed
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
    const updatedContext = await codemodModule.default(context, codemodOptions);

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
