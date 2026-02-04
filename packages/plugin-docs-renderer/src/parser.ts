import { marked } from 'marked';
import matter from 'gray-matter';
import DOMPurify from 'isomorphic-dompurify';

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
 */
export function parseMarkdown(content: string): ParsedMarkdown {
  // extract frontmatter using gray-matter
  const { data: frontmatter, content: markdownContent } = matter(content);

  // parse markdown to HTML using marked
  // configure marked to use GitHub Flavored Markdown
  marked.setOptions({
    gfm: true, // enable GitHub Flavored Markdown
    breaks: false, // don't convert \n to <br>
  });

  const rawHtml = marked.parse(markdownContent) as string;

  // sanitize HTML to prevent XSS attacks
  const html = DOMPurify.sanitize(rawHtml);

  return {
    frontmatter,
    html,
  };
}
