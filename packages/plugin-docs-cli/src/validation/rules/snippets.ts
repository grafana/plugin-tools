import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, relative } from 'node:path';
import {
  SNIPPET_NAMES,
  readSnippets,
  renderSnippet,
  type SnippetProblem,
  type SnippetValues,
} from '@grafana/plugin-docs-parser';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';
import { isInExcludedFolder, isMetaFile } from './utils.js';

const knownNames = new Set<string>(SNIPPET_NAMES);

function describeProblem(problem: SnippetProblem): { title: string; detail: string } {
  switch (problem.kind) {
    case 'misplaced':
      return {
        title: 'Snippet marker not on its own line',
        detail:
          'Put the snippet marker alone on its own line, with a blank line before it, outside lists, quotes and <details> blocks. Otherwise it is ignored.',
      };
    case 'nested':
      return {
        title: 'Nested snippet',
        detail: `Close the "${problem.openName}" snippet before this one opens. Snippets can't be nested.`,
      };
    case 'unopened':
      return {
        title: 'Snippet closed without being opened',
        detail: `Add <!-- snippet:${problem.name} --> where the snippet starts, or remove this marker.`,
      };
    case 'mismatched':
      return {
        title: 'Snippet closed with the wrong name',
        detail: `This marker closes "${problem.name}", but the open snippet is "${problem.openName}". Use <!-- /snippet:${problem.openName} -->.`,
      };
    case 'unclosed':
      return {
        title: 'Unclosed snippet',
        detail: `Add <!-- /snippet:${problem.name} --> where the snippet ends.`,
      };
    case 'heading':
      return {
        title: 'Heading inside a snippet',
        detail: `Move this heading out of the "${problem.name}" snippet. A snippet can't contain headings.`,
      };
  }
}

/**
 * Returns the 1-based line numbers of the snippets the parser swaps for their current text, markers
 * included. The text there is maintained by Grafana, not by the plugin author.
 */
export function getSnippetLines(content: string, values?: SnippetValues): Set<number> {
  const lines = new Set<number>();
  const { snippets, problems } = readSnippets(content);
  if (problems.length > 0) {
    return lines;
  }
  for (const snippet of snippets) {
    if (renderSnippet(snippet.name, values) === undefined) {
      continue;
    }
    for (let line = snippet.startLine; line <= snippet.endLine; line++) {
      lines.add(line);
    }
  }
  return lines;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Checks snippet markers:
 *
 * - `known-snippet`: an opening marker names a snippet the parser doesn't know.
 * - `valid-snippet-block`: a marker the parser ignores, markers that don't pair up or a heading inside
 *   a snippet. One such problem keeps the fallback text of every snippet on the page.
 * - `snippet-text-current`: the fallback text differs from the snippet's current text. This is info,
 *   since grafana.com shows the current text either way.
 *
 * None of them fail `validate`. The page still renders its fallback text, and an older CLI doesn't
 * know the snippets a newer `create-plugin` scaffolds.
 */
export async function checkSnippets(input: ValidationInput): Promise<Diagnostic[]> {
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
      !isInExcludedFolder(relative(input.docsPath, e.parentPath))
  );

  for (const file of mdFiles) {
    const absolutePath = join(file.parentPath, file.name);
    const relativePath = relative(input.docsPath, absolutePath);
    let content: string;
    try {
      content = await readFile(absolutePath, 'utf-8');
    } catch {
      continue;
    }

    const { snippets, problems } = readSnippets(content);
    for (const problem of problems) {
      diagnostics.push({
        rule: Rule.ValidSnippetBlock,
        severity: 'warning',
        file: relativePath,
        line: problem.line,
        ...describeProblem(problem),
      });
    }

    const lines = content.split('\n');
    for (const snippet of snippets) {
      if (!knownNames.has(snippet.name)) {
        diagnostics.push({
          rule: Rule.KnownSnippet,
          severity: 'warning',
          file: relativePath,
          line: snippet.startLine,
          title: 'Unknown snippet',
          detail: `There is no snippet named "${snippet.name}". Check the name against the snippets guide, or remove both markers to keep the text as your own.`,
        });
        continue;
      }

      const current = renderSnippet(snippet.name, input.snippetValues);
      const fallback = lines.slice(snippet.startLine, snippet.endLine - 1).join('\n');
      if (current !== undefined && collapseWhitespace(current) !== collapseWhitespace(fallback)) {
        diagnostics.push({
          rule: Rule.SnippetTextCurrent,
          severity: 'info',
          file: relativePath,
          line: snippet.startLine,
          title: 'Snippet text is out of date',
          detail: `The text inside the "${snippet.name}" snippet differs from its current text. grafana.com shows the current text, so this is only what GitHub and older viewers show. To update it, replace the text between the markers with the current text from the snippets guide.`,
        });
      }
    }
  }

  return diagnostics;
}
