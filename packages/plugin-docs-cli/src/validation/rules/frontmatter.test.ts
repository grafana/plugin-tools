import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkFrontmatter } from './frontmatter.js';

const input = (docsPath: string) => ({ docsPath, strict: true });

describe('checkFrontmatter', () => {
  it('should report missing required fields', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(join(tmp, 'page.md'), '---\ntitle: Hello\n---\n# Hi\n');

    const findings = await checkFrontmatter(input(tmp));

    const missing = findings.filter((f) => f.rule === 'frontmatter-required-fields');
    expect(missing).toHaveLength(2);
    expect(missing.map((f) => f.title)).toContain('Missing required field: description');
    expect(missing.map((f) => f.title)).toContain('Missing required field: sidebar_position');
  });

  it('should report wrong field types', async () => {
    const invalidDocs = join(__dirname, '..', '..', '__fixtures__', 'invalid-frontmatter-docs');
    const findings = await checkFrontmatter(input(invalidDocs));

    const typeErrors = findings.filter((f) => f.rule === 'frontmatter-field-types');
    expect(typeErrors.length).toBeGreaterThanOrEqual(3);
    expect(typeErrors.some((f) => f.title.includes('title'))).toBe(true);
    expect(typeErrors.some((f) => f.title.includes('description'))).toBe(true);
    expect(typeErrors.some((f) => f.title.includes('sidebar_position'))).toBe(true);
  });

  it('should report invalid custom slug', async () => {
    const unsafeDocs = join(__dirname, '..', '..', '__fixtures__', 'unsafe-slug-docs');
    const findings = await checkFrontmatter(input(unsafeDocs));

    const slugWarning = findings.find((f) => f.rule === 'frontmatter-valid-slug');
    expect(slugWarning).toBeDefined();
    expect(slugWarning!.severity).toBe('warning');
  });

  it('should not report for valid frontmatter', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      '---\ntitle: Home\ndescription: Welcome\nsidebar_position: 1\n---\n# Home\n'
    );

    const findings = await checkFrontmatter(input(tmp));
    expect(findings).toHaveLength(0);
  });

  it('should not report slug warning when slug is valid', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(
      join(tmp, 'page.md'),
      '---\ntitle: Page\ndescription: A page\nsidebar_position: 1\nslug: custom-slug\n---\n# Page\n'
    );

    const findings = await checkFrontmatter(input(tmp));
    expect(findings).toHaveLength(0);
  });

  it('should check files in subdirectories', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'page.md'), '---\n---\n# Empty frontmatter\n');

    const findings = await checkFrontmatter(input(tmp));

    const missing = findings.filter((f) => f.rule === 'frontmatter-required-fields');
    expect(missing).toHaveLength(3);
    expect(missing[0].file).toContain('sub');
  });

  it('should return empty for nonexistent path', async () => {
    const findings = await checkFrontmatter(input('/nonexistent/path'));
    expect(findings).toHaveLength(0);
  });
});
