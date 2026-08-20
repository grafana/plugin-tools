import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';
import { isMetaFile } from './utils.js';

// matches the opening marker of a section-brief authoring-guidance block,
// scaffolded by `create-plugin add panel-docs`/`datasource-docs` as a
// placeholder for the author to replace with real content.
const SECTION_BRIEF_START_RE = /<!--\s*section-brief:start\s*-->/;

/**
 * Checks that no page still contains an unfilled `section-brief` block. A
 * remaining marker means the author never replaced the scaffolded guidance
 * with real documentation, so the page shouldn't ship as-is.
 */
export async function checkStubContent(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    return diagnostics;
  }

  const mdFiles = entries.filter(
    (e) =>
      e.isFile() &&
      e.name.endsWith('.md') &&
      !isMetaFile(e.name) &&
      !e.parentPath.includes('node_modules') &&
      !e.parentPath.includes('dist')
  );

  for (const file of mdFiles) {
    const absolutePath = join(file.parentPath, file.name);
    const relativePath = relative(input.docsPath, absolutePath);
    let raw: string;
    try {
      raw = await readFile(absolutePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = raw.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!SECTION_BRIEF_START_RE.test(lines[i])) {
        continue;
      }
      diagnostics.push({
        rule: Rule.UnfilledSectionBrief,
        severity: input.strict ? 'error' : 'warning',
        file: relativePath,
        line: i + 1,
        title: 'Unfilled documentation stub',
        detail:
          "This section still has scaffolded authoring guidance (<!-- section-brief -->) instead of real content. Replace it with your plugin's actual documentation and remove the marker.",
      });
    }
  }

  return diagnostics;
}
