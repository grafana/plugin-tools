import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../../context.js';
import datasourceDocs from './index.js';

const { existsSync: realExistsSync } = await vi.importActual<typeof import('node:fs')>('node:fs');

vi.mock('node:fs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('node:fs')>();
  return {
    ...mod,
    existsSync: vi.fn().mockImplementation(mod.existsSync),
  };
});

interface MakeContextOptions {
  pluginJsonExtras?: Record<string, unknown>;
  basePath?: string;
}

function makeContext(opts: MakeContextOptions = {}): Context {
  const { pluginJsonExtras = {}, basePath = '/virtual' } = opts;
  const context = new Context(basePath);
  context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'My Plugin', ...pluginJsonExtras }));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

describe('datasource-docs codemod', () => {
  const tempDirs: string[] = [];

  function makeTempPluginDir(srcFiles: Record<string, string> = {}): string {
    const dir = mkdtempSync(join(tmpdir(), 'datasource-docs-test-'));
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

  describe('type guard', () => {
    it('errors when plugin.json type is panel', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'X' }));
      expect(() => datasourceDocs(context, { docsPath: 'docs' })).toThrow(
        /only works on 'datasource'.*type is 'panel'.*panel-docs/s
      );
    });

    it('errors when plugin.json type is app', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'app', name: 'X' }));
      expect(() => datasourceDocs(context, { docsPath: 'docs' })).toThrow(/only works on 'datasource'/);
    });

    it('errors when plugin.json type is unset', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ name: 'X' }));
      expect(() => datasourceDocs(context, { docsPath: 'docs' })).toThrow(/type is 'unset'/);
    });
  });

  describe('generated files', () => {
    it('creates the universal datasource docs files', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/configuration.md')).toBe(true);
      expect(context.doesFileExist('docs/query-editor.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
    });

    it('uses the expected H2s in configuration.md', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/configuration.md') ?? '';
      expect(content).toContain('## Before you begin');
      expect(content).toContain('## Configure the data source');
      expect(content).toContain('## Configuration options');
      expect(content).toContain('## Provision the data source');
    });

    it('uses the expected H2s in query-editor.md', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/query-editor.md') ?? '';
      expect(content).toContain('## Using the query editor');
      expect(content).toContain('## Example queries');
    });

    it('wraps generated sections in agent-hint blocks', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/configuration.md') ?? '').toContain('<!-- agent-hint:start -->');
      expect(context.getFile('docs/index.md') ?? '').toContain('<!-- agent-hint:start -->');
    });

    it('writes the validate-docs workflow', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('bumps the build-plugin ref in release.yml', () => {
      const context = makeContext();
      datasourceDocs(context, { docsPath: 'docs' });
      const content = context.getFile('.github/workflows/release.yml') ?? '';
      expect(content).toContain('grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step');
    });
  });

  describe('conditional files', () => {
    describe('template-variables.md', () => {
      it('is generated when src contains metricFindQuery', () => {
        const basePath = makeTempPluginDir({
          'datasource.ts': 'export function metricFindQuery(q: string) { return []; }\n',
        });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(true);
        expect(context.getFile('docs/template-variables.md') ?? '').toContain('## Use query variables');
      });

      it('is generated when src contains CustomVariableSupport', () => {
        const basePath = makeTempPluginDir({
          'variables.ts':
            'import { CustomVariableSupport } from "@grafana/data";\nclass V extends CustomVariableSupport {}\n',
        });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(true);
      });

      it('is skipped when no variable-support token is present', () => {
        const basePath = makeTempPluginDir({ 'datasource.ts': 'export function query() {}\n' });
        const context = makeContext({ basePath });
        datasourceDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/template-variables.md')).toBe(false);
      });
    });

    describe('annotations.md', () => {
      it('is generated when plugin.json sets annotations: true', () => {
        const context = makeContext({ pluginJsonExtras: { annotations: true } });
        datasourceDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/annotations.md')).toBe(true);
        expect(context.getFile('docs/annotations.md') ?? '').toContain('## Create an annotation query');
      });

      it('is skipped when annotations is omitted', () => {
        const context = makeContext();
        datasourceDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/annotations.md')).toBe(false);
      });
    });

    describe('alerting.md', () => {
      it('is generated when both alerting and backend are true', () => {
        const context = makeContext({ pluginJsonExtras: { alerting: true, backend: true } });
        datasourceDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(true);
        expect(context.getFile('docs/alerting.md') ?? '').toContain('## Create an alert rule');
      });

      it('is skipped when only alerting is true', () => {
        const context = makeContext({ pluginJsonExtras: { alerting: true } });
        datasourceDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(false);
      });

      it('is skipped when only backend is true', () => {
        const context = makeContext({ pluginJsonExtras: { backend: true } });
        datasourceDocs(context, { docsPath: 'docs' });
        expect(context.doesFileExist('docs/alerting.md')).toBe(false);
      });
    });
  });
});
