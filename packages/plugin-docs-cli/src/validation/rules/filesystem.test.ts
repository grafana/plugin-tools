import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
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

  it('should report nested-dir-has-index for subdirectory without index.md', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath });

    // img/ has no .md files at all, so it definitely has no index.md
    const finding = findings.find((f) => f.rule === 'nested-dir-has-index' && f.file?.endsWith('img'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('warning');
  });

  it('should not report nested-dir-has-index for subdirectory with index.md', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath });

    // config/ has an index.md directly inside it
    const finding = findings.find((f) => f.rule === 'nested-dir-has-index' && f.file?.endsWith('config'));
    expect(finding).toBeUndefined();
  });

  it('should report nested-dir-has-index when subdir lacks index.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'page.md'), '---\ntitle: Page\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp });

    expect(findings.find((f) => f.rule === 'nested-dir-has-index')).toBeDefined();
  });

  it('should not report nested-dir-has-index when subdir has index.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'index.md'), '---\ntitle: Sub\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp });

    expect(findings.find((f) => f.rule === 'nested-dir-has-index')).toBeUndefined();
  });

  it('should report no-empty-directories for directory with no markdown files', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath });

    // img/ contains only test.png, no .md files
    const finding = findings.find((f) => f.rule === 'no-empty-directories' && f.file?.endsWith('img'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('warning');
  });

  it('should not report no-empty-directories for directory with markdown files', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath });

    // config/ has several .md files
    const finding = findings.find((f) => f.rule === 'no-empty-directories' && f.file?.endsWith('config'));
    expect(finding).toBeUndefined();
  });

  it('should report no-empty-directories for subdir with no markdown files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'assets'));

    const findings = await checkFilesystem({ docsPath: tmp });

    expect(findings.find((f) => f.rule === 'no-empty-directories')).toBeDefined();
  });

  it('should not report no-empty-directories for subdir containing markdown files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'index.md'), '---\ntitle: Sub\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp });

    expect(findings.find((f) => f.rule === 'no-empty-directories')).toBeUndefined();
  });

  it('should not report naming rules for files and dirs with safe names', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath });

    expect(findings.find((f) => f.rule === 'no-spaces-in-names')).toBeUndefined();
    expect(findings.find((f) => f.rule === 'valid-file-naming')).toBeUndefined();
  });

  it('should report no-spaces-in-names for filename with a space', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'my guide.md'), '---\ntitle: Guide\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp });

    const finding = findings.find((f) => f.rule === 'no-spaces-in-names');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
    expect(finding!.file).toContain('my guide.md');
  });

  it('should report no-spaces-in-names for directory name with a space', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'my section'));
    await writeFile(join(tmp, 'my section', 'index.md'), '---\ntitle: Section\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp });

    const finding = findings.find((f) => f.rule === 'no-spaces-in-names' && f.file?.endsWith('my section'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  it('should report valid-file-naming for filename with non-slug characters', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'guide!important.md'), '---\ntitle: Guide\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp });

    const finding = findings.find((f) => f.rule === 'valid-file-naming');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('info');
  });

  it('should report valid-file-naming for directory name with uppercase', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'MySection'));
    await writeFile(join(tmp, 'MySection', 'index.md'), '---\ntitle: Section\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp });

    const finding = findings.find((f) => f.rule === 'valid-file-naming' && f.file?.endsWith('MySection'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('info');
  });
});
