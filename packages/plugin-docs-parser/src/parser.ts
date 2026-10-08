import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import * as yaml from 'js-yaml';
import { VFile } from 'vfile';
import { rehypeSlug } from './plugins/rehype-slug.js';
import type { Root as HastRoot } from 'hast';
import { rehypeRewriteAssetPaths } from './plugins/rehype-rewrite-asset-paths.js';
import { rehypeRewriteDocLinks } from './plugins/rehype-rewrite-doc-links.js';
import { rehypeExtractHeadings } from './plugins/rehype-extract-headings.js';
import { rehypeStripH1 } from './plugins/rehype-strip-h1.js';
import { rehypeCallouts } from './plugins/rehype-callouts.js';
import { rehypeYouTube } from './plugins/rehype-youtube.js';
import { rehypeVideo } from './plugins/rehype-video.js';
import type { Heading } from './types.js';
export type { Heading } from './types.js';

/**
 * Options for parsing markdown content.
 */
export interface ParseOptions {
  /**
   * Base URL for resolving relative image/asset paths.
   * When set, relative image src attributes are rewritten.
   * Must be an absolute URL or a root-relative path.
   * Example: "https://plugins-cdn.grafana-dev.net/my-plugin/1.0.0/public/plugins/my-plugin/docs"
   */
  assetBaseUrl?: string;

  /**
   * Path to the doc file relative to the docs root, forward-slash separated, no leading slash
   * (e.g. "examples/azure.md"). Pass `Page.file` from the manifest. When set, relative image
   * srcs resolve from the doc file's directory rather than from `assetBaseUrl`. Has no effect
   * when `assetBaseUrl` is omitted.
   */
  file?: string;
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

const defaultAttributes = defaultSchema.attributes ?? {};

// raw HTML is parsed, so only the tags markdown produces survive, plus details, summary and br.
// id and name are only kept where markdown sets them, so raw HTML can't clobber page globals.
// clobberPrefix is off so heading ids match their slugs.
const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: '',
  ancestors: { ...defaultSchema.ancestors, summary: ['details'] },
  attributes: {
    ...defaultAttributes,
    '*': (defaultAttributes['*'] ?? []).filter((name) => name !== 'id' && name !== 'name'),
    a: [...(defaultAttributes.a ?? []), ['id', /^user-content-fnref-/]],
    li: [...(defaultAttributes.li ?? []), ['id', /^user-content-fn-/]],
    ...Object.fromEntries(
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tagName) => [tagName, [...(defaultAttributes[tagName] ?? []), 'id']])
    ),
  },
  strip: ['script', 'style'],
  tagNames: [
    'a',
    'blockquote',
    'br',
    'code',
    'del',
    'details',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'img',
    'input',
    'li',
    'ol',
    'p',
    'pre',
    'section',
    'strong',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'ul',
  ],
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;

function parseFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    return { data: {}, content };
  }
  // yaml.load can return scalars or arrays for malformed frontmatter; coerce
  // anything that isn't a plain object back to {} so the public type holds.
  const parsed = yaml.load(match[1]);
  const data =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  return { data, content: match[2] };
}

/**
 * Parses markdown content into a HAST tree with extracted frontmatter and headings.
 *
 * @param content - The raw markdown content to parse
 * @param options - Optional parsing options for asset path rewriting
 * @returns The parsed result with frontmatter, HAST and headings
 * @throws {Error} If markdown parsing fails
 */
export function parseMarkdown(content: string, options?: ParseOptions): ParsedMarkdown {
  // extract frontmatter
  let frontmatter: Record<string, unknown>;
  let markdownContent: string;

  try {
    const result = parseFrontmatter(content);
    frontmatter = result.data;
    markdownContent = result.content;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract frontmatter: ${message}`);
  }

  // build the unified pipeline: markdown → mdast → hast.
  // raw HTML is parsed so <details>, <summary> and <br> work; rehype-sanitize removes everything else.
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStripH1)
    .use(rehypeSlug);

  // rewrite asset paths before sanitization so URLs are final
  if (options?.assetBaseUrl) {
    processor.use(rehypeRewriteAssetPaths, {
      assetBaseUrl: options.assetBaseUrl,
      file: options.file,
    });
  }

  // rewrite relative .md links to clean URLs
  processor.use(rehypeRewriteDocLinks);

  // sanitize to prevent XSS
  processor.use(rehypeSanitize, sanitizeSchema);

  // our own markup runs after sanitization, so its classes survive and authors can't forge them
  processor.use(rehypeCallouts);
  processor.use(rehypeYouTube);
  processor.use(rehypeVideo);
  processor.use(rehypeHighlight);

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
