import { describe, it, expect, beforeEach } from 'vitest';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Manifest, Page } from '@grafana/plugin-docs-parser';
import { buildDocs } from '../../commands/build.command.js';
import { validate } from '../engine.js';
import { Rule } from '../types.js';
import { checkDistManifest } from './dist.js';
import { allRules } from './index.js';

const fixtures = join(__dirname, '..', '..', '__fixtures__');

describe('checkDistManifest', () => {
  let projectRoot: string;
  let docsPath: string;
  let builtDocsPath: string;
  const input = () => ({ docsPath: builtDocsPath, mode: 'dist' as const });

  const readManifest = async (): Promise<Manifest> =>
    JSON.parse(await readFile(join(builtDocsPath, 'manifest.json'), 'utf-8'));
  const writeManifest = (manifest: unknown) =>
    writeFile(join(builtDocsPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const findPage = (pages: Page[], slug: string): Page => {
    for (const page of pages) {
      const found = page.slug === slug ? page : page.children && findPage(page.children, slug);
      if (found) {
        return found;
      }
    }
    throw new Error(`no page ${slug}`);
  };

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'dist-rules-'));
    docsPath = join(projectRoot, 'docs');
    await cp(join(fixtures, 'test-docs'), docsPath, { recursive: true });
    await buildDocs(projectRoot, docsPath);
    builtDocsPath = join(projectRoot, 'dist', 'docs');
  });

  it('reports nothing for freshly built docs', async () => {
    expect(await checkDistManifest(input())).toEqual([]);
  });

  it('does nothing outside dist mode', async () => {
    await rm(join(builtDocsPath, 'manifest.json'));

    expect(await checkDistManifest({ docsPath: builtDocsPath })).toEqual([]);
  });

  it('leaves a missing docs folder to docs-path-exists', async () => {
    expect(await checkDistManifest({ docsPath: join(projectRoot, 'nope'), mode: 'dist' })).toEqual([]);
  });

  it('accepts frontmatter that does not survive JSON unchanged', async () => {
    await writeFile(
      join(docsPath, 'dated.md'),
      '---\ntitle: Dated\ndescription: A page with a date in it\ndate: 2024-01-01\n---\nBody\n'
    );
    await buildDocs(projectRoot, docsPath);

    expect(await checkDistManifest(input())).toEqual([]);
  });

  describe(Rule.DistManifestExists, () => {
    it('reports a missing manifest', async () => {
      await rm(join(builtDocsPath, 'manifest.json'));

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ rule: Rule.DistManifestExists, severity: 'error' });
      expect(findings[0].detail).toContain('plugin build');
    });

    it('reports a manifest that is not JSON', async () => {
      await writeFile(join(builtDocsPath, 'manifest.json'), '{ nope');

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ rule: Rule.DistManifestExists, severity: 'error' });
    });
  });

  describe(Rule.DistManifestValid, () => {
    it.each([{}, { pages: [] }, { pages: 'x' }, []])('reports a manifest without pages: %j', async (manifest) => {
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ rule: Rule.DistManifestValid, severity: 'error' });
    });

    it('reports a page without a slug', async () => {
      const manifest = await readManifest();
      delete (manifest.pages[1] as Partial<Page>).slug;
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toContain('pages[1]');
      expect(findings[0].detail).toContain('"slug" is not a string');
    });

    it('reports a page without content', async () => {
      const manifest = await readManifest();
      delete (manifest.pages[1] as Partial<Page>).content;
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0].detail).toContain('"content" is not a string');
    });

    it('reports invalid headings and children on nested pages', async () => {
      const manifest = await readManifest();
      const nested = manifest.pages.find((p) => p.children)!.children!;
      (nested[0] as unknown as { headings: unknown }).headings = [{ text: 'x' }];
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toContain('.children[0]');
      expect(findings[0].detail).toContain('"headings"');
    });

    it('reports a manifest without a root page', async () => {
      const manifest = await readManifest();
      manifest.pages = manifest.pages.filter((p) => p.slug !== 'index');
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings.find((f) => f.title === 'Manifest has no root page')).toMatchObject({ severity: 'error' });
    });

    it('only warns about an unknown version', async () => {
      const manifest = await readManifest();
      manifest.version = '2';
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ rule: Rule.DistManifestValid, severity: 'warning' });
    });
  });

  describe(Rule.DistManifestMatchesDocs, () => {
    it('reports content that was changed only in the manifest', async () => {
      const manifest = await readManifest();
      const home = findPage(manifest.pages, 'home');
      home.content += '\n<script>alert(1)</script>\n';
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ rule: Rule.DistManifestMatchesDocs, severity: 'error', file: 'home.md' });
    });

    it('reports frontmatter that was changed only in the manifest', async () => {
      const manifest = await readManifest();
      findPage(manifest.pages, 'home').frontmatter!.description = 'Something else entirely';
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings.filter((f) => f.rule === Rule.DistManifestMatchesDocs)).toHaveLength(1);
    });

    it.each(['', 'Something else'])('reports a page title of %j that differs from the page', async (title) => {
      const manifest = await readManifest();
      findPage(manifest.pages, 'home').title = title;
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ rule: Rule.DistManifestMatchesDocs, severity: 'error', file: 'home.md' });
    });

    it('reports a page that the manifest lists twice', async () => {
      const manifest = await readManifest();
      manifest.pages.push(findPage(manifest.pages, 'home'));
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('Manifest lists the same page more than once');
      expect(findings[0].detail).toContain('home.md');
    });

    it('reports a page that is in the manifest but not in the built docs', async () => {
      const manifest = await readManifest();
      manifest.pages.push({ ...findPage(manifest.pages, 'home'), slug: 'ghost', file: 'ghost.md' });
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('Manifest lists pages that are not in the built docs');
      expect(findings[0].detail).toContain('ghost.md');
    });

    it('reports a page that is in the built docs but not in the manifest', async () => {
      await writeFile(
        join(builtDocsPath, 'extra.md'),
        '---\ntitle: Extra\ndescription: A page the manifest does not know\n---\nBody\n'
      );

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0].title).toBe('Built docs have pages that the manifest leaves out');
      expect(findings[0].detail).toContain('extra.md');
    });
  });

  describe(Rule.DistManifestStale, () => {
    it('only warns when slugs or headings differ from what this CLI generates', async () => {
      const manifest = await readManifest();
      findPage(manifest.pages, 'home').slug = 'start';
      findPage(manifest.pages, 'guide').headings = [{ text: 'Old', level: 2, id: 'old' }];
      await writeManifest(manifest);

      const findings = await checkDistManifest(input());

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ rule: Rule.DistManifestStale, severity: 'warning' });
      expect(findings[0].detail).toContain('home.md');
      expect(findings[0].detail).toContain('guide.md');
    });

    it('does not mind the order of sibling pages', async () => {
      const manifest = await readManifest();
      manifest.pages.reverse();
      await writeManifest(manifest);

      expect(await checkDistManifest(input())).toEqual([]);
    });
  });

  describe('with every rule', () => {
    it('finds the same problems as source mode in a clean build', async () => {
      const source = await validate({ docsPath }, allRules);
      const dist = await validate({ docsPath: builtDocsPath, mode: 'dist' }, allRules);

      const ruleIds = (diagnostics: Array<{ rule: string }>) => diagnostics.map((d) => d.rule).sort();
      expect(ruleIds(dist.diagnostics)).toEqual(ruleIds(source.diagnostics));
      expect(dist.valid).toBe(source.valid);
    });

    it('fails when the manifest is missing', async () => {
      await rm(join(builtDocsPath, 'manifest.json'));

      const result = await validate({ docsPath: builtDocsPath, mode: 'dist' }, allRules);

      expect(result.valid).toBe(false);
      expect(result.diagnostics.map((d) => d.rule)).toContain(Rule.DistManifestExists);
    });
  });
});
