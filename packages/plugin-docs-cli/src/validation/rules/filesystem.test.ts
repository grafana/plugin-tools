import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkFilesystem } from './filesystem.js';

describe('checkFilesystem', () => {
  const testDocsPath = join(__dirname, '..', '..', '__fixtures__', 'test-docs');

  it('should report missing root index.md', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath, strict: true });

    const finding = findings.find((f) => f.rule === 'root-index-exists');
    expect(finding).toBeDefined();
    expect(finding!.title).toContain('index.md');
  });

  it('should not report has-markdown-files when docs folder has .md files', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath, strict: true });

    const finding = findings.find((f) => f.rule === 'has-markdown-files');
    expect(finding).toBeUndefined();
  });

  it('should not report when root index.md exists', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      '---\ntitle: Home\ndescription: Home page\nsidebar_position: 1\n---\n# Home\n'
    );

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === 'root-index-exists')).toBeUndefined();
    expect(findings.find((f) => f.rule === 'has-markdown-files')).toBeUndefined();
  });

  it('should report has-markdown-files when docs path does not exist', async () => {
    const findings = await checkFilesystem({ docsPath: '/nonexistent/path', strict: true });

    expect(findings.find((f) => f.rule === 'has-markdown-files')).toBeDefined();
  });

  it('should report has-markdown-files for empty directory', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-empty-'));

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === 'has-markdown-files')).toBeDefined();
  });

  it('should report nested-dir-has-index when subdir lacks index.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'page.md'), '---\ntitle: Page\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === 'nested-dir-has-index')).toBeDefined();
  });

  it('should not report nested-dir-has-index when subdir has index.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'index.md'), '---\ntitle: Sub\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === 'nested-dir-has-index')).toBeUndefined();
  });

  it('should not report nested-dir-has-index for image-only subdir', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'img'));
    await writeFile(join(tmp, 'img', 'screenshot.png'), '');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === 'nested-dir-has-index')).toBeUndefined();
  });

  it('should not report no-empty-directories for directory with only image files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'images'));
    await writeFile(join(tmp, 'images', 'screenshot.png'), '');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === 'no-empty-directories')).toBeUndefined();
  });

  it('should report no-empty-directories for subdir with no allowed files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'assets'));

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === 'no-empty-directories')).toBeDefined();
  });

  it('should not report no-empty-directories for subdir containing markdown files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'index.md'), '---\ntitle: Sub\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === 'no-empty-directories')).toBeUndefined();
  });

  it('should not report naming rules for files and dirs with safe names', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath, strict: true });

    expect(findings.find((f) => f.rule === 'no-spaces-in-names')).toBeUndefined();
    expect(findings.find((f) => f.rule === 'valid-file-naming')).toBeUndefined();
  });

  it('should report no-spaces-in-names for filename with a space', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'my guide.md'), '---\ntitle: Guide\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

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

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    const finding = findings.find((f) => f.rule === 'no-spaces-in-names' && f.file?.endsWith('my section'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  it('should report valid-file-naming for filename with non-slug characters', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'guide!important.md'), '---\ntitle: Guide\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    const finding = findings.find((f) => f.rule === 'valid-file-naming');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  it('should report valid-file-naming for directory name with uppercase', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'MySection'));
    await writeFile(join(tmp, 'MySection', 'index.md'), '---\ntitle: Section\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    const finding = findings.find((f) => f.rule === 'valid-file-naming' && f.file?.endsWith('MySection'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  describe('non-strict mode', () => {
    it('should report valid-file-naming as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
      await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
      await writeFile(join(tmp, 'guide!important.md'), '---\ntitle: Guide\n---\n');

      const findings = await checkFilesystem({ docsPath: tmp, strict: false });

      const finding = findings.find((f) => f.rule === 'valid-file-naming');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });

    it('should report no-empty-directories as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
      await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
      await mkdir(join(tmp, 'assets'));

      const findings = await checkFilesystem({ docsPath: tmp, strict: false });

      const finding = findings.find((f) => f.rule === 'no-empty-directories');
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });
  });
});
