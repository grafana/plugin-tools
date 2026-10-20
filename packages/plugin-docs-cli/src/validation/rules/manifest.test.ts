import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkManifest, checkManifestSize } from './manifest.js';
import { Rule } from '../types.js';

const input = (docsPath: string) => ({ docsPath });

const md = (title: string, body = '') =>
  `---\ntitle: ${title}\ndescription: A page about ${title.toLowerCase()}\n---\n${body}`;

describe('checkManifest', () => {
  it('should return empty for nonexistent path', async () => {
    const findings = await checkManifest(input('/nonexistent/path'));
    expect(findings).toHaveLength(0);
  });

  it('should return empty for valid single-file docs', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
    await writeFile(join(tmp, 'index.md'), md('Home', '## Welcome'));

    const findings = await checkManifest(input(tmp));
    expect(findings).toHaveLength(0);
  });

  it('should return empty for valid multi-file docs', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
    await writeFile(join(tmp, 'index.md'), md('Home'));
    await writeFile(join(tmp, 'setup.md'), md('Setup'));
    await mkdir(join(tmp, 'config'));
    await writeFile(join(tmp, 'config', 'index.md'), md('Configuration'));
    await writeFile(join(tmp, 'config', 'auth.md'), md('Authentication'));

    const findings = await checkManifest(input(tmp));
    expect(findings).toHaveLength(0);
  });

  // --- manifest-valid ---

  describe('manifest-valid', () => {
    it('should return empty when docs have valid frontmatter', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
      await writeFile(join(tmp, 'index.md'), md('Home'));

      const findings = await checkManifest(input(tmp));

      const validFindings = findings.filter((f) => f.rule === Rule.ManifestValid);
      expect(validFindings).toHaveLength(0);
    });

    it('should return empty for docs without any valid markdown', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
      // file with no frontmatter - scanner skips it, throws, and checkManifest catches
      await writeFile(join(tmp, 'bad.md'), 'no frontmatter here');

      const findings = await checkManifest(input(tmp));
      // scanDocsFolder throws "No valid markdown files found", checkManifest catches it
      expect(findings).toHaveLength(0);
    });
  });

  // --- manifest-refs-exist ---

  describe('manifest-refs-exist', () => {
    it('should not report when all manifest file refs exist', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
      await writeFile(join(tmp, 'index.md'), md('Home'));
      await writeFile(join(tmp, 'other.md'), md('Other'));

      const findings = await checkManifest(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ManifestRefsExist)).toBeUndefined();
    });

    it('should not report nested pages, whose manifest file refs use forward slashes', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
      await writeFile(join(tmp, 'index.md'), md('Home'));
      await mkdir(join(tmp, 'config'));
      await writeFile(join(tmp, 'config', 'settings.md'), md('Settings'));

      const findings = await checkManifest(input(tmp));
      expect(findings.find((f) => f.rule === Rule.ManifestRefsExist)).toBeUndefined();
    });
  });

  // --- max-manifest-size ---

  describe('max-manifest-size', () => {
    const bigBody = 'word '.repeat(220_000);

    it('should not report a small manifest', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
      await writeFile(join(tmp, 'index.md'), md('Home', '## Welcome'));

      expect(await checkManifestSize(input(tmp))).toEqual([]);
      expect(await checkManifestSize({ docsPath: tmp, mode: 'dist' })).toEqual([]);
    });

    it('should report the manifest the build would write when it is too large', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
      await writeFile(join(tmp, 'index.md'), md('Home', bigBody));

      const findings = await checkManifestSize(input(tmp));

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ rule: Rule.MaxManifestSize, severity: 'error' });
    });

    it('should measure manifest.json in dist mode', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
      await writeFile(join(tmp, 'index.md'), md('Home'));
      await writeFile(join(tmp, 'manifest.json'), bigBody);

      const findings = await checkManifestSize({ docsPath: tmp, mode: 'dist' });

      expect(findings).toHaveLength(1);
      expect(findings[0].rule).toBe(Rule.MaxManifestSize);
    });

    it('should leave a missing manifest to dist-manifest-exists', async () => {
      const tmp = await mkdtemp(join(tmpdir(), 'manifest-test-'));
      await writeFile(join(tmp, 'index.md'), md('Home'));

      expect(await checkManifestSize({ docsPath: tmp, mode: 'dist' })).toEqual([]);
    });
  });
});
