import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkFilesystem } from './filesystem.js';
import { Rule } from '../types.js';

describe('checkFilesystem', () => {
  const testDocsPath = join(__dirname, '..', '..', '__fixtures__', 'test-docs');

  it('should report missing root index.md', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath, strict: true });

    const finding = findings.find((f) => f.rule === Rule.RootIndex);
    expect(finding).toBeDefined();
    expect(finding!.title).toContain('index.md');
  });

  it('should not report has-markdown-files when docs folder has .md files', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath, strict: true });

    const finding = findings.find((f) => f.rule === Rule.HasMarkdown);
    expect(finding).toBeUndefined();
  });

  it('should not report when root index.md exists', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      '---\ntitle: Home\ndescription: Home page\nsidebar_position: 1\n---\n# Home\n'
    );

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.RootIndex)).toBeUndefined();
    expect(findings.find((f) => f.rule === Rule.HasMarkdown)).toBeUndefined();
  });

  it('should report has-markdown-files when docs path does not exist', async () => {
    const findings = await checkFilesystem({ docsPath: '/nonexistent/path', strict: true });

    expect(findings.find((f) => f.rule === Rule.HasMarkdown)).toBeDefined();
  });

  it('should report has-markdown-files for empty directory', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-empty-'));

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.HasMarkdown)).toBeDefined();
  });

  it('should report nested-dir-has-index when subdir lacks index.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'page.md'), '---\ntitle: Page\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.NestedDirIndex)).toBeDefined();
  });

  it('should not report nested-dir-has-index when subdir has index.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'index.md'), '---\ntitle: Sub\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.NestedDirIndex)).toBeUndefined();
  });

  it('should not report nested-dir-has-index for image-only subdir', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'img'));
    await writeFile(join(tmp, 'img', 'screenshot.png'), '');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.NestedDirIndex)).toBeUndefined();
  });

  it('should not report no-empty-directories for directory with only image files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'images'));
    await writeFile(join(tmp, 'images', 'screenshot.png'), '');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.NoEmptyDir)).toBeUndefined();
  });

  it('should report no-empty-directories for subdir with no allowed files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'assets'));

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.NoEmptyDir)).toBeDefined();
  });

  it('should not report no-empty-directories for subdir containing markdown files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'index.md'), '---\ntitle: Sub\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.NoEmptyDir)).toBeUndefined();
  });

  it('should not report naming rules for files and dirs with safe names', async () => {
    const findings = await checkFilesystem({ docsPath: testDocsPath, strict: true });

    expect(findings.find((f) => f.rule === Rule.NoSpaces)).toBeUndefined();
    expect(findings.find((f) => f.rule === Rule.ValidNaming)).toBeUndefined();
  });

  it('should report no-spaces-in-names for filename with a space', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'my guide.md'), '---\ntitle: Guide\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    const finding = findings.find((f) => f.rule === Rule.NoSpaces);
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

    const finding = findings.find((f) => f.rule === Rule.NoSpaces && f.file?.endsWith('my section'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  it('should report valid-file-naming for filename with non-slug characters', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'guide!important.md'), '---\ntitle: Guide\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    const finding = findings.find((f) => f.rule === Rule.ValidNaming);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  it('should report valid-file-naming for directory name with uppercase', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await mkdir(join(tmp, 'MySection'));
    await writeFile(join(tmp, 'MySection', 'index.md'), '---\ntitle: Section\n---\n');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    const finding = findings.find((f) => f.rule === Rule.ValidNaming && f.file?.endsWith('MySection'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  describe('non-strict mode', () => {
    it('should report valid-file-naming as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
      await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
      await writeFile(join(tmp, 'guide!important.md'), '---\ntitle: Guide\n---\n');

      const findings = await checkFilesystem({ docsPath: tmp, strict: false });

      const finding = findings.find((f) => f.rule === Rule.ValidNaming);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });

    it('should report no-empty-directories as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
      await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
      await mkdir(join(tmp, 'assets'));

      const findings = await checkFilesystem({ docsPath: tmp, strict: false });

      const finding = findings.find((f) => f.rule === Rule.NoEmptyDir);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });
  });

  it('should report no-symlinks for a symlinked file', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    const target = join(tmp, 'index.md');
    await symlink(target, join(tmp, 'link.md'));

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    const finding = findings.find((f) => f.rule === Rule.NoSymlinks);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
    expect(finding!.file).toContain('link.md');
  });

  it('should report allowed-file-types as error in strict mode for disallowed extension', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'config.json'), '{}');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    const finding = findings.find((f) => f.rule === Rule.AllowedFileTypes);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
    expect(finding!.file).toContain('config.json');
  });

  it('should report allowed-file-types as info in non-strict mode', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'notes.txt'), 'some notes');

    const findings = await checkFilesystem({ docsPath: tmp, strict: false });

    const finding = findings.find((f) => f.rule === Rule.AllowedFileTypes);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('info');
  });

  it('should not report allowed-file-types for permitted image formats', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'docs-test-'));
    await mkdir(join(tmp, 'img'));
    await writeFile(join(tmp, 'index.md'), '---\ntitle: Home\n---\n');
    await writeFile(join(tmp, 'img', 'screenshot.png'), '');
    await writeFile(join(tmp, 'img', 'photo.jpg'), '');
    await writeFile(join(tmp, 'img', 'animation.gif'), '');

    const findings = await checkFilesystem({ docsPath: tmp, strict: true });

    expect(findings.find((f) => f.rule === Rule.AllowedFileTypes)).toBeUndefined();
  });
});
