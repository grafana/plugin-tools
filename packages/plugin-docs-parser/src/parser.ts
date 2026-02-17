import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import matter from 'gray-matter';
import { VFile } from 'vfile';
import type { Root as HastRoot } from 'hast';
import { rehypeRewriteAssetPaths } from './plugins/rehype-rewrite-asset-paths.js';
import { rehypeRewriteDocLinks } from './plugins/rehype-rewrite-doc-links.js';
import { rehypeExtractHeadings } from './plugins/rehype-extract-headings.js';
import type { Heading } from './types.js';
export type { Heading } from './types.js';

/**
 * Options for parsing markdown content.
 */
export interface ParseOptions {
  /**
   * Base URL for resolving relative image/asset paths.
   * When set, relative image src attributes are rewritten to absolute CDN URLs.
   * Example: "https://plugins-cdn.grafana-dev.net/my-plugin/1.0.0/public/plugins/my-plugin/docs"
   */
  assetBaseUrl?: string;
}

/**
 * Result of parsing a markdown file.
 */
export interface ParsedMarkdown {
  /**
   * Frontmatter metadata extracted from the markdown file.
   */
  frontmatter: Record<string, unknown>;

  /**
   * The parsed content as an HTML Abstract Syntax Tree (HAST).
   * Use `toHtml()` from `hast-util-to-html` to serialize to an HTML string,
   * or `toJsxRuntime()` from
   * `hast-util-to-jsx-runtime` for React rendering.
   */
  hast: HastRoot;

  /**
   * Headings (h2, h3) extracted from the content for table-of-contents generation.
   */
  headings: Heading[];
}

// disable the `user-content-` prefix that rehype-sanitize adds to id attributes by default.
// the default schema already allows id (via clobber) and className on code (for language-* classes).
const sanitizeSchema = { ...defaultSchema, clobberPrefix: '' };

/**
 * Parses markdown content into a HAST tree with extracted frontmatter and headings.
 *
 * @param content - The raw markdown content to parse
 * @param options - Optional parsing options for asset path rewriting
 * @returns The parsed result with frontmatter, HAST and headings
 * @throws {Error} If markdown parsing fails
 */
export function parseMarkdown(content: string, options?: ParseOptions): ParsedMarkdown {
  // extract frontmatter using gray-matter
  let frontmatter: Record<string, unknown>;
  let markdownContent: string;

  try {
    const result = matter(content);
    frontmatter = result.data;
    markdownContent = result.content;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract frontmatter: ${message}`);
  }

  // build the unified pipeline: markdown → mdast → hast
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    // allow raw HTML in markdown (e.g. <details>, <img>) to pass through to hast;
    // rehype-raw parses the raw nodes into proper hast elements so
    // rehype-sanitize can inspect and strip anything dangerous
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug);

  // rewrite asset paths before sanitization so URLs are final
  if (options?.assetBaseUrl) {
    processor.use(rehypeRewriteAssetPaths, { assetBaseUrl: options.assetBaseUrl });
  }

  // rewrite relative .md links to clean URLs
  processor.use(rehypeRewriteDocLinks);

  // sanitize to prevent XSS
  processor.use(rehypeSanitize, sanitizeSchema);

  // extract headings after sanitization (matches actual rendered content)
  processor.use(rehypeExtractHeadings);

  // parse markdown to mdast, then run all rehype transforms to produce hast
  const mdast = processor.parse(markdownContent);
  const vfile = new VFile();
  const hast = processor.runSync(mdast, vfile) as HastRoot;

  return {
    frontmatter,
    hast,
    headings: (vfile.data.headings as Heading[]) || [],
  };
}
