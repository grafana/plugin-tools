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
  'AGENTS.MD',
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
 * Formats a byte count as a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)}KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)}MB`;
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

/**
 * Length-preserving mask of link and image targets, so a rule that scans prose does not match
 * inside a URL. `[Data formats](./see-data.md)` keeps its visible text but the target becomes
 * filler. Length must be preserved because callers index the raw line using offsets taken from
 * the masked one.
 */
export function maskLinkTargets(line: string): string {
  return line
    .replace(/(\]\()([^)\n]*)(\))/g, (_m, open: string, target: string, close: string) => {
      return `${open}${'#'.repeat(target.length)}${close}`;
    })
    .replace(/(<)(https?:[^>\n]*)(>)/g, (_m, open: string, url: string, close: string) => {
      return `${open}${'#'.repeat(url.length)}${close}`;
    });
}

/**
 * Returns 1-based line numbers that are not prose and so should be skipped by content rules:
 * the frontmatter block, HTML comment spans (which covers `<!-- section-brief -->` blocks) and
 * indented code blocks.
 */
export function getNonProseLines(content: string): Set<number> {
  const lines = content.split('\n');
  const skip = new Set<number>();

  // frontmatter, only when the file opens with a fence
  if (lines[0]?.trim() === '---') {
    skip.add(1);
    for (let i = 1; i < lines.length; i++) {
      skip.add(i + 1);
      if (lines[i].trim() === '---') {
        break;
      }
    }
  }

  let inComment = false;
  let inSectionBrief = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // scaffolded placeholder text between the two markers. it renders, so it is not an HTML
    // comment span, but it is ours rather than the author's and `unfilled-section-brief` already
    // tells them to delete it - style advice on top of that would just be noise.
    if (inSectionBrief) {
      skip.add(i + 1);
      if (/<!--\s*section-brief:end\s*-->/.test(line)) {
        inSectionBrief = false;
      }
      continue;
    }
    if (/<!--\s*section-brief:start\s*-->/.test(line)) {
      skip.add(i + 1);
      inSectionBrief = true;
      continue;
    }

    if (inComment) {
      skip.add(i + 1);
      if (line.includes('-->')) {
        inComment = false;
      }
      continue;
    }
    if (line.includes('<!--')) {
      skip.add(i + 1);
      // a comment that opens and closes on one line does not carry over
      if (!line.includes('-->')) {
        inComment = true;
      }
      continue;
    }
    // indented code block, but not a list continuation
    if (/^ {4,}\S/.test(line) && !/^\s*[-*+]|^\s*\d+\./.test(line)) {
      skip.add(i + 1);
    }
  }

  return skip;
}

/**
 * Tests a regex against content lines, skipping code blocks.
 * Returns all matches with their line numbers.
 */
export function matchOutsideCode(
  content: string,
  re: RegExp,
  codeLines: ReadonlySet<number>,
  options?: { maskInlineCode?: boolean; maskLinkTargets?: boolean; skipLines?: ReadonlySet<number> }
): Array<{ match: RegExpExecArray; line: number }> {
  const results: Array<{ match: RegExpExecArray; line: number }> = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (codeLines.has(i + 1) || options?.skipLines?.has(i + 1)) {
      continue;
    }
    let lineText = lines[i];
    if (options?.maskInlineCode) {
      lineText = maskInlineCode(lineText);
    }
    if (options?.maskLinkTargets) {
      lineText = maskLinkTargets(lineText);
    }
    const lineRe = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(lineText)) !== null) {
      results.push({ match: m, line: i + 1 });
      // guard against a zero-length match spinning forever
      if (m[0] === '') {
        lineRe.lastIndex++;
      }
    }
  }

  return results;
}
