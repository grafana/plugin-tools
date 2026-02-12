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
   * Pages with lower numbers appear first. When omitted, the page sorts
   * after positioned pages, alphabetically by filename.
   */
  sidebar_position?: number;

  /**
   * Optional custom URL slug. If not provided, generated from file path.
   */
  slug?: string;

  /**
   * Optional tags for SEO and categorization.
   */
  tags?: string[];
}
