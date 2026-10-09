import type { Element, Root, RootContent } from 'hast';
import { raw } from 'hast-util-raw';
import type { Literal, Node } from 'unist';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

/**
 * The raw HTML tags authors may write. Validation allows the same set.
 */
export const ALLOWED_HTML_TAGS: readonly string[] = ['br', 'details', 'hr', 'summary'];

const allowedTags = new Set(ALLOWED_HTML_TAGS);

// tags that switch the HTML parser to raw text, so markup after them can turn into text or vanish
const RAW_TEXT_TAG_RE = /<(?:iframe|noembed|noframes|noscript|plaintext|script|style|template|textarea|title|xmp)\b/i;

// survives the HTML parser as a data attribute, which raw HTML can't forge without the per-parse value
const MARKDOWN_MARKER = 'dataPluginDocsMarkdown';

type Range = [start: number, end: number];

// where the node came from: markdown, raw HTML we keep or raw HTML we remove
type Origin = 'markdown' | 'kept' | 'removed';

// records where each raw node sits in the source; drops raw nodes without a position or with a raw text tag
function takeRawRanges(node: Node, ranges: Range[]): void {
  if (!('children' in node)) {
    return;
  }
  node.children = (node.children as Node[]).filter((child) => {
    if (child.type !== 'raw') {
      takeRawRanges(child, ranges);
      return true;
    }
    const start = child.position?.start?.offset;
    const end = child.position?.end?.offset;
    if (start === undefined || end === undefined || RAW_TEXT_TAG_RE.test(String((child as Literal).value))) {
      return false;
    }
    ranges.push([start, end]);
    return true;
  });
}

function filterNodes(
  nodes: RootContent[],
  context: Origin,
  marker: string,
  ranges: Range[],
  parentTag?: string
): RootContent[] {
  return nodes.flatMap((node): RootContent[] => {
    if (node.type !== 'element') {
      // raw text always starts inside a raw node, and only shows from a kept tag
      const offset = node.position?.start?.offset;
      const isRaw = offset !== undefined && ranges.some(([start, end]) => offset >= start && offset < end);
      return !isRaw || context === 'kept' ? [node] : [];
    }

    if (node.properties[MARKDOWN_MARKER] === marker) {
      delete node.properties[MARKDOWN_MARKER];
      node.children = filterNodes(node.children, 'markdown', marker, ranges, node.tagName) as Element['children'];
      return [node];
    }

    // removed raw HTML keeps only the markdown nested inside it
    const isAllowed = allowedTags.has(node.tagName) && (node.tagName !== 'summary' || parentTag === 'details');
    if (context === 'removed' || !isAllowed) {
      return filterNodes(node.children, 'removed', marker, ranges);
    }

    node.properties = node.tagName === 'details' && node.properties.open !== undefined ? { open: true } : {};
    node.children = filterNodes(node.children, 'kept', marker, ranges, node.tagName) as Element['children'];
    return [node];
  });
}

/**
 * Rehype plugin that parses raw HTML, but keeps only `ALLOWED_HTML_TAGS` from it, with no
 * attributes other than `open` on `details`. Markdown inside removed HTML is kept.
 *
 * Markdown elements are marked before parsing, so any element without the mark came from raw
 * HTML or was added by the HTML parser.
 */
export function rehypeRawAllowlist() {
  return (tree: Root, file: VFile): Root => {
    const ranges: Range[] = [];
    takeRawRanges(tree, ranges);

    const marker = globalThis.crypto.randomUUID();
    visit(tree, 'element', (node: Element) => {
      node.properties[MARKDOWN_MARKER] = marker;
    });

    const parsed = raw(tree, { file }) as Root;
    parsed.children = filterNodes(parsed.children, 'markdown', marker, ranges);
    return parsed;
  };
}
