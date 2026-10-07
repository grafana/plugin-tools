import type { Root, Element, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Callout types, matching GitHub's alert syntax, mapped to their title.
 */
export const CALLOUT_TYPES = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
} as const;

export type CalloutType = keyof typeof CALLOUT_TYPES;

// the [!TYPE] marker must be alone on the first line of the blockquote, as on GitHub
const MARKER_RE = /^\[!([a-z]+)\][ \t]*(?:\r?\n|$)/i;

function isCalloutType(type: string): type is CalloutType {
  return Object.hasOwn(CALLOUT_TYPES, type);
}

/**
 * Rehype plugin that turns GitHub alert blockquotes (`> [!NOTE]`) into callouts:
 * `<div class="callout callout-note" role="note">` with a `<p class="callout-title">` first.
 * Blockquotes with an unknown type or no marker are left untouched.
 */
export function rehypeCallouts() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'blockquote') {
        return;
      }

      const firstParagraph = node.children.find((child): child is Element => child.type === 'element');
      if (firstParagraph?.tagName !== 'p') {
        return;
      }

      const firstText = firstParagraph.children[0];
      if (firstText?.type !== 'text') {
        return;
      }

      const match = firstText.value.match(MARKER_RE);
      const type = match?.[1].toLowerCase();
      if (!match || !type || !isCalloutType(type)) {
        return;
      }

      firstText.value = firstText.value.slice(match[0].length);
      if (firstText.value === '') {
        firstParagraph.children.shift();
      }

      const children: ElementContent[] =
        firstParagraph.children.length === 0
          ? node.children.filter((child) => child !== firstParagraph)
          : node.children;

      node.tagName = 'div';
      node.properties = { className: ['callout', `callout-${type}`], role: 'note' };
      node.children = [
        {
          type: 'element',
          tagName: 'p',
          properties: { className: ['callout-title'] },
          children: [{ type: 'text', value: CALLOUT_TYPES[type] }],
        },
        ...children,
      ];
    });
  };
}
