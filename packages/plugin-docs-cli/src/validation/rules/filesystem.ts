import { readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, extname, sep } from 'node:path';
import type { Diagnostic, ValidationInput } from '../types.js';

const RULE_HAS_MARKDOWN = 'has-markdown-files';
const RULE_ROOT_INDEX = 'root-index-exists';
const RULE_NESTED_DIR_INDEX = 'nested-dir-has-index';
const RULE_NO_SPACES = 'no-spaces-in-names';
const RULE_VALID_NAMING = 'valid-file-naming';
const RULE_NO_EMPTY_DIR = 'no-empty-directories';
const RULE_NO_SYMLINKS = 'no-symlinks';
const RULE_ALLOWED_FILE_TYPES = 'allowed-file-types';

// slug-safe: lowercase letters, digits and hyphens only
const SLUG_SAFE_RE = /^[a-z0-9-]+$/;

// allowed file extensions in the docs folder (.md + permitted image formats)
export const ALLOWED_EXTENSIONS = new Set(['.md', '.png', '.jpg', '.jpeg', '.webp', '.gif']);

export async function checkFilesystem(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    // docsPath doesn't exist or isn't readable
  }

  const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.md'));
  const dirs = entries.filter((e) => e.isDirectory());
  const symlinks = entries.filter((e) => e.isSymbolicLink());
  const nonMdFiles = entries.filter((e) => e.isFile() && !e.name.endsWith('.md'));

  // no-symlinks
  for (const link of symlinks) {
    diagnostics.push({
      rule: RULE_NO_SYMLINKS,
      severity: 'error',
      file: join(link.parentPath, link.name),
      title: 'Symlinks are not allowed',
      detail: `"${link.name}" is a symbolic link. Use actual files instead of symlinks.`,
    });
  }

  // allowed-file-types: non-.md files must be permitted image formats
  for (const file of nonMdFiles) {
    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      diagnostics.push({
        rule: RULE_ALLOWED_FILE_TYPES,
        severity: input.strict ? 'error' : 'info',
        file: join(file.parentPath, file.name),
        title: 'File type not allowed',
        detail: `"${file.name}" is not an allowed file type. Only .md and image files (png, jpg, jpeg, webp, gif) are permitted in the docs folder.`,
      });
    }
  }

  // has-markdown-files
  if (mdFiles.length === 0) {
    diagnostics.push({
      rule: RULE_HAS_MARKDOWN,
      severity: 'error',
      title: 'Docs folder must contain at least one .md file',
      detail:
        'The docs folder must contain at least one markdown file. Add markdown files with valid frontmatter to get started.',
    });
  }

  // root-index-exists
  const hasRootIndex = mdFiles.some((e) => e.name === 'index.md' && e.parentPath === input.docsPath);
  if (!hasRootIndex) {
    diagnostics.push({
      rule: RULE_ROOT_INDEX,
      severity: 'error',
      title: 'Root index.md must exist',
      detail:
        'The docs folder must contain an index.md file at its root. This serves as the landing page for your plugin documentation.',
    });
  }

  for (const dir of dirs) {
    const dirPath = join(dir.parentPath, dir.name);

    // no-empty-directories: directories with no allowed-extension files at any depth serve no purpose
    const hasAllowed = entries.some(
      (e) =>
        e.isFile() &&
        ALLOWED_EXTENSIONS.has(extname(e.name).toLowerCase()) &&
        (e.parentPath === dirPath || e.parentPath.startsWith(dirPath + sep))
    );
    if (!hasAllowed) {
      diagnostics.push({
        rule: RULE_NO_EMPTY_DIR,
        severity: input.strict ? 'error' : 'warning',
        file: dirPath,
        title: 'Directory contains no documentation files',
        detail: `"${dir.name}" contains no .md or image files and serves no purpose in the documentation structure. Remove it or add documentation files.`,
      });
      continue;
    }

    // nested-dir-has-index: only relevant for dirs that have .md files; image-only dirs don't need one
    const hasMd = mdFiles.some((e) => e.parentPath === dirPath || e.parentPath.startsWith(dirPath + sep));
    if (!hasMd) {
      continue;
    }

    const hasIndex = mdFiles.some((e) => e.name === 'index.md' && e.parentPath === dirPath);
    if (!hasIndex) {
      diagnostics.push({
        rule: RULE_NESTED_DIR_INDEX,
        severity: 'warning',
        file: dirPath,
        title: 'Subdirectory is missing index.md',
        detail: `"${dir.name}" has no index.md. Without one, it will appear as an unnamed category using a title-cased directory name.`,
      });
    }
  }

  // no-spaces-in-names (error) and valid-file-naming (strict-dependent): applies to file stems and dir names
  const namesToCheck = [
    ...mdFiles.map((e) => ({ slug: e.name.slice(0, -3), label: e.name, path: join(e.parentPath, e.name) })),
    ...dirs.map((e) => ({ slug: e.name, label: e.name, path: join(e.parentPath, e.name) })),
  ];
  for (const item of namesToCheck) {
    if (/\s/.test(item.slug)) {
      diagnostics.push({
        rule: RULE_NO_SPACES,
        severity: 'error',
        file: item.path,
        title: 'Name contains spaces',
        detail: `"${item.label}" contains spaces which break URL slugs. Use hyphens instead.`,
      });
    } else if (!SLUG_SAFE_RE.test(item.slug)) {
      diagnostics.push({
        rule: RULE_VALID_NAMING,
        severity: input.strict ? 'error' : 'warning',
        file: item.path,
        title: 'Name contains non-slug characters',
        detail: `"${item.label}" should use only lowercase letters, digits and hyphens for clean URL slugs.`,
      });
    }
  }

  return diagnostics;
}
