export type Severity = 'error' | 'warning' | 'info';

export const Rule = {
  // filesystem rules
  HasMarkdown: 'has-markdown-files',
  RootIndex: 'root-index-exists',
  NestedDirIndex: 'nested-dir-has-index',
  NoSpaces: 'no-spaces-in-names',
  ValidNaming: 'valid-file-naming',
  NoEmptyDir: 'no-empty-directories',
  NoSymlinks: 'no-symlinks',
  AllowedFileTypes: 'allowed-file-types',
  MaxNestingDepth: 'max-nesting-depth',
  DocsPathExists: 'docs-path-exists',
  MaxTotalDocsSize: 'max-total-docs-size',
  MaxTotalPages: 'max-total-pages',
  // frontmatter rules
  BlockExists: 'frontmatter-block-exists',
  ValidYaml: 'frontmatter-valid-yaml',
  RequiredFields: 'frontmatter-required-fields',
  FieldTypes: 'frontmatter-field-types',
  ValidSlug: 'frontmatter-valid-slug',
  NoH1: 'no-h1-heading',
  DuplicatePosition: 'no-duplicate-sidebar-position',
  DuplicateSlug: 'no-duplicate-slugs',
  TitleLength: 'frontmatter-title-length',
  DescriptionLength: 'frontmatter-description-length',
  MinContentLength: 'min-content-length',
  // content-completeness rules
  UnfilledSectionBrief: 'unfilled-section-brief',
  // asset rules
  NoSvg: 'no-svg-files',
  ReferencedImagesExist: 'referenced-images-exist',
  MaxImageSize: 'max-image-size',
  MaxTotalImagesSize: 'max-total-images-size',
  ImageFileNaming: 'image-file-naming',
  NoOrphanedImages: 'no-orphaned-images',
  MaxDataUriSize: 'max-data-uri-size',
  // markdown + security rules
  NoRawHtml: 'no-raw-html',
  ImageRefsRelative: 'image-refs-relative',
  InternalLinksRelative: 'internal-links-relative',
  NoDangerousUrls: 'no-dangerous-urls',
  NoScriptTags: 'no-script-tags',
  NoPathTraversal: 'no-path-traversal',
  NoBase64Images: 'no-base64-images',
  NoExternalImages: 'no-external-images',
  // cross-file rules
  InternalLinksResolve: 'internal-links-resolve',
  AnchorLinksResolve: 'anchor-links-resolve',
  // manifest rules
  ManifestValid: 'manifest-valid',
  ManifestRefsExist: 'manifest-refs-exist',
} as const;

export type Rule = (typeof Rule)[keyof typeof Rule];

/**
 * Id of a writing-style rule, always `style-` plus the kebab-case name of the Grafana Writers'
 * Toolkit rule it comes from, so `Grafana.ReferTo` is reported as `style-refer-to`. These are
 * derived from the vendored rule definitions rather than enumerated in `Rule`, so `ALLOWED_RULES`
 * in `rules/style.ts` stays the single source of truth for which ones exist.
 */
export type StyleRuleId = `style-${string}`;

/**
 * A diagnostic reported by a rule runner.
 */
export interface Diagnostic {
  rule: Rule | StyleRuleId;
  severity: Severity;
  file?: string;
  line?: number;
  title: string;
  detail: string;
  /**
   * Authoritative documentation for this rule. Set on writing-style diagnostics so a reader - or
   * an agent fixing them - can look up the full guidance for a rule only once they have tripped it.
   */
  url?: string;
}

/**
 * Data available to rule runners. Grows as slices add more rule categories.
 */
export interface ValidationInput {
  docsPath: string;
  strict: boolean;
  /**
   * Treat leftover `section-brief` scaffolding as progress rather than a defect.
   *
   * Docs scaffolded by `create-plugin add docs` are all stub, by design - reporting that back as
   * errors turns "you ran the command successfully" into a red build. Authoring tools pass this so
   * the count is informational while the pages are being written. The publishing check never passes
   * it, so half-written docs still cannot reach the catalog.
   */
  allowUnfilledStubs?: boolean;
}

/**
 * The result of running validation.
 */
export interface ValidationResult {
  valid: boolean;
  diagnostics: Diagnostic[];
}

/**
 * A function that checks rules and returns diagnostics.
 */
export type RuleRunner = (input: ValidationInput) => Diagnostic[] | Promise<Diagnostic[]>;
