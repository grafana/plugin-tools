import type { Context } from './context.js';
import { isVersionGreater, migrationsDebug } from './utils.js';

// Matches a single-line `require <module> <version>` statement (with an optional trailing
// `// indirect` comment), the shape every codemod-scaffolded backend's go.mod uses.
function singleLineRequireRegex(modulePath: string): RegExp {
  const escapedModulePath = modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^require ${escapedModulePath} (\\S+)(.*)$`, 'm');
}

/**
 * Adds a `require <modulePath> <version>` line to go.mod, or bumps its version if it's already
 * present with a lower one (using the same version-comparison logic as addDependenciesToPackageJson).
 *
 * Only understands the single-line `require <module> <version>` form that create-plugin's own
 * templates use — it does not parse grouped `require (...)` blocks, `replace`/`exclude` directives,
 * or anything else that would need a real go.mod grammar. A codemod that needs that should shell out
 * to `go mod edit` against the real file on disk instead (see utils.goSdk.ts), outside of Context.
 */
export function addRequireToGoMod(context: Context, modulePath: string, version: string, goModPath = 'go.mod') {
  const content = context.getFile(goModPath);

  if (!content) {
    migrationsDebug(`Could not find ${goModPath}. Skipping the ${modulePath} dependency.`);
    return;
  }

  const requireRegex = singleLineRequireRegex(modulePath);
  const match = content.match(requireRegex);

  if (match) {
    const [, existingVersion] = match;
    if (!isVersionGreater(version, existingVersion, false)) {
      migrationsDebug(`${goModPath} already requires ${modulePath} at ${existingVersion}. Skipping.`);
      return;
    }

    const updated = content.replace(requireRegex, `require ${modulePath} ${version}$2`);
    context.updateFile(goModPath, updated);
    return;
  }

  const insertAt = findRequireInsertionPoint(content);
  const newRequireLine = `require ${modulePath} ${version}\n`;

  context.updateFile(goModPath, `${content.slice(0, insertAt)}${newRequireLine}${content.slice(insertAt)}`);
}

/**
 * Finds where to insert a new top-level `require ...` line: right after the last existing one, else
 * right after the `go 1.x` directive, else at the end of the file.
 */
function findRequireInsertionPoint(content: string): number {
  const requireLines = [...content.matchAll(/^require \S+ \S+.*$/gm)];
  const lastRequireLine = requireLines[requireLines.length - 1];

  if (lastRequireLine) {
    const lineEnd = content.indexOf('\n', lastRequireLine.index! + lastRequireLine[0].length);
    return lineEnd === -1 ? content.length : lineEnd + 1;
  }

  const goDirective = content.match(/^go \d+\.\d+(\.\d+)?.*$/m);

  if (goDirective) {
    const lineEnd = content.indexOf('\n', goDirective.index! + goDirective[0].length);
    return lineEnd === -1 ? content.length : lineEnd + 1;
  }

  return content.length;
}
