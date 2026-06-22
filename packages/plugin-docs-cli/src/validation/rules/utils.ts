/**
 * Repo-meta filenames that may live alongside docs pages but are never
 * themselves published as pages. Scanner and validation rules skip them so
 * plugin authors can keep a README, contributing guide etc. in the docs
 * folder without tripping the frontmatter or filesystem rules.
 *
 * Match is case-insensitive on the basename.
 */
const META_FILE_BASENAMES_UPPER: ReadonlySet<string> = new Set([
  'README.MD',
  'CONTRIBUTING.MD',
  'LICENSE.MD',
  'CODE_OF_CONDUCT.MD',
  'SECURITY.MD',
  'CHANGELOG.MD',
]);

/**
 * Returns true when the given path's basename is a known meta file that
 * should be excluded from docs scanning and validation.
 */
export function isMetaFile(filenameOrPath: string): boolean {
  const slash = Math.max(filenameOrPath.lastIndexOf('/'), filenameOrPath.lastIndexOf('\\'));
  const base = slash === -1 ? filenameOrPath : filenameOrPath.slice(slash + 1);
  return META_FILE_BASENAMES_UPPER.has(base.toUpperCase());
}

/**
 * Returns a set of 1-based line numbers inside fenced code blocks.
 */
export function getCodeBlockLines(content: string): Set<number> {
  const lines = content.split('\n');
  const codeLines = new Set<number>();
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i].trim())) {
      inCodeBlock = !inCodeBlock;
      codeLines.add(i + 1);
      continue;
    }
    if (inCodeBlock) {
      codeLines.add(i + 1);
    }
  }

  return codeLines;
}
