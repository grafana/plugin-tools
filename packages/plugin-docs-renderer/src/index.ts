// library exports - pure markdown parsing functions only
export { parseMarkdown } from './parser.js';
export type { ParsedMarkdown, ParseOptions } from './parser.js';
export type { Heading, Page, Manifest, MarkdownFiles, Frontmatter } from './types.js';

// re-export HAST serializer for consumers that need HTML strings
export { toHtml } from 'hast-util-to-html';
export type { Root as HastRoot } from 'hast';
