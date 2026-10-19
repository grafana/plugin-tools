import type { Html, Root, RootContent } from 'mdast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { fillSnippetPlaceholders, getSnippetSource, parseSnippetMarker, type SnippetValues } from '../snippets.js';

export interface RemarkSnippetsOptions {
  values?: SnippetValues;
}

/**
 * Something that stops the snippets on a page from being swapped. Lines are 1-based, in the markdown
 * that was parsed.
 */
export type SnippetProblem =
  | { kind: 'misplaced'; line: number }
  | { kind: 'unclosed'; line: number; name: string }
  | { kind: 'unopened'; line: number; name: string }
  | { kind: 'mismatched'; line: number; name: string; openName: string }
  | { kind: 'nested'; line: number; name: string; openName: string }
  | { kind: 'heading'; line: number; name: string };

export interface SnippetBlock {
  name: string;
  /** Index of the opening marker in the root's children. */
  start: number;
  /** Index of the closing marker in the root's children. */
  end: number;
}

const MARKER_LIKE_RE = /<!--\s*\/?snippet:/g;

function lineOf(node: RootContent): number {
  return node.position?.start.line ?? 0;
}

/**
 * Pairs the snippet markers at the top level of a page. A marker anywhere else, such as in a list or
 * next to other HTML, is a problem, as are markers that don't pair up and headings inside a snippet.
 */
export function readSnippetBlocks(tree: Root): { blocks: SnippetBlock[]; problems: SnippetProblem[] } {
  const blocks: SnippetBlock[] = [];
  const problems: SnippetProblem[] = [];
  const markers = new Set<Html>();
  let open: { name: string; start: number } | undefined;

  tree.children.forEach((node, i) => {
    const line = lineOf(node);
    if (open && node.type === 'heading') {
      problems.push({ kind: 'heading', line, name: open.name });
    }
    const marker = node.type === 'html' ? parseSnippetMarker(node.value) : undefined;
    if (node.type !== 'html' || !marker) {
      return;
    }
    markers.add(node);

    if (!marker.isClosing) {
      if (open) {
        problems.push({ kind: 'nested', line, name: marker.name, openName: open.name });
      }
      open = { name: marker.name, start: i };
    } else if (!open) {
      problems.push({ kind: 'unopened', line, name: marker.name });
    } else if (open.name !== marker.name) {
      problems.push({ kind: 'mismatched', line, name: marker.name, openName: open.name });
      open = undefined;
    } else {
      blocks.push({ ...open, end: i });
      open = undefined;
    }
  });

  if (open) {
    problems.push({ kind: 'unclosed', line: lineOf(tree.children[open.start]), name: open.name });
  }

  visit(tree, 'html', (node: Html) => {
    if (markers.has(node)) {
      return;
    }
    for (const match of node.value.matchAll(MARKER_LIKE_RE)) {
      const line = (node.position?.start.line ?? 0) + node.value.slice(0, match.index).split('\n').length - 1;
      problems.push({ kind: 'misplaced', line });
    }
  });

  return { blocks, problems: problems.sort((a, b) => a.line - b.line) };
}

function parseSnippet(name: string, values: SnippetValues | undefined): RootContent[] | undefined {
  const source = getSnippetSource(name);
  if (source === undefined || fillSnippetPlaceholders(source, values) === undefined) {
    return undefined;
  }
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source);
  visit(tree, (node) => {
    // rehypeRawAllowlist tells raw HTML apart by source offset, and these offsets point into the snippet, not the page
    delete node.position;
    // values are filled in after parsing, so markdown in a plugin name shows as written
    if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') {
      node.value = fillSnippetPlaceholders(node.value, values) ?? node.value;
    }
  });
  return tree.children;
}

/**
 * Remark plugin that swaps the fallback text between `<!-- snippet:<name> -->` and
 * `<!-- /snippet:<name> -->` for the snippet's current text. An unknown name or a missing value keeps
 * that snippet's fallback, and any problem from `readSnippetBlocks` keeps the fallback of every snippet
 * on the page.
 */
export function remarkSnippets(options: RemarkSnippetsOptions = {}) {
  return (tree: Root) => {
    const { blocks, problems } = readSnippetBlocks(tree);
    if (blocks.length === 0 || problems.length > 0) {
      return;
    }
    const children: RootContent[] = [];
    let next = 0;
    for (const block of blocks) {
      const nodes = parseSnippet(block.name, options.values);
      if (nodes === undefined) {
        continue;
      }
      children.push(...tree.children.slice(next, block.start), ...nodes);
      next = block.end + 1;
    }
    children.push(...tree.children.slice(next));
    tree.children = children;
  };
}
