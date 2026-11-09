import * as yaml from 'js-yaml';

/**
 * Why a page's frontmatter couldn't be read. `line` is 1-based in the whole page.
 */
export type FrontmatterProblem =
  | { kind: 'unclosed'; line: number }
  | { kind: 'invalid-yaml'; line: number; message: string }
  | { kind: 'not-a-mapping'; line: number };

/**
 * The result of reading a page's frontmatter.
 */
export interface FrontmatterResult {
  /**
   * Whether the page opens with a `---` line.
   */
  hasBlock: boolean;

  /**
   * The frontmatter fields. Empty when the page has no block or the block has a problem.
   */
  data: Record<string, unknown>;

  /**
   * The markdown after the block. The whole page when it has no block or the block isn't closed.
   */
  body: string;

  /**
   * Set when the page opens a block that can't be read.
   */
  problem?: FrontmatterProblem;
}

const BOM = '\uFEFF';
const OPENING_FENCE_RE = /^---[ \t]*(?:\r?\n|$)/;
const CLOSING_FENCE_RE = /^---[ \t]*\r?$/gm;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

// js-yaml throws on a document with no content, but an empty block is fine
function isBlank(yamlText: string): boolean {
  return yamlText.split('\n').every((line) => /^\s*(?:#.*)?$/.test(line));
}

function lineAt(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

/**
 * Reads the frontmatter block at the top of a page: a `---` line, YAML fields and a closing `---` line.
 * A leading byte order mark and spaces after either `---` are allowed.
 *
 * @param content - The raw markdown content of the page
 */
export function readFrontmatter(content: string): FrontmatterResult {
  const text = content.startsWith(BOM) ? content.slice(BOM.length) : content;
  const opening = text.match(OPENING_FENCE_RE);
  if (!opening) {
    return { hasBlock: false, data: {}, body: text };
  }

  const yamlStart = opening[0].length;
  CLOSING_FENCE_RE.lastIndex = yamlStart;
  const closing = CLOSING_FENCE_RE.exec(text);
  if (!closing) {
    return { hasBlock: true, data: {}, body: text, problem: { kind: 'unclosed', line: 1 } };
  }

  const afterFence = closing.index + closing[0].length;
  const body = text.slice(text.startsWith('\n', afterFence) ? afterFence + 1 : afterFence);
  const yamlLine = lineAt(text, yamlStart);

  const yamlText = text.slice(yamlStart, closing.index);
  if (isBlank(yamlText)) {
    return { hasBlock: true, data: {}, body };
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(yamlText);
  } catch (error) {
    const isYamlError = error instanceof yaml.YAMLException;
    const message = isYamlError ? error.reason : error instanceof Error ? error.message : String(error);
    const line = isYamlError && error.mark ? yamlLine + error.mark.line : yamlLine;
    return { hasBlock: true, data: {}, body, problem: { kind: 'invalid-yaml', line, message } };
  }

  if (parsed === undefined) {
    return { hasBlock: true, data: {}, body };
  }
  if (!isPlainObject(parsed)) {
    return { hasBlock: true, data: {}, body, problem: { kind: 'not-a-mapping', line: yamlLine } };
  }
  return { hasBlock: true, data: parsed, body };
}
