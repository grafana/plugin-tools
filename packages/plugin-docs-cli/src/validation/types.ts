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
  // frontmatter rules
  BlockExists: 'frontmatter-block-exists',
  ValidYaml: 'frontmatter-valid-yaml',
  RequiredFields: 'frontmatter-required-fields',
  FieldTypes: 'frontmatter-field-types',
  ValidSlug: 'frontmatter-valid-slug',
  NoH1: 'no-h1-heading',
  DuplicatePosition: 'no-duplicate-sidebar-position',
  DuplicateSlug: 'no-duplicate-slugs',
  // asset rules
  ImagesInImgDir: 'images-in-img-dir',
  AllowedImageFormats: 'allowed-image-formats',
  NoSvg: 'no-svg-files',
  ReferencedImagesExist: 'referenced-images-exist',
  MaxImageSize: 'max-image-size',
  MaxTotalImagesSize: 'max-total-images-size',
  ImageFileNaming: 'image-file-naming',
  NoOrphanedImages: 'no-orphaned-images',
} as const;

export type Rule = (typeof Rule)[keyof typeof Rule];

/**
 * A diagnostic reported by a rule runner.
 */
export interface Diagnostic {
  rule: Rule;
  severity: Severity;
  file?: string;
  line?: number;
  title: string;
  detail: string;
}

/**
 * Data available to rule runners. Grows as slices add more rule categories.
 */
export interface ValidationInput {
  docsPath: string;
  strict: boolean;
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
