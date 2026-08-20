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
 * Neutralizes the contents of inline code spans (`` `code` ``, ` ``code`` `,
 * etc.) on a single line by replacing the inner characters with a same-length
 * run of `#` filler, leaving the backtick delimiters and everything else on
 * the line untouched. Per CommonMark/GFM, inline code spans are never
 * interpreted as markup - this lets regex-based checks (e.g. raw-HTML
 * detection) skip over them without false-positiving on literal text like
 * `` `<placeholder>` ``.
 *
 * Known limitations (this is a linter aid, not a full CommonMark tokenizer):
 * - Only spans fully contained within a single line are recognized.
 * - Backslash-escaped backticks are not specially handled.
 * - An unterminated backtick run (no matching close on the line) is left
 *   unmasked, since it isn't a real code span - CommonMark treats it as
 *   literal text too.
 */
export function maskInlineCode(line: string): string {
  return line.replace(/(`+)(.*?)\1(?!`)/g, (_match, delim: string, inner: string) => {
    return `${delim}${'#'.repeat(inner.length)}${delim}`;
  });
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
