/**
 * Table of Contents utilities for plugin documentation.
 *
 * Provides functions to extract heading data from markdown or HTML.
 * HTML rendering is handled by the EJS partial at src/server/views/partials/toc.ejs.
 */

import { marked } from 'marked';
import GithubSlugger from 'github-slugger';
import type { Heading } from './types.js';

// re-export Heading type for convenience
export type { Heading };

/**
 * Extracts H2 and H3 headings directly from markdown content.
 * Uses marked's lexer to tokenize markdown, more efficient than parsing HTML.
 *
 * @param content - The markdown content (with or without frontmatter)
 * @returns Array of heading objects
 */
export function extractHeadingsFromMarkdown(content: string): Heading[] {
  // remove frontmatter if present (marked.lexer will fail on it)
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // tokenize markdown
  const tokens = marked.lexer(withoutFrontmatter);
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  // extract heading tokens
  for (const token of tokens) {
    if (token.type === 'heading' && (token.depth === 2 || token.depth === 3)) {
      const text = token.text;
      const id = slugger.slug(text);

      headings.push({
        level: token.depth,
        text,
        id,
      });
    }
  }

  return headings;
}
