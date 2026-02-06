import { marked } from 'marked';
import matter from 'gray-matter';
import DOMPurify from 'isomorphic-dompurify';
import createDebug from 'debug';
import { gfmHeadingId } from 'marked-gfm-heading-id';

const debug = createDebug('plugin-docs-renderer:parser');

// configure marked once at module level with gfm and heading IDs
marked.use({
  gfm: true,
  breaks: false,
});

// use marked-gfm-heading-id extension for automatic heading IDs
// @ts-expect-error - type mismatch due to duplicate marked instances in monorepo
marked.use(gfmHeadingId());

/**
 * Result of parsing a markdown file.
 */
export interface ParsedMarkdown {
  /**
   * Frontmatter metadata extracted from the markdown file.
   */
  frontmatter: Record<string, unknown>;

  /**
   * The rendered HTML content.
   */
  html: string;
}

/**
 * Parses markdown content and extracts frontmatter.
 *
 * @param content - The raw markdown content to parse
 * @returns The parsed result with frontmatter and HTML
 * @throws {Error} If markdown parsing fails
 */
export function parseMarkdown(content: string): ParsedMarkdown {
  debug('Parsing markdown content (%d bytes)', content.length);

  // extract frontmatter using gray-matter
  let frontmatter: Record<string, unknown>;
  let markdownContent: string;

  try {
    const result = matter(content);
    frontmatter = result.data;
    markdownContent = result.content;
    debug('Extracted frontmatter with %d key(s)', Object.keys(frontmatter).length);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract frontmatter: ${message}`);
  }

  // parse markdown to HTML using marked
  // heading IDs are automatically added by marked-gfm-heading-id extension
  let rawHtml: string;
  try {
    rawHtml = marked.parse(markdownContent) as string;
    debug('Parsed markdown to HTML (%d bytes)', rawHtml.length);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse markdown: ${message}`);
  }

  // sanitize HTML to prevent XSS attacks
  let html: string;
  try {
    html = DOMPurify.sanitize(rawHtml);
    debug('Sanitized HTML (%d bytes)', html.length);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to sanitize HTML: ${message}`);
  }

  return {
    frontmatter,
    html,
  };
}
