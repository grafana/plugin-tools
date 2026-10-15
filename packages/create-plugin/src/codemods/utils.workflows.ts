import { isScalar, parseDocument, visit } from 'yaml';
import type { Context } from './context.js';
import { codemodsDebug } from './utils.js';

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
 * tags are (`build-plugin/v1.2.0`). A shorter tag floats, so `v1` already runs the latest 1.x and is
 * left alone, and a floating tag that is too low is raised at its own precision (`v1.1` to `v1.2`).
 * Other refs are left as-is and reported, except `main`, which always runs the latest release.
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
      const minimum = parseTag(action, minimumRef);
      if (!minimum) {
        throw new Error(`The minimum ref '${minimumRef}' for ${action} is not a version tag.`);
      }
      return [action, minimum];
    })
  );

  const content = context.getFile(workflowPath);
  if (!content) {
    codemodsDebug(`Could not find ${workflowPath}. Skipping action bumps.`);
    return { found: [], unrecognized: [] };
  }

  const doc = parseDocument(content);
  if (doc.errors.length > 0) {
    codemodsDebug(`Failed to parse ${workflowPath}: ${doc.errors[0].message}. Skipping action bumps.`);
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
      const tag = parseTag(action, ref);
      if (!tag) {
        codemodsDebug(`${workflowPath} pins ${action}@${ref}, which is not a version tag. Leaving it as-is.`);
        unrecognized.add(action);
        return;
      }
      if (meetsMinimum(tag.version, minimum.version)) {
        codemodsDebug(`${workflowPath} already pins ${action}@${ref}. Skipping.`);
        return;
      }
      if (!uses.range) {
        return;
      }
      const [start, end] = uses.range;
      edits.push({ start, end, text: content.slice(start, end).replace(`@${ref}`, `@${raisedRef(tag, minimum)}`) });
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

interface Tag {
  /** The text before `v`, such as `build-plugin/`, or empty for a bare tag. */
  prefix: string;
  /** One to three numbers, fewer for a floating tag. */
  version: number[];
}

// reads `vX[.Y[.Z]]`, or `<name>/vX[.Y[.Z]]` where name is the action's last path segment
function parseTag(action: string, ref: string): Tag | undefined {
  const match = /^(?:([^/]+)\/)?v(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(ref);
  if (!match || (match[1] !== undefined && match[1] !== action.split('/').at(-1))) {
    return undefined;
  }
  return {
    prefix: match[1] === undefined ? '' : `${match[1]}/`,
    version: match
      .slice(2)
      .filter((part) => part !== undefined)
      .map(Number),
  };
}

// compares only the numbers the tag has, since a floating tag runs the latest release below it
function meetsMinimum(version: number[], minimum: number[]): boolean {
  for (const [i, part] of version.entries()) {
    const minimumPart = minimum[i] ?? 0;
    if (part !== minimumPart) {
      return part > minimumPart;
    }
  }
  return true;
}

function raisedRef(tag: Tag, minimum: Tag): string {
  const version = Array.from({ length: tag.version.length }, (_, i) => minimum.version[i] ?? 0);
  return `${minimum.prefix}v${version.join('.')}`;
}
