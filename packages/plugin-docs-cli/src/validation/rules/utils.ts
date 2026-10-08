import { posix } from 'node:path';

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
 * The file path a link or image reference points at: `?query` and `#fragment` dropped and percent
 * escapes decoded, which is how the renderer reads it. Each run of valid `%XX` escapes is decoded
 * on its own, so one malformed escape (`%ZZ`) cannot switch off decoding for the rest.
 */
export function decodeRefPath(ref: string): string {
  const pathPart = ref.split(/[?#]/)[0];
  return pathPart.replace(/(?:%[0-9a-f]{2})+/gi, (escapes) => {
    try {
      return decodeURIComponent(escapes);
    } catch {
      return escapes;
    }
  });
}

/**
 * Returns true when a relative link or image reference, resolved against the directory of the page
 * it appears in, lands outside the docs root. `../` that stays inside the docs folder is fine.
 *
 * The reference is percent-decoded first so `..%2F` cannot slip through. Root-relative (`/foo`)
 * references are not traversal; they have their own rules. A backslash-rooted reference (`\x.png`)
 * is not left to those rules: browsers read it as root-relative, but their `startsWith('/')` checks
 * would never see it.
 */
export function escapesDocsRoot(ref: string, pageRelPath: string): boolean {
  const decoded = decodeRefPath(ref);
  if (decoded.startsWith('\\')) {
    return true;
  }

  const target = decoded.replace(/\\/g, '/');
  if (target.startsWith('/')) {
    return false;
  }

  const pageDir = posix.dirname(pageRelPath.replace(/\\/g, '/'));
  const resolved = posix.normalize(posix.join(pageDir, target));
  return resolved === '..' || resolved.startsWith('../');
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
 *
 * Covers all four ways Markdown carries a target: inline `](url)`, autolink `<url>`, a bare URL
 * written as plain text and a `[ref]: url` link definition. A word inside a URL is not prose - a
 * rule that "corrects" `github.com/grafana/my-datasource` would break the link.
 */
export function maskLinkTargets(line: string): string {
  const mask = (value: string) => '#'.repeat(value.length);

  return (
    line
      // inline links and images: [text](target)
      .replace(/(\]\()([^)\n]*)(\))/g, (_m, open: string, target: string, close: string) => {
        return `${open}${mask(target)}${close}`;
      })
      // autolinks: <https://example.com>
      .replace(/(<)(https?:[^>\n]*)(>)/g, (_m, open: string, url: string, close: string) => {
        return `${open}${mask(url)}${close}`;
      })
      // link reference definitions: [ref]: ./target.md
      .replace(/^(\s*\[[^\]\n]+\]:\s*)(\S+)/, (_m, prefix: string, target: string) => {
        return `${prefix}${mask(target)}`;
      })
      // bare URLs in plain text. runs last so the forms above are already filler by now.
      .replace(/https?:\/\/\S+/g, mask)
  );
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

// matches a reference definition, [label]: url "title", but not a footnote definition [^1]: text
const REFERENCE_DEFINITION_RE = /^ {0,3}\[([^\]^][^\]]*)\]:\s*(?:<([^>]*)>|(\S+))/;

// matches an image that uses a reference: ![alt][label], ![label][] or ![label]
const IMAGE_REFERENCE_RE = /!\[([^\]]*)\](?:\[([^\]]*)\])?(?![(:])/g;

export function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Reference definitions (`[label]: url`) in a page, with their normalized label and the line they're on. A definition is an
 * image when some `![alt][label]` uses its label, otherwise a link. Lines in `skipLines` are ignored.
 */
export function getReferenceDefinitions(
  content: string,
  skipLines: ReadonlySet<number>
): Array<{ label: string; ref: string; line: number; isImage: boolean }> {
  const lines = content.split('\n');
  const imageLabels = new Set<string>();
  const definitions: Array<{ label: string; ref: string; line: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    if (skipLines.has(i + 1)) {
      continue;
    }
    const definition = REFERENCE_DEFINITION_RE.exec(lines[i]);
    if (definition) {
      definitions.push({ label: normalizeLabel(definition[1]), ref: definition[2] ?? definition[3], line: i + 1 });
      continue;
    }
    for (const image of lines[i].matchAll(IMAGE_REFERENCE_RE)) {
      imageLabels.add(normalizeLabel(image[2] || image[1]));
    }
  }

  return definitions.map(({ label, ref, line }) => ({ label, ref, line, isImage: imageLabels.has(label) }));
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
      // Non-global, non-sticky regexes don't advance, so only report the first match.
      if (!lineRe.global && !lineRe.sticky) {
        break;
      }
      // guard against a zero-length match spinning forever
      if (m[0] === '') {
        lineRe.lastIndex++;
      }
    }
  }

  return results;
}
