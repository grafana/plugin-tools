/**
 * Represents a heading extracted from a page's HTML content.
 */
export interface Heading {
  /**
   * The heading level (2 for h2, 3 for h3).
   */
  level: number;

  /**
   * The text content of the heading.
   */
  text: string;

  /**
   * The ID attribute for anchor linking.
   */
  id: string;
}

/**
 * Represents a documentation page in the manifest.
 */
export interface Page {
  /**
   * The display title of the page.
   */
  title: string;

  /**
   * The URL slug for the page.
   */
  slug: string;

  /**
   * The relative path to the markdown file (e.g., "installation.md").
   */
  file: string;

  /**
   * Extracted headings for table of contents.
   */
  headings?: Heading[];

  /**
   * Optional nested child pages.
   */
  children?: Page[];
}

/**
 * The documentation manifest that defines the structure and navigation.
 */
export interface Manifest {
  /**
   * The title of the documentation.
   */
  title: string;

  /**
   * The list of documentation pages.
   */
  pages: Page[];
}

/**
 * A collection of markdown files indexed by their file path.
 */
export interface MarkdownFiles {
  [filePath: string]: string;
}

/**
 * Frontmatter metadata from a markdown file.
 */
export interface Frontmatter {
  /**
   * The display title of the page.
   */
  title: string;

  /**
   * A brief description of the page content.
   */
  description: string;

  /**
   * The position of this page in the sidebar navigation (used for sorting).
   * Pages with lower numbers appear first.
   */
  sidebar_position: number;

  /**
   * Optional custom URL slug. If not provided, generated from file path.
   */
  slug?: string;

  /**
   * Optional tags for SEO and categorization.
   */
  tags?: string[];
}
