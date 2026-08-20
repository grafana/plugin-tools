import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkStubContent } from './stub-content.js';
import { Rule } from '../types.js';

const input = (docsPath: string, strict = true) => ({ docsPath, strict });

// helper: valid frontmatter markdown file content
const md = (body = '') => `---\ntitle: Page\ndescription: A page\n---\n${body}`;

describe('checkStubContent', () => {
  it('should return empty for nonexistent path', async () => {
    const findings = await checkStubContent(input('/nonexistent/path'));
    expect(findings).toHaveLength(0);
  });

  it('should report a remaining section-brief marker', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      md('## Features\n\n<!-- section-brief:start -->\n\nFill this in.\n\n<!-- section-brief:end -->\n')
    );

    const findings = await checkStubContent(input(tmp));
    const finding = findings.find((f) => f.rule === Rule.UnfilledSectionBrief);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('error');
  });

  it('should report as warning in non-strict mode', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md('<!-- section-brief:start -->\n'));

    const findings = await checkStubContent(input(tmp, false));
    const finding = findings.find((f) => f.rule === Rule.UnfilledSectionBrief);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('warning');
  });

  it('should include the line number of the marker', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md('\n\n<!-- section-brief:start -->\n'));

    const findings = await checkStubContent(input(tmp));
    const finding = findings.find((f) => f.rule === Rule.UnfilledSectionBrief);
    expect(finding).toBeDefined();
    expect(finding!.line).toBeGreaterThan(1);
  });

  it('should report every remaining marker in a file with multiple sections', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(
      join(tmp, 'index.md'),
      md(
        '<!-- section-brief:start -->\nFill this in.\n<!-- section-brief:end -->\n\n<!-- section-brief:start -->\nAnd this.\n<!-- section-brief:end -->\n'
      )
    );

    const findings = await checkStubContent(input(tmp));
    expect(findings.filter((f) => f.rule === Rule.UnfilledSectionBrief)).toHaveLength(2);
  });

  it('should not report a page with no section-brief markers', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md('## Features\n\nThis panel does real things.\n'));

    const findings = await checkStubContent(input(tmp));
    expect(findings.find((f) => f.rule === Rule.UnfilledSectionBrief)).toBeUndefined();
  });

  it('should not report meta files like README.md', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'README.md'), '# Docs\n\n<!-- section-brief:start -->\n');

    const findings = await checkStubContent(input(tmp));
    expect(findings.find((f) => f.rule === Rule.UnfilledSectionBrief)).toBeUndefined();
  });

  it('should check all markdown files', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'stub-test-'));
    await writeFile(join(tmp, 'index.md'), md('<!-- section-brief:start -->\n'));
    await writeFile(join(tmp, 'options.md'), md('<!-- section-brief:start -->\n'));

    const findings = await checkStubContent(input(tmp));
    const files = findings.filter((f) => f.rule === Rule.UnfilledSectionBrief).map((f) => f.file);
    expect(files).toContain('index.md');
    expect(files).toContain('options.md');
  });
});
