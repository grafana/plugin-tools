import { readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { extname, join, sep } from 'node:path';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';
import { isMetaFile } from './utils.js';

/**
 * Pages every plugin of a given type must have at the root of its docs folder, so that authors,
 * users and agents find the same information in the same place across every plugin.
 */
const REQUIRED_PAGES: Record<string, string[]> = {
  panel: ['options', 'data-formats', 'troubleshooting'],
  datasource: ['query-editor', 'configuration', 'troubleshooting'],
};

export async function checkRequiredPages(input: ValidationInput): Promise<Diagnostic[]> {
  if (!input.pluginType || !Object.hasOwn(REQUIRED_PAGES, input.pluginType)) {
    return [];
  }
  const required = REQUIRED_PAGES[input.pluginType];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    // docs-path-exists already reports a missing/unreadable docsPath; nothing more to say here.
    return [];
  }

  const rootFiles = entries.filter((e) => e.isFile() && e.parentPath === input.docsPath);
  const rootDirs = entries.filter((e) => e.isDirectory() && e.parentPath === input.docsPath);

  const diagnostics: Diagnostic[] = [];

  for (const name of required) {
    const hasFile = rootFiles.some((e) => e.name === `${name}.md`);
    if (hasFile) {
      continue;
    }

    const dir = rootDirs.find((e) => e.name === name);
    if (!dir) {
      diagnostics.push({
        rule: Rule.RequiredPages,
        severity: 'error',
        title: `Required page "${name}" is missing`,
        detail: `Add "${name}.md" or a "${name}/" folder at the root of your docs folder. Plugins of type "${input.pluginType}" must document this topic under a fixed name, so users and agents can find it consistently across plugins.`,
      });
      continue;
    }

    const dirPath = join(dir.parentPath, dir.name);
    const dirHasPage = entries.some(
      (e) =>
        e.isFile() &&
        extname(e.name).toLowerCase() === '.md' &&
        !isMetaFile(e.name) &&
        (e.parentPath === dirPath || e.parentPath.startsWith(dirPath + sep))
    );
    if (!dirHasPage) {
      diagnostics.push({
        rule: Rule.RequiredPages,
        severity: 'error',
        file: dirPath,
        title: `Required folder "${name}/" has no pages`,
        detail: `"${name}/" exists but contains no markdown page. Add an "index.md" (or other .md page) inside it.`,
      });
    }
  }

  return diagnostics;
}
