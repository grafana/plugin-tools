import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { checkManifest } from './manifest.js';
import { Rule } from '../types.js';

const input = (docsPath: string, strict = true) => ({ docsPath, strict });

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
  });
});
