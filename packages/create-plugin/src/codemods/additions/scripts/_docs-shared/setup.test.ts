import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../../context.js';
import {
  assertPluginType,
  type ConditionalFilePredicate,
  setupDocsScaffolding,
  sourceContainsVariableSupport,
} from './setup.js';

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
  pluginJson?: Record<string, unknown>;
  basePath?: string;
}

function makeContext(opts: MakeContextOptions = {}): Context {
  const { pluginJson = { type: 'datasource', name: 'My Plugin' }, basePath = '/virtual' } = opts;
  const context = new Context(basePath);
  context.addFile('src/plugin.json', JSON.stringify(pluginJson));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

describe('_docs-shared/setup', () => {
  const tempDirs: string[] = [];

  function makeTempPluginDir(srcFiles: Record<string, string> = {}): string {
    const dir = mkdtempSync(join(tmpdir(), 'docs-shared-test-'));
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

  // build a synthetic templateBaseUrl folder with the given file contents
  function makeTemplateBaseUrl(files: Record<string, string>): URL {
    const dir = mkdtempSync(join(tmpdir(), 'docs-templates-'));
    tempDirs.push(dir);
    mkdirSync(join(dir, 'docs'), { recursive: true });
    mkdirSync(join(dir, 'templates', 'workflows'), { recursive: true });
    // The shared module reads workflows/validate-docs.yml relative to its own location -
    // we can't override that from the outside, so this helper is only for /docs templates.
    for (const [relPath, content] of Object.entries(files)) {
      const target = join(dir, 'docs', relPath);
      mkdirSync(join(target, '..'), { recursive: true });
      writeFileSync(target, content);
    }
    return pathToFileURL(`${dir}/`);
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

  describe('setupDocsScaffolding', () => {
    function call(
      context: Context,
      overrides: {
        templates?: Record<string, string>;
        conditionalFiles?: Record<string, ConditionalFilePredicate>;
        docsPath?: string;
      } = {}
    ): void {
      const templates = overrides.templates ?? { 'index.md': '# {{pluginName}}\n' };
      setupDocsScaffolding({
        context,
        docsPath: overrides.docsPath ?? 'docs',
        templateBaseUrl: makeTemplateBaseUrl(templates),
        codemodName: 'test-docs',
        conditionalFiles: overrides.conditionalFiles,
      });
    }

    describe('early exit', () => {
      it('throws if docs directory already exists on disk', () => {
        vi.mocked(existsSync).mockReturnValueOnce(true);
        const context = makeContext();
        expect(() => call(context)).toThrow("A directory already exists at 'docs'");
      });
    });

    describe('plugin.json step', () => {
      it('adds docsPath to src/plugin.json', () => {
        const context = makeContext();
        call(context);
        const parsed = JSON.parse(context.getFile('src/plugin.json') ?? '{}');
        expect(parsed.docsPath).toBe('docs');
      });

      it('throws if src/plugin.json is missing', () => {
        const context = new Context('/virtual');
        context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
        expect(() => call(context)).toThrow('Cannot find src/plugin.json');
      });

      it('skips docsPath update when already set to a different value', () => {
        const context = makeContext({
          pluginJson: { type: 'datasource', name: 'My Plugin', docsPath: 'custom-docs' },
        });
        call(context);
        const parsed = JSON.parse(context.getFile('src/plugin.json') ?? '{}');
        expect(parsed.docsPath).toBe('custom-docs');
      });

      it('uses a custom docsPath when specified', () => {
        const context = makeContext();
        call(context, { docsPath: 'my-docs' });
        expect(context.doesFileExist('my-docs/index.md')).toBe(true);
      });
    });

    describe('devDependency and scripts', () => {
      it('adds @grafana/plugin-docs-cli to devDependencies', () => {
        const context = makeContext();
        call(context);
        const pkg = JSON.parse(context.getFile('package.json') ?? '{}');
        expect(pkg.devDependencies?.['@grafana/plugin-docs-cli']).toBe('^0.0.10');
      });

      it('adds docs:serve and docs:validate scripts', () => {
        const context = makeContext();
        call(context);
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
        call(context);
        const pkg = JSON.parse(context.getFile('package.json') ?? '{}');
        expect(pkg.scripts?.['docs:serve']).toBe('custom-command');
        expect(pkg.scripts?.['docs:validate']).toBe('plugin-docs-cli validate --strict');
      });
    });

    describe('template copy', () => {
      it('copies every template file under docs/', () => {
        const context = makeContext();
        call(context, {
          templates: {
            'index.md': '# Overview\n',
            'configuration.md': '## Configure\n',
            'nested/deep.md': 'nested\n',
          },
        });
        expect(context.doesFileExist('docs/index.md')).toBe(true);
        expect(context.doesFileExist('docs/configuration.md')).toBe(true);
        expect(context.doesFileExist('docs/nested/deep.md')).toBe(true);
      });

      it('interpolates {{pluginName}} in template content', () => {
        const context = makeContext();
        call(context, { templates: { 'index.md': '# {{pluginName}}\n' } });
        expect(context.getFile('docs/index.md')).toContain('My Plugin');
        expect(context.getFile('docs/index.md')).not.toContain('{{pluginName}}');
      });

      it('skips a file already present in the context', () => {
        const context = makeContext();
        context.addFile('docs/index.md', '# Existing\n');
        call(context, { templates: { 'index.md': '# Replacement\n' } });
        expect(context.getFile('docs/index.md')).toBe('# Existing\n');
      });

      it('honors a conditional file predicate when it returns true', () => {
        const context = makeContext({ pluginJson: { type: 'datasource', name: 'X', annotations: true } });
        call(context, {
          templates: { 'annotations.md': '# {{pluginName}}\n' },
          conditionalFiles: { 'annotations.md': ({ pluginJson }) => pluginJson.annotations === true },
        });
        expect(context.doesFileExist('docs/annotations.md')).toBe(true);
      });

      it('honors a conditional file predicate when it returns false', () => {
        const context = makeContext();
        call(context, {
          templates: { 'annotations.md': '# {{pluginName}}\n' },
          conditionalFiles: { 'annotations.md': ({ pluginJson }) => pluginJson.annotations === true },
        });
        expect(context.doesFileExist('docs/annotations.md')).toBe(false);
      });
    });

    describe('validate-docs workflow', () => {
      it('creates .github/workflows/validate-docs.yml', () => {
        const context = makeContext();
        call(context);
        expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
        expect(context.getFile('.github/workflows/validate-docs.yml')).toContain('plugin-docs-cli validate --strict');
      });

      it('overwrites an existing .github/workflows/validate-docs.yml', () => {
        const context = makeContext();
        context.addFile('.github/workflows/validate-docs.yml', 'old content');
        call(context);
        expect(context.getFile('.github/workflows/validate-docs.yml')).not.toBe('old content');
      });
    });

    describe('release.yml build-plugin bump', () => {
      it('bumps build-plugin ref in release.yml', () => {
        const context = makeContext();
        call(context);
        const content = context.getFile('.github/workflows/release.yml') ?? '';
        expect(content).toContain('grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step');
      });

      it('handles multiple build-plugin refs', () => {
        const context = makeContext();
        context.updateFile(
          '.github/workflows/release.yml',
          'uses: grafana/plugin-actions/build-plugin@v1.0.0\nuses: grafana/plugin-actions/build-plugin@v2.0.0\n'
        );
        call(context);
        expect(context.getFile('.github/workflows/release.yml')).toBe(
          'uses: grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step\nuses: grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step\n'
        );
      });

      it('skips when release.yml has no build-plugin reference', () => {
        const context = makeContext();
        context.updateFile('.github/workflows/release.yml', 'name: Release\n');
        call(context);
        expect(context.getFile('.github/workflows/release.yml')).toBe('name: Release\n');
      });

      it('skips when release.yml does not exist', () => {
        const context = new Context('/virtual');
        context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'My Plugin' }));
        context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
        expect(() => call(context)).not.toThrow();
      });
    });
  });

  describe('assertPluginType', () => {
    it('returns the parsed plugin.json when the type matches', () => {
      const context = makeContext({ pluginJson: { type: 'datasource', name: 'X' } });
      const parsed = assertPluginType(context, { expectedType: 'datasource', codemodName: 'datasource-docs' });
      expect(parsed.name).toBe('X');
    });

    it('throws when the type does not match', () => {
      const context = makeContext({ pluginJson: { type: 'panel', name: 'X' } });
      expect(() => assertPluginType(context, { expectedType: 'datasource', codemodName: 'datasource-docs' })).toThrow(
        /only works on 'datasource' plugins.*type is 'panel'/
      );
    });

    it('points the user at the sibling codemod in the error message', () => {
      const context = makeContext({ pluginJson: { type: 'panel', name: 'X' } });
      expect(() => assertPluginType(context, { expectedType: 'datasource', codemodName: 'datasource-docs' })).toThrow(
        /create-plugin add panel-docs/
      );
    });

    it('throws when plugin.json is missing', () => {
      const context = new Context('/virtual');
      expect(() => assertPluginType(context, { expectedType: 'datasource', codemodName: 'datasource-docs' })).toThrow(
        'Cannot find src/plugin.json'
      );
    });

    it('throws when type is unset', () => {
      const context = makeContext({ pluginJson: { name: 'X' } });
      expect(() => assertPluginType(context, { expectedType: 'datasource', codemodName: 'datasource-docs' })).toThrow(
        /type is 'unset'/
      );
    });
  });

  describe('sourceContainsVariableSupport', () => {
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
    ])('returns true when src contains %s', (_, source) => {
      const basePath = makeTempPluginDir({ 'datasource.ts': source });
      expect(sourceContainsVariableSupport(basePath)).toBe(true);
    });

    it('finds tokens in nested directories', () => {
      const basePath = makeTempPluginDir({
        'nested/deep/queries.ts': 'export const x = (ds: any) => ds.metricFindQuery("foo");\n',
      });
      expect(sourceContainsVariableSupport(basePath)).toBe(true);
    });

    it('returns false when no token is found', () => {
      const basePath = makeTempPluginDir({ 'datasource.ts': 'export function query(q: string) { return []; }\n' });
      expect(sourceContainsVariableSupport(basePath)).toBe(false);
    });

    it('returns false when src directory does not exist', () => {
      const basePath = makeTempPluginDir();
      expect(sourceContainsVariableSupport(basePath)).toBe(false);
    });
  });
});
