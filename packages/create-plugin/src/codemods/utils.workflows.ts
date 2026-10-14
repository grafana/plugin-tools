import { isScalar, parseDocument, visit } from 'yaml';
import type { Context } from './context.js';
import { additionsDebug, isVersionGreater } from './utils.js';

export interface BumpActionRefsResult {
  /** The actions used in the workflow. */
  found: string[];
  /** The actions pinned to something other than a version tag, such as a branch or a commit SHA. */
  unrecognized: string[];
}

/**
 * Raises each `uses: <action>@<ref>` in a workflow to at least the given minimum ref, the way
 * addDependenciesToPackageJson raises dependency versions. A ref is never lowered.
 *
 * Refs are compared as `vX[.Y[.Z]]` tags, optionally prefixed with the action's own name as monorepo
 * tags are (`build-plugin/v1.2.0`). Other refs are left as-is and reported, except `main`, which always
 * runs the latest release.
 *
 * The parser finds each `uses` value, then only that value's source text is replaced, so comments and
 * formatting elsewhere stay byte-for-byte the same.
 */
export function bumpActionRefs(
  context: Context,
  workflowPath: string,
  minimumRefs: Record<string, string>
): BumpActionRefsResult {
  const minimums = new Map(
    Object.entries(minimumRefs).map(([action, minimumRef]) => {
      const minimumVersion = tagVersion(action, minimumRef);
      if (!minimumVersion) {
        throw new Error(`The minimum ref '${minimumRef}' for ${action} is not a version tag.`);
      }
      return [action, { minimumRef, minimumVersion }];
    })
  );

  const content = context.getFile(workflowPath);
  if (!content) {
    additionsDebug(`Could not find ${workflowPath}. Skipping action bumps.`);
    return { found: [], unrecognized: [] };
  }

  const doc = parseDocument(content);
  if (doc.errors.length > 0) {
    additionsDebug(`Failed to parse ${workflowPath}: ${doc.errors[0].message}. Skipping action bumps.`);
    return { found: [], unrecognized: [] };
  }

  const found = new Set<string>();
  const unrecognized = new Set<string>();
  const edits: Array<{ start: number; end: number; text: string }> = [];

  visit(doc, {
    Pair: (_, pair) => {
      if (!isScalar(pair.key) || pair.key.value !== 'uses' || !isScalar(pair.value)) {
        return;
      }
      const uses = pair.value;
      if (typeof uses.value !== 'string' || !uses.value.includes('@')) {
        return;
      }
      const separator = uses.value.lastIndexOf('@');
      const action = uses.value.slice(0, separator);
      const ref = uses.value.slice(separator + 1);
      const minimum = minimums.get(action);
      if (!minimum) {
        return;
      }

      found.add(action);
      if (ref === 'main') {
        return;
      }
      const version = tagVersion(action, ref);
      if (!version) {
        additionsDebug(`${workflowPath} pins ${action}@${ref}, which is not a version tag. Leaving it as-is.`);
        unrecognized.add(action);
        return;
      }
      if (!isVersionGreater(minimum.minimumVersion, version, false)) {
        additionsDebug(`${workflowPath} already pins ${action}@${ref}. Skipping.`);
        return;
      }
      if (!uses.range) {
        return;
      }
      const [start, end] = uses.range;
      edits.push({ start, end, text: content.slice(start, end).replace(`@${ref}`, `@${minimum.minimumRef}`) });
    },
  });

  if (edits.length > 0) {
    // apply from the end so earlier offsets stay valid
    const updated = edits
      .sort((a, b) => b.start - a.start)
      .reduce((acc, { start, end, text }) => `${acc.slice(0, start)}${text}${acc.slice(end)}`, content);
    context.updateFile(workflowPath, updated);
  }
  return { found: [...found], unrecognized: [...unrecognized] };
}

// reads `vX[.Y[.Z]]`, or `<name>/vX[.Y[.Z]]` where name is the action's last path segment, as `X.Y.Z`
function tagVersion(action: string, ref: string): string | undefined {
  const match = /^(?:(.+)\/)?v(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(ref);
  if (!match || (match[1] !== undefined && match[1] !== action.split('/').at(-1))) {
    return undefined;
  }
  return `${match[2]}.${match[3] ?? 0}.${match[4] ?? 0}`;
}
