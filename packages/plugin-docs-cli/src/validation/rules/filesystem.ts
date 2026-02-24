import { readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, sep } from 'node:path';
import type { Diagnostic, ValidationInput } from '../types.js';

const RULE_HAS_MARKDOWN = 'has-markdown-files';
const RULE_ROOT_INDEX = 'root-index-exists';
const RULE_NESTED_DIR_INDEX = 'nested-dir-has-index';
const RULE_NO_SPACES = 'no-spaces-in-names';
const RULE_VALID_NAMING = 'valid-file-naming';
const RULE_NO_EMPTY_DIR = 'no-empty-directories';

// slug-safe: lowercase letters, digits and hyphens only
const SLUG_SAFE_RE = /^[a-z0-9-]+$/;

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

    // nested-dir-has-index: subdirectories without index.md become unnamed categories
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

    // no-empty-directories: directories with no .md files at any depth serve no purpose
    const hasMd = mdFiles.some((e) => e.parentPath === dirPath || e.parentPath.startsWith(dirPath + sep));
    if (!hasMd) {
      diagnostics.push({
        rule: RULE_NO_EMPTY_DIR,
        severity: 'warning',
        file: dirPath,
        title: 'Directory contains no markdown files',
        detail: `"${dir.name}" contains no .md files and serves no purpose in the documentation structure. Remove it or add documentation files.`,
      });
    }
  }

  // no-spaces-in-names (error) and valid-file-naming (info): applies to file stems and dir names
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
        severity: 'info',
        file: item.path,
        title: 'Name contains non-slug characters',
        detail: `"${item.label}" should use only lowercase letters, digits and hyphens for clean URL slugs.`,
      });
    }
  }

  return diagnostics;
}
