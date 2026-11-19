import type { Element, ElementContent, Root as HastRoot } from 'hast';
import type { BlockContent, Break, DefinitionContent, FootnoteDefinition, Html, Nodes, Parents } from 'mdast';
import { defaultHandlers, toMdast, type Handle, type State } from 'hast-util-to-mdast';
import {
  defaultHandlers as markdownHandlers,
  toMarkdown as mdastToMarkdown,
  type Info,
  type State as MarkdownState,
} from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { visit } from 'unist-util-visit';
import { CALLOUT_TYPES, type CalloutType } from './plugins/rehype-callouts.js';
import { getText } from './plugins/rehype-youtube.js';

/**
 * Options for turning parsed docs into Markdown.
 */
export interface ToMarkdownOptions {
  /**
   * Called with the href of every link in the output, as `parseMarkdown` left it (relative doc
   * links have no `.md`). Returns the href to write. Without it, hrefs are written unchanged.
   */
  resolveHref?: (href: string) => string;
}

type HandleResult = ReturnType<Handle>;

function hasClass(node: Element, className: string): boolean {
  const value = node.properties?.className;
  return Array.isArray(value) && value.includes(className);
}

function isElement(node: ElementContent, tagName: string): node is Element {
  return node.type === 'element' && node.tagName === tagName;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function html(value: string): Html {
  return { type: 'html', value };
}

function toFlow(state: State, node: Element, children: ElementContent[]): Array<BlockContent | DefinitionContent> {
  return state.toFlow(state.all({ ...node, children }));
}

function getCalloutType(node: Element): CalloutType | undefined {
  if (!hasClass(node, 'callout')) {
    return undefined;
  }
  return (Object.keys(CALLOUT_TYPES) as CalloutType[]).find((type) => hasClass(node, `callout-${type}`));
}

// a callout becomes a GitHub alert, which the parser reads back as the same callout
function div(state: State, node: Element): HandleResult {
  const type = getCalloutType(node);
  if (!type) {
    return state.toFlow(state.all(node));
  }
  const body = toFlow(
    state,
    node,
    node.children.filter((child) => !(isElement(child, 'p') && hasClass(child, 'callout-title')))
  );
  // an html node, so the marker isn't escaped to `\[!NOTE]`
  const marker = html(`[!${type.toUpperCase()}]`);
  const [first, ...rest] = body;
  if (first?.type === 'paragraph') {
    const paragraph = { ...first, children: [marker, { type: 'text' as const, value: '\n' }, ...first.children] };
    return { type: 'blockquote', children: [paragraph, ...rest] };
  }
  return { type: 'blockquote', children: [{ type: 'paragraph', children: [marker] }, ...body] };
}

// kept as raw html, as on GitHub. The parser allows these tags, so the output still parses
function details(state: State, node: Element): HandleResult {
  const summary = node.children.find((child) => isElement(child, 'summary'));
  const body = node.children.filter((child) => child !== summary);
  const summaryText = summary ? escapeHtml(getText(summary).replace(/\s+/g, ' ').trim()) : '';
  const open = node.properties?.open ? '<details open>' : '<details>';
  const start = summary ? `${open}\n<summary>${summaryText}</summary>` : open;
  return [html(start), ...toFlow(state, node, body), html('</details>')];
}

// gfm footnote references are `<sup><a data-footnote-ref>1</a></sup>`, numbered in order of first use
function sup(state: State, node: Element): HandleResult {
  const elements = node.children.filter((child) => child.type === 'element');
  const [link] = elements;
  if (elements.length === 1 && link.properties?.dataFootnoteRef !== undefined) {
    const label = getText(link).trim();
    return { type: 'footnoteReference', identifier: label, label };
  }
  return state.all(node);
}

// definitions are numbered by their position in the footnotes list, which matches the reference labels
function section(state: State, node: Element): HandleResult {
  if (node.properties?.dataFootnotes === undefined) {
    return state.toFlow(state.all(node));
  }
  const list = node.children.find((child) => isElement(child, 'ol'));
  const items = list?.children.filter((child) => isElement(child, 'li')) ?? [];
  return items.map((item, index): FootnoteDefinition => {
    const label = String(index + 1);
    return { type: 'footnoteDefinition', identifier: label, label, children: toFlow(state, node, item.children) };
  });
}

// footnote back-references only make sense in the rendered page
function a(state: State, node: Element): HandleResult {
  if (node.properties?.dataFootnoteBackref !== undefined) {
    return undefined;
  }
  return defaultHandlers.a(state, node);
}

// table cells and headings can't hold a line ending, so the break stays html rather than becoming a space
function hardBreak(node: Break, parent: Parents | undefined, state: MarkdownState, info: Info): string {
  const value = markdownHandlers.break(node, parent, state, info);
  return value === '\\\n' ? value : '<br>';
}

/**
 * Turns the hast from `parseMarkdown` into GitHub-flavored Markdown that matches the rendered page:
 * snippets swapped, disallowed HTML dropped, no h1 and the asset paths `parseMarkdown` resolved.
 * Callouts become GitHub alerts (`> [!NOTE]`), collapsible sections stay `<details>`, YouTube embeds
 * and videos become links and footnotes stay footnotes.
 *
 * The input tree isn't changed, so a cached parse can feed both the HTML and the Markdown.
 *
 * @param hast - The `hast` from `parseMarkdown`
 * @param options - Optional link rewriting
 * @returns The Markdown, ending in a newline, or an empty string for an empty page
 */
export function toMarkdown(hast: HastRoot, options?: ToMarkdownOptions): string {
  const mdast = toMdast(hast, { handlers: { a, details, div, section, sup } }) as Nodes;

  const resolveHref = options?.resolveHref;
  if (resolveHref) {
    visit(mdast, 'link', (node) => {
      node.url = resolveHref(node.url);
    });
  }

  return mdastToMarkdown(mdast, {
    extensions: [gfmToMarkdown()],
    handlers: { break: hardBreak },
    bullet: '-',
    emphasis: '_',
    fences: true,
    listItemIndent: 'one',
    rule: '-',
  });
}
