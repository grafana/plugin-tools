/**
 * Core types for the plugin documentation renderer.
 *
 * These types define the structure of documentation manifests and pages.
 */

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
   * The manifest format version.
   */
  version: string;

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
