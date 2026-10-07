import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkCrossFile } from './cross-file.js';
import { Rule } from '../types.js';

const input = (docsPath: string, strict = true) => ({ docsPath, strict });

const md = (body = '') => `---\ntitle: Page\ndescription: A page\n---\n${body}`;

describe('checkCrossFile', () => {
  it('should return empty for nonexistent path', async () => {
    const findings = await checkCrossFile(input('/nonexistent/path'));
    expect(findings).toHaveLength(0);
  });

  it('should return empty for docs with no links', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
    await writeFile(join(tmp, 'index.md'), md('## Hello\n\nSome content.'));

    const findings = await checkCrossFile(input(tmp));
    expect(findings).toHaveLength(0);
  });

  // --- internal-links-resolve ---

  describe('internal-links-resolve', () => {
    it('should report an unresolved link through a reference definition', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'cross-test-'));
      await writeFile(join(tmp, 'index.md'), md('Refer to [Setup][setup].\n\n[setup]: ./missing.md\n'));

      const findings = await checkCrossFile(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.InternalLinksResolve);
      expect(finding).toBeDefined();
      expect(finding!.line).toBe(7);
    });

    it('should not treat an image reference definition as a page link', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'cross-test-'));
      await writeFile(join(tmp, 'index.md'), md('![Shot][shot]\n\n[shot]: img/shot.png\n'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksResolve)).toBeUndefined();
    });

    it('should resolve ../ links from a nested page', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await mkdir(join(tmp, 'options'));
      await writeFile(join(tmp, 'examples.md'), md('## Examples'));
      await writeFile(join(tmp, 'options', 'legend.md'), md('[examples](../examples.md)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.InternalLinksResolve)).toHaveLength(0);
    });

    it('should ignore a query string when resolving a link', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await mkdir(join(tmp, 'options'));
      await writeFile(join(tmp, 'examples.md'), md('## Examples'));
      await writeFile(
        join(tmp, 'options', 'legend.md'),
        md('[up](../examples.md?preview=1) [side](./legend.md?x=1#top)')
      );

      const findings = await checkCrossFile(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.InternalLinksResolve)).toHaveLength(0);
    });

    it('should resolve percent-encoded links to the decoded file', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await mkdir(join(tmp, 'options'));
      await writeFile(join(tmp, 'examples.md'), md('## Examples'));
      await writeFile(join(tmp, 'my page.md'), md('## Page'));
      await writeFile(join(tmp, 'options', 'legend.md'), md('[a](../examples%2Emd) [b](../my%20page.md)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.InternalLinksResolve)).toHaveLength(0);
    });

    it('should report a broken ../ link from a nested page', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await mkdir(join(tmp, 'options'));
      await writeFile(join(tmp, 'options', 'legend.md'), md('[missing](../missing.md)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.InternalLinksResolve)).toHaveLength(1);
    });

    it('should leave links that escape the docs folder to no-path-traversal', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[readme](../README.md)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.filter((f) => f.rule === Rule.InternalLinksResolve)).toHaveLength(0);
    });

    it('should not report when linked file exists', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[other](other.md)'));
      await writeFile(join(tmp, 'other.md'), md('## Other'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksResolve)).toBeUndefined();
    });

    it('should not report when linked file exists with ./ prefix', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[other](./other.md)'));
      await writeFile(join(tmp, 'other.md'), md('## Other'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksResolve)).toBeUndefined();
    });

    it('should report when linked file does not exist', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[missing](missing.md)'));

      const findings = await checkCrossFile(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.InternalLinksResolve);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
      expect(finding!.detail).toContain('missing.md');
    });

    it('should report as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[missing](missing.md)'));

      const findings = await checkCrossFile(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.InternalLinksResolve);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });

    it('should resolve links relative to the source file', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('## Home'));
      await mkdir(join(tmp, 'sub'));
      await writeFile(join(tmp, 'sub', 'page.md'), md('[sibling](sibling.md)'));
      await writeFile(join(tmp, 'sub', 'sibling.md'), md('## Sibling'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksResolve)).toBeUndefined();
    });

    it('should report when sibling link does not resolve', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await mkdir(join(tmp, 'sub'));
      await writeFile(join(tmp, 'sub', 'page.md'), md('[ghost](ghost.md)'));

      const findings = await checkCrossFile(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.InternalLinksResolve);
      expect(finding).toBeDefined();
      expect(finding!.file).toContain('page.md');
    });

    it('should include line number', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('\n\n[missing](gone.md)\n'));

      const findings = await checkCrossFile(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.InternalLinksResolve);
      expect(finding).toBeDefined();
      expect(finding!.line).toBeDefined();
      expect(finding!.line).toBeGreaterThan(1);
    });

    it('should skip external URLs', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[external](https://example.com)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksResolve)).toBeUndefined();
    });

    it('should skip image references', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('![alt](missing-image.png)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksResolve)).toBeUndefined();
    });

    it('should not report links inside code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('```\n[missing](gone.md)\n```'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.InternalLinksResolve)).toBeUndefined();
    });

    it('should handle links to non-md files', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[download](file.zip)'));

      const findings = await checkCrossFile(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.InternalLinksResolve);
      expect(finding).toBeDefined();
    });
  });

  // --- anchor-links-resolve ---

  describe('anchor-links-resolve', () => {
    it('should not report valid same-file anchor', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('## Getting Started\n\n[jump](#getting-started)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AnchorLinksResolve)).toBeUndefined();
    });

    it('should report invalid same-file anchor in strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('## Hello\n\n[jump](#nonexistent)'));

      const findings = await checkCrossFile(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.AnchorLinksResolve);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('error');
      expect(finding!.detail).toContain('#nonexistent');
    });

    it('should report anchor as warning in non-strict mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('## Hello\n\n[jump](#nonexistent)'));

      const findings = await checkCrossFile(input(tmp, false));

      const finding = findings.find((f) => f.rule === Rule.AnchorLinksResolve);
      expect(finding).toBeDefined();
      expect(finding!.severity).toBe('warning');
    });

    it('should not report valid cross-file anchor', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[jump](other.md#setup)'));
      await writeFile(join(tmp, 'other.md'), md('## Setup\n\nContent here.'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AnchorLinksResolve)).toBeUndefined();
    });

    it('should report invalid cross-file anchor', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('[jump](other.md#nonexistent)'));
      await writeFile(join(tmp, 'other.md'), md('## Setup\n\nContent here.'));

      const findings = await checkCrossFile(input(tmp));

      const finding = findings.find((f) => f.rule === Rule.AnchorLinksResolve);
      expect(finding).toBeDefined();
      expect(finding!.detail).toContain('#nonexistent');
      expect(finding!.detail).toContain('other.md');
    });

    it('should handle h3 headings', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('### Deep Heading\n\n[jump](#deep-heading)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AnchorLinksResolve)).toBeUndefined();
    });

    it('should handle headings with inline formatting', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('## **Bold** heading\n\n[jump](#bold-heading)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AnchorLinksResolve)).toBeUndefined();
    });

    it('should handle headings with inline code', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('## The `config` file\n\n[jump](#the-config-file)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AnchorLinksResolve)).toBeUndefined();
    });

    it('should not check anchors inside code blocks', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      await writeFile(join(tmp, 'index.md'), md('```\n[jump](#nonexistent)\n```'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AnchorLinksResolve)).toBeUndefined();
    });

    it('should resolve duplicate heading slugs with suffix', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'xfile-test-'));
      // github-slugger appends -1 for the second occurrence of the same heading
      await writeFile(join(tmp, 'index.md'), md('## Setup\n\n## Setup\n\n[first](#setup)\n[second](#setup-1)'));

      const findings = await checkCrossFile(input(tmp));
      expect(findings.find((f) => f.rule === Rule.AnchorLinksResolve)).toBeUndefined();
    });
  });
});
