import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../../context.js';
import catalogDocs from './index.js';

// capture the real existsSync before mocking so we can delegate to it in beforeEach
const { existsSync: realExistsSync } = await vi.importActual<typeof import('node:fs')>('node:fs');

vi.mock('node:fs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('node:fs')>();
  return {
    ...mod,
    existsSync: vi.fn().mockImplementation(mod.existsSync),
  };
});

interface MakeContextOptions {
  pluginType?: string;
  pluginJsonExtras?: Record<string, unknown>;
  basePath?: string;
}

function makeContext(pluginTypeOrOpts: string | MakeContextOptions = 'datasource'): Context {
  const opts: MakeContextOptions =
    typeof pluginTypeOrOpts === 'string' ? { pluginType: pluginTypeOrOpts } : pluginTypeOrOpts;
  const { pluginType = 'datasource', pluginJsonExtras = {}, basePath = '/virtual' } = opts;
  const context = new Context(basePath);
  context.addFile('src/plugin.json', JSON.stringify({ type: pluginType, name: 'My Plugin', ...pluginJsonExtras }));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

describe('catalog-docs codemod', () => {
  const tempDirs: string[] = [];

  function makeTempPluginDir(srcFiles: Record<string, string> = {}): string {
    const dir = mkdtempSync(join(tmpdir(), 'catalog-docs-test-'));
    tempDirs.push(dir);
    if (Object.keys(srcFiles).length > 0) {
      mkdirSync(join(dir, 'src'), { recursive: true });
      for (const [relPath, content] of Object.entries(srcFiles)) {
        const target = join(dir, 'src', relPath);
        mkdirSync(join(target, '..'), { recursive: true });
        writeFileSync(target, content);
      }
    }
    return dir;
  }

  beforeEach(() => {
    vi.mocked(existsSync).mockImplementation(realExistsSync);
  });

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
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

    it('generates the standard datasource H2 headings in configuration.md', () => {
      const context = makeContext('datasource');
      catalogDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/configuration.md') ?? '';
      expect(content).toContain('## Before you begin');
      expect(content).toContain('## Configure the data source');
      expect(content).toContain('## Configuration options');
      expect(content).toContain('## Provision the data source');
    });

    it('generates troubleshooting.md as its own page', () => {
      const context = makeContext('datasource');
      catalogDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
      const content = context.getFile('docs/troubleshooting.md') ?? '';
      expect(content).toContain('## Common issues');
    });

    it('wraps each section in agent-hint blocks', () => {
      const context = makeContext('datasource');
      catalogDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/configuration.md') ?? '';
      expect(content).toContain('<!-- agent-hint:start -->');
      expect(content).toContain('<!-- agent-hint:end -->');
    });
  });

  describe('conditional template files', () => {
    describe('template-variables.md', () => {
      it.each([
        ['metricFindQuery', 'export function metricFindQuery(q: string) { return []; }\n'],
        [
          'CustomVariableSupport',
          'import { CustomVariableSupport } from "@grafana/data"; class V extends CustomVariableSupport {}\n',
        ],
        [
          'StandardVariableSupport',
          'import { StandardVariableSupport } from "@grafana/data"; class V extends StandardVariableSupport {}\n',
        ],
        [
          'DataSourceVariableSupport',
          'import { DataSourceVariableSupport } from "@grafana/data"; class V extends DataSourceVariableSupport {}\n',
        ],
      ])('is generated when src contains %s', (_, source) => {
        const basePath = makeTempPluginDir({ 'datasource.ts': source });
        const context = makeContext({ basePath });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(true);
        const content = context.getFile('docs/template-variables.md') ?? '';
        expect(content).toContain('## Use query variables');
      });

      it('finds variable-support tokens in nested directories', () => {
        const basePath = makeTempPluginDir({
          'nested/deep/queries.ts': 'export const x = (ds: any) => ds.metricFindQuery("foo");\n',
        });
        const context = makeContext({ basePath });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(true);
      });

      it('is skipped when no variable-support token is found', () => {
        const basePath = makeTempPluginDir({
          'datasource.ts': 'export function query(q: string) { return []; }\n',
        });
        const context = makeContext({ basePath });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(false);
      });

      it('is skipped when src directory does not exist', () => {
        const basePath = makeTempPluginDir();
        const context = makeContext({ basePath });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(false);
      });
    });

    describe('annotations.md', () => {
      it('is generated when plugin.json sets annotations: true', () => {
        const context = makeContext({ pluginJsonExtras: { annotations: true } });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/annotations.md')).toBe(true);
        const content = context.getFile('docs/annotations.md') ?? '';
        expect(content).toContain('## Create an annotation query');
      });

      it('is skipped when plugin.json omits annotations', () => {
        const context = makeContext();
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/annotations.md')).toBe(false);
      });

      it('is skipped when plugin.json sets annotations: false', () => {
        const context = makeContext({ pluginJsonExtras: { annotations: false } });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/annotations.md')).toBe(false);
      });
    });

    describe('alerting.md', () => {
      it('is generated when both alerting and backend are true', () => {
        const context = makeContext({ pluginJsonExtras: { alerting: true, backend: true } });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(true);
        const content = context.getFile('docs/alerting.md') ?? '';
        expect(content).toContain('## Create an alert rule');
      });

      it('is skipped when only alerting is true', () => {
        const context = makeContext({ pluginJsonExtras: { alerting: true } });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(false);
      });

      it('is skipped when only backend is true', () => {
        const context = makeContext({ pluginJsonExtras: { backend: true } });
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(false);
      });

      it('is skipped when neither alerting nor backend is set', () => {
        const context = makeContext();
        catalogDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(false);
      });
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
