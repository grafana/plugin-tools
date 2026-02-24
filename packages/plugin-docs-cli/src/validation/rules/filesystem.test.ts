import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkFilesystem } from './filesystem.js';

describe('checkFilesystem', () => {
  const testDocsPath = join(__dirname, '..', '..', '__fixtures__', 'test-docs');

  it('should report missing root index.md', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath });

    const finding = findings.find((f) => f.rule === 'root-index-exists');
    expect(finding).toBeDefined();
    expect(finding!.title).toContain('index.md');
  });

  it('should not report has-markdown-files when docs folder has .md files', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath });

    const finding = findings.find((f) => f.rule === 'has-markdown-files');
    expect(finding).toBeUndefined();
  });

  it('should not report when root index.md exists', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      '---\ntitle: Home\ndescription: Home page\nsidebar_position: 1\n---\n# Home\n'
    );

    const findings = await checkFilesystem({ docsPath: tmp });

    expect(findings.find((f) => f.rule === 'root-index-exists')).toBeUndefined();
    expect(findings.find((f) => f.rule === 'has-markdown-files')).toBeUndefined();
  });

  it('should report has-markdown-files when docs path does not exist', async () => {
    const findings = await checkFilesystem({ docsPath: '/nonexistent/path' });

    expect(findings.find((f) => f.rule === 'has-markdown-files')).toBeDefined();
  });

  it('should report has-markdown-files for empty directory', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-empty-'));

    const findings = await checkFilesystem({ docsPath: tmp });

    expect(findings.find((f) => f.rule === 'has-markdown-files')).toBeDefined();
  });
});
