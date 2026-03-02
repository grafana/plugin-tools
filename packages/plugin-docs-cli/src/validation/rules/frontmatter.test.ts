import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkFrontmatter } from './frontmatter.js';
import { Rule } from '../types.js';

const input = (docsPath: string) => ({ docsPath, strict: true });

describe('checkFrontmatter', () => {
  it('should report missing required fields', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(join(tmp, 'page.md'), '---\ntitle: Hello\n---\n# Hi\n');

    const findings = await checkFrontmatter(input(tmp));

    const missing = findings.filter((f) => f.rule === Rule.RequiredFields);
    expect(missing).toHaveLength(1);
    expect(missing.map((f) => f.title)).toContain('Missing required field: description');
  });

  it('should report wrong field types', async () => {
    const invalidDocs = join(__dirname, '..', '..', '__fixtures__', 'invalid-frontmatter-docs');
    const findings = await checkFrontmatter(input(invalidDocs));

    const typeErrors = findings.filter((f) => f.rule === Rule.FieldTypes);
    expect(typeErrors.length).toBeGreaterThanOrEqual(3);
    expect(typeErrors.some((f) => f.title.includes('title'))).toBe(true);
    expect(typeErrors.some((f) => f.title.includes('description'))).toBe(true);
    expect(typeErrors.some((f) => f.title.includes('sidebar_position'))).toBe(true);
  });

  it('should report invalid custom slug', async () => {
    const unsafeDocs = join(__dirname, '..', '..', '__fixtures__', 'unsafe-slug-docs');
    const findings = await checkFrontmatter(input(unsafeDocs));

    const slugWarning = findings.find((f) => f.rule === Rule.ValidSlug);
    expect(slugWarning).toBeDefined();
    expect(slugWarning!.severity).toBe('warning');
  });

  it('should not report for valid frontmatter without h1', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      '---\ntitle: Home\ndescription: Welcome\nsidebar_position: 1\n---\n## Introduction\n'
    );

    const findings = await checkFrontmatter(input(tmp));
    expect(findings).toHaveLength(0);
  });

  it('should not report slug warning when slug is valid', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(
      join(tmp, 'page.md'),
      '---\ntitle: Page\ndescription: A page\nsidebar_position: 1\nslug: custom-slug\n---\n## Content\n'
    );

    const findings = await checkFrontmatter(input(tmp));
    expect(findings).toHaveLength(0);
  });

  it('should include line numbers for wrong field types', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    // title on line 2, description on line 3
    await writeFile(join(tmp, 'page.md'), '---\ntitle: 123\ndescription: Valid\nsidebar_position: 1\n---\n');

    const findings = await checkFrontmatter(input(tmp));
    const titleError = findings.find((f) => f.rule === Rule.FieldTypes && f.title.includes('title'));
    expect(titleError).toBeDefined();
    expect(titleError!.line).toBe(2);
  });

  it('should report h1 heading in body', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(
      join(tmp, 'page.md'),
      '---\ntitle: Page\ndescription: A page\nsidebar_position: 1\n---\n\n# Big Heading\n'
    );

    const findings = await checkFrontmatter(input(tmp));
    const h1 = findings.find((f) => f.rule === Rule.NoH1);
    expect(h1).toBeDefined();
    expect(h1!.severity).toBe('warning');
    expect(h1!.line).toBe(7);
  });

  it('should not report h2 or lower headings', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(
      join(tmp, 'page.md'),
      '---\ntitle: Page\ndescription: A page\nsidebar_position: 1\n---\n## Fine\n### Also fine\n'
    );

    const findings = await checkFrontmatter(input(tmp));
    expect(findings.find((f) => f.rule === Rule.NoH1)).toBeUndefined();
  });

  it('should check files in subdirectories', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'page.md'), '---\n---\n');

    const findings = await checkFrontmatter(input(tmp));

    const missing = findings.filter((f) => f.rule === Rule.RequiredFields);
    expect(missing).toHaveLength(2);
    expect(missing[0].file).toContain('sub');
  });

  it('should return empty for nonexistent path', async () => {
    const findings = await checkFrontmatter(input('/nonexistent/path'));
    expect(findings).toHaveLength(0);
  });

  it('should report frontmatter-block-exists when file has no frontmatter', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(join(tmp, 'page.md'), '# Just a heading\n\nNo frontmatter here.\n');

    const findings = await checkFrontmatter(input(tmp));

    const finding = findings.find((f) => f.rule === Rule.BlockExists);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
    expect(finding!.line).toBe(1);
  });

  it('should not report frontmatter-block-exists when file starts with ---', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(
      join(tmp, 'page.md'),
      '---\ntitle: Page\ndescription: A page\nsidebar_position: 1\n---\n## Content\n'
    );

    const findings = await checkFrontmatter(input(tmp));
    expect(findings.find((f) => f.rule === Rule.BlockExists)).toBeUndefined();
  });

  it('should report frontmatter-valid-yaml for invalid YAML', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await writeFile(join(tmp, 'page.md'), '---\ntitle: [unclosed\n---\n## Content\n');

    const findings = await checkFrontmatter(input(tmp));

    const finding = findings.find((f) => f.rule === Rule.ValidYaml);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  it('should report no-duplicate-sidebar-position for siblings with same position', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    const fm = (pos: number) => `---\ntitle: Page\ndescription: A page\nsidebar_position: ${pos}\n---\n`;
    await writeFile(join(tmp, 'a.md'), fm(1));
    await writeFile(join(tmp, 'b.md'), fm(1));

    const findings = await checkFrontmatter(input(tmp));

    const dups = findings.filter((f) => f.rule === Rule.DuplicatePosition);
    expect(dups).toHaveLength(2);
    expect(dups[0].title).toContain('1');
    const files = dups.map((d) => d.file);
    expect(files).toContain('a.md');
    expect(files).toContain('b.md');
  });

  it('should report no-duplicate-sidebar-position for all three files when three siblings share a position', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    const fm = (pos: number) => `---\ntitle: Page\ndescription: A page\nsidebar_position: ${pos}\n---\n`;
    await writeFile(join(tmp, 'a.md'), fm(1));
    await writeFile(join(tmp, 'b.md'), fm(1));
    await writeFile(join(tmp, 'c.md'), fm(1));

    const findings = await checkFrontmatter(input(tmp));

    const dups = findings.filter((f) => f.rule === Rule.DuplicatePosition);
    expect(dups).toHaveLength(3);
    const files = dups.map((d) => d.file);
    expect(files).toContain('a.md');
    expect(files).toContain('b.md');
    expect(files).toContain('c.md');
  });

  it('should not report no-duplicate-sidebar-position for unique positions', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    const fm = (pos: number) => `---\ntitle: Page\ndescription: A page\nsidebar_position: ${pos}\n---\n`;
    await writeFile(join(tmp, 'a.md'), fm(1));
    await writeFile(join(tmp, 'b.md'), fm(2));

    const findings = await checkFrontmatter(input(tmp));
    expect(findings.find((f) => f.rule === Rule.DuplicatePosition)).toBeUndefined();
  });

  it('should report no-duplicate-sidebar-position as warning in non-strict mode', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    const fm = (pos: number) => `---\ntitle: Page\ndescription: A page\nsidebar_position: ${pos}\n---\n`;
    await writeFile(join(tmp, 'a.md'), fm(1));
    await writeFile(join(tmp, 'b.md'), fm(1));

    const findings = await checkFrontmatter({ docsPath: tmp, strict: false });

    const dup = findings.find((f) => f.rule === Rule.DuplicatePosition);
    expect(dup).toBeDefined();
    expect(dup!.severity).toBe('warning');
  });

  it('should not report no-duplicate-sidebar-position for same position in different dirs', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    await mkdir(join(tmp, 'sub'));
    const fm = (pos: number) => `---\ntitle: Page\ndescription: A page\nsidebar_position: ${pos}\n---\n`;
    await writeFile(join(tmp, 'a.md'), fm(1));
    await writeFile(join(tmp, 'sub', 'b.md'), fm(1));

    const findings = await checkFrontmatter(input(tmp));
    expect(findings.find((f) => f.rule === Rule.DuplicatePosition)).toBeUndefined();
  });

  it('should report no-duplicate-slugs for two files with the same custom slug', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    const fm = (pos: number) =>
      `---\ntitle: Page\ndescription: A page\nsidebar_position: ${pos}\nslug: same-slug\n---\n`;
    await writeFile(join(tmp, 'a.md'), fm(1));
    await writeFile(join(tmp, 'b.md'), fm(2));

    const findings = await checkFrontmatter(input(tmp));

    const dups = findings.filter((f) => f.rule === Rule.DuplicateSlug);
    expect(dups).toHaveLength(2);
    expect(dups[0].severity).toBe('error');
    expect(dups[0].title).toContain('same-slug');
    const files = dups.map((d) => d.file);
    expect(files).toContain('a.md');
    expect(files).toContain('b.md');
  });

  it('should not report no-duplicate-slugs for unique custom slugs', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'fm-test-'));
    const fm = (pos: number, slug: string) =>
      `---\ntitle: Page\ndescription: A page\nsidebar_position: ${pos}\nslug: ${slug}\n---\n`;
    await writeFile(join(tmp, 'a.md'), fm(1, 'slug-one'));
    await writeFile(join(tmp, 'b.md'), fm(2, 'slug-two'));

    const findings = await checkFrontmatter(input(tmp));
    expect(findings.find((f) => f.rule === Rule.DuplicateSlug)).toBeUndefined();
  });
});
