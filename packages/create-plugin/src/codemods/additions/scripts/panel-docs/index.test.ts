import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { Context } from '../../../context.js';
import panelDocs, { schema } from './index.js';

function makeContext(): Context {
  const context = new Context('/virtual');
  context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'My Panel' }));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

describe('panel-docs codemod', () => {
  describe('type guard', () => {
    it('errors when plugin.json type is datasource', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'X' }));
      expect(() => panelDocs(context, { docsPath: 'docs' })).toThrow(
        /only works on 'panel'.*type is 'datasource'.*datasource-docs/s
      );
    });

    it('errors when plugin.json type is app', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'app', name: 'X' }));
      expect(() => panelDocs(context, { docsPath: 'docs' })).toThrow(/only works on 'panel'/);
    });

    it('errors when plugin.json type is unset', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ name: 'X' }));
      expect(() => panelDocs(context, { docsPath: 'docs' })).toThrow(/type is 'unset'/);
    });
  });

  describe('docsPath validation', () => {
    it('defaults to "docs" when omitted', () => {
      expect(v.parse(schema, {})).toEqual({ docsPath: 'docs' });
    });

    it('rejects an empty docsPath', () => {
      expect(() => v.parse(schema, { docsPath: '' })).toThrow();
    });

    it('rejects an absolute docsPath', () => {
      expect(() => v.parse(schema, { docsPath: '/etc/passwd' })).toThrow();
    });

    it('rejects a docsPath with ".." segments', () => {
      expect(() => v.parse(schema, { docsPath: '../../etc' })).toThrow();
    });

    it('accepts a valid custom docsPath', () => {
      expect(v.parse(schema, { docsPath: 'documentation' })).toEqual({ docsPath: 'documentation' });
    });
  });

  describe('generated files', () => {
    it('creates all six panel docs files', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/data-formats.md')).toBe(true);
      expect(context.doesFileExist('docs/options.md')).toBe(true);
      expect(context.doesFileExist('docs/examples.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
      expect(context.doesFileExist('docs/README.md')).toBe(true);
    });

    it('uses the expected H2s in each panel file', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/data-formats.md') ?? '').toContain('## Supported data shape');
      expect(context.getFile('docs/options.md') ?? '').toContain('## Panel options');
      expect(context.getFile('docs/examples.md') ?? '').toContain('## Basic example');
      expect(context.getFile('docs/troubleshooting.md') ?? '').toContain('## Common issues');
    });

    it('wraps sections in section-brief blocks', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/index.md') ?? '').toContain('<!-- section-brief:start -->');
      expect(context.getFile('docs/options.md') ?? '').toContain('<!-- section-brief:start -->');
    });

    it('interpolates pluginName into the index page', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/index.md') ?? '').toContain('My Panel');
    });

    it('writes the validate-docs workflow', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('interpolates a custom docsPath into the workflow path filters', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'documentation' });
      const content = context.getFile('.github/workflows/validate-docs.yml') ?? '';
      expect(content).toContain("'documentation/**'");
      expect(content).not.toContain('{{docsPath}}');
    });

    it('bumps the build-plugin ref in release.yml', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.getFile('.github/workflows/release.yml') ?? '').toContain(
        'grafana/plugin-actions/build-plugin@build-plugin/v1.2.0'
      );
    });

    it('options.md asks for the Panel options table format with the four expected columns', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/options.md') ?? '';
      expect(content).toContain('| Option | Type | Default | Description |');
      expect(content).toContain('## Standard field options');
      expect(content).toContain('## Custom field options');
    });

    it('scaffolds docs/README.md with panel-specific content', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('# My Panel documentation');
      expect(content).toContain('data-formats.md');
      expect(content).toContain('## How docs are published');
      expect(content).toContain('## How to disable multi-page docs');
    });

    it('does not scaffold a docs/README.txt (legacy filename)', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/README.txt')).toBe(false);
    });
  });
});
