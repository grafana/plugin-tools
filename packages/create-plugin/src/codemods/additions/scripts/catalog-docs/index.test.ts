import { existsSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Context } from '../../../context.js';
import catalogDocs from './index.js';

// capture the real existsSync before mocking so we can restore it in beforeEach
const { existsSync: realExistsSync } = await vi.importActual<typeof import('node:fs')>('node:fs');

vi.mock('node:fs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('node:fs')>();
  return {
    ...mod,
    existsSync: vi.fn().mockImplementation(mod.existsSync),
  };
});

function makeContext(pluginType = 'datasource'): Context {
  const context = new Context('/virtual');
  context.addFile('src/plugin.json', JSON.stringify({ type: pluginType, name: 'My Plugin' }));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

describe('catalog-docs codemod', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockImplementation(realExistsSync);
  });

  describe('early exit', () => {
    it('throws if docs directory already exists on disk', () => {
      vi.mocked(existsSync).mockReturnValueOnce(true);
      const context = makeContext();
      expect(() => catalogDocs(context, { docsPath: 'docs' })).toThrow("A directory already exists at 'docs'");
    });
  });

  describe('plugin.json step', () => {
    it('adds docsPath to src/plugin.json', () => {
      const context = makeContext();
      catalogDocs(context, { docsPath: 'docs' });
      const pluginJson = JSON.parse(context.getFile('src/plugin.json') ?? '{}');
      expect(pluginJson.docsPath).toBe('docs');
    });

    it('throws if src/plugin.json is missing', () => {
      const context = new Context('/virtual');
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => catalogDocs(context, { docsPath: 'docs' })).toThrow('Cannot find src/plugin.json');
    });

    it('skips docsPath update when already set to a different value', () => {
      const context = new Context('/virtual');
      context.addFile(
        'src/plugin.json',
        JSON.stringify({ type: 'datasource', name: 'My Plugin', docsPath: 'custom-docs' })
      );
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
      catalogDocs(context, { docsPath: 'docs' });
      const pluginJson = JSON.parse(context.getFile('src/plugin.json') ?? '{}');
      expect(pluginJson.docsPath).toBe('custom-docs'); // unchanged
    });
  });

  describe('devDependency and scripts step', () => {
    it('adds @grafana/plugin-docs-cli to devDependencies', () => {
      const context = makeContext();
      catalogDocs(context, { docsPath: 'docs' });
      const pkg = JSON.parse(context.getFile('package.json') ?? '{}');
      expect(pkg.devDependencies?.['@grafana/plugin-docs-cli']).toBe('^0.0.10');
    });

    it('adds docs:serve and docs:validate scripts', () => {
      const context = makeContext();
      catalogDocs(context, { docsPath: 'docs' });
      const pkg = JSON.parse(context.getFile('package.json') ?? '{}');
      expect(pkg.scripts?.['docs:serve']).toBe('plugin-docs-cli serve --port 3001 --reload');
      expect(pkg.scripts?.['docs:validate']).toBe('plugin-docs-cli validate --strict');
    });

    it('skips docs:serve if already present', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'My Plugin' }));
      context.addFile(
        'package.json',
        JSON.stringify({ scripts: { 'docs:serve': 'custom-command' }, devDependencies: {} })
      );
      context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
      catalogDocs(context, { docsPath: 'docs' });
      const pkg = JSON.parse(context.getFile('package.json') ?? '{}');
      expect(pkg.scripts?.['docs:serve']).toBe('custom-command'); // unchanged
      expect(pkg.scripts?.['docs:validate']).toBe('plugin-docs-cli validate --strict'); // new
    });
  });

  describe('docs folder creation step', () => {
    it('creates docs/index.md for all plugin types', () => {
      const context = makeContext('datasource');
      catalogDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/index.md')).toBe(true);
    });

    it('creates type-specific docs files for datasource', () => {
      const context = makeContext('datasource');
      catalogDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/query-editor.md')).toBe(true);
      expect(context.doesFileExist('docs/configuration.md')).toBe(true);
    });

    it('creates type-specific docs files for panel', () => {
      const context = makeContext('panel');
      catalogDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/options.md')).toBe(true);
    });

    it('creates type-specific docs files for app', () => {
      const context = makeContext('app');
      catalogDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/configuration.md')).toBe(true);
    });

    it('uses app templates for scenesapp plugin type', () => {
      const context = makeContext('scenesapp');
      catalogDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/configuration.md')).toBe(true);
    });

    it('interpolates pluginName in template content', () => {
      const context = makeContext('datasource');
      catalogDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/index.md') ?? '';
      expect(content).toContain('My Plugin');
      expect(content).not.toContain('{{pluginName}}');
    });

    it('skips existing files in the context', () => {
      const context = makeContext('datasource');
      context.addFile('docs/index.md', '# Existing content');
      catalogDocs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/index.md')).toBe('# Existing content');
    });

    it('uses a custom docsPath when specified', () => {
      const context = makeContext('datasource');
      catalogDocs(context, { docsPath: 'my-docs' });
      expect(context.doesFileExist('my-docs/index.md')).toBe(true);
    });
  });

  describe('validate-docs workflow step', () => {
    it('creates .github/workflows/validate-docs.yml', () => {
      const context = makeContext();
      catalogDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('overwrites existing .github/workflows/validate-docs.yml', () => {
      const context = makeContext();
      context.addFile('.github/workflows/validate-docs.yml', 'old content');
      catalogDocs(context, { docsPath: 'docs' });
      const content = context.getFile('.github/workflows/validate-docs.yml') ?? '';
      expect(content).not.toBe('old content');
      expect(content).toContain('plugin-docs-cli validate --strict');
    });
  });

  describe('release.yml build-plugin bump step', () => {
    it('bumps build-plugin ref in release.yml', () => {
      const context = makeContext();
      catalogDocs(context, { docsPath: 'docs' });
      const content = context.getFile('.github/workflows/release.yml') ?? '';
      expect(content).toContain('grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step');
    });

    it('handles multiple build-plugin refs in release.yml', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'My Plugin' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      context.addFile(
        '.github/workflows/release.yml',
        'uses: grafana/plugin-actions/build-plugin@v1.0.0\nuses: grafana/plugin-actions/build-plugin@v2.0.0\n'
      );
      catalogDocs(context, { docsPath: 'docs' });
      const content = context.getFile('.github/workflows/release.yml') ?? '';
      expect(content).toBe(
        'uses: grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step\nuses: grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step\n'
      );
    });

    it('skips gracefully when release.yml has no build-plugin reference', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'My Plugin' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      context.addFile('.github/workflows/release.yml', 'name: Release\n');
      catalogDocs(context, { docsPath: 'docs' });
      const content = context.getFile('.github/workflows/release.yml') ?? '';
      expect(content).toBe('name: Release\n'); // unchanged
    });

    it('skips gracefully when release.yml does not exist', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'My Plugin' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      // no release.yml
      expect(() => catalogDocs(context, { docsPath: 'docs' })).not.toThrow();
    });
  });
});
