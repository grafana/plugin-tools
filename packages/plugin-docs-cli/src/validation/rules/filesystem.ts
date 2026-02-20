import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Finding, RuleDefinition, ValidationInput } from '../types.js';

export const filesystemDefinitions: RuleDefinition[] = [
  {
    id: 'root-index-exists',
    severity: 'error',
  },
  {
    id: 'has-markdown-files',
    severity: 'error',
  },
];

export async function checkFilesystem(input: ValidationInput): Promise<Finding[]> {
  const findings: Finding[] = [];

  // check for at least one .md file
  let hasMarkdown = false;
  try {
    const entries = await readdir(input.docsPath, { recursive: true });
    hasMarkdown = entries.some((entry) => entry.endsWith('.md'));
  } catch {
    // docsPath doesn't exist or isn't readable - will be caught by has-markdown-files
  }

  if (!hasMarkdown) {
    findings.push({
      rule: 'has-markdown-files',
      title: 'Docs folder must contain at least one .md file',
      detail:
        'The docs folder must contain at least one markdown file. Add markdown files with valid frontmatter to get started.',
    });
  }

  // check for root index.md
  try {
    await access(join(input.docsPath, 'index.md'));
  } catch {
    findings.push({
      rule: 'root-index-exists',
      title: 'Root index.md must exist',
      detail:
        'The docs folder must contain an index.md file at its root. This serves as the landing page for your plugin documentation.',
    });
  }

  return findings;
}
