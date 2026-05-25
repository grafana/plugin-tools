import { existsSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../../context.js';
import panelDocs from './index.js';

const { existsSync: realExistsSync } = await vi.importActual<typeof import('node:fs')>('node:fs');

vi.mock('node:fs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('node:fs')>();
  return {
    ...mod,
    existsSync: vi.fn().mockImplementation(mod.existsSync),
  };
});

function makeContext(): Context {
  const context = new Context('/virtual');
  context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'My Panel' }));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

describe('panel-docs codemod', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockImplementation(realExistsSync);
  });

  describe('type guard', () => {
    it('errors when plugin.json type is datasource', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', name: 'X' }));
      expect(() => panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' })).toThrow(
        /only works on 'panel'.*type is 'datasource'.*datasource-docs/s
      );
    });

    it('errors when plugin.json type is app', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'app', name: 'X' }));
      expect(() => panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' })).toThrow(/only works on 'panel'/);
    });

    it('errors when plugin.json type is unset', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ name: 'X' }));
      expect(() => panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' })).toThrow(/type is 'unset'/);
    });
  });

  describe('generated files', () => {
    it('creates all five panel docs files', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/data-formats.md')).toBe(true);
      expect(context.doesFileExist('docs/options.md')).toBe(true);
      expect(context.doesFileExist('docs/examples.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
    });

    it('uses the expected H2s in each panel file', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('docs/data-formats.md') ?? '').toContain('## Supported data shape');
      expect(context.getFile('docs/options.md') ?? '').toContain('## Panel options');
      expect(context.getFile('docs/examples.md') ?? '').toContain('## Basic example');
      expect(context.getFile('docs/troubleshooting.md') ?? '').toContain('## Common issues');
    });

    it('wraps sections in agent-hint blocks', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('docs/index.md') ?? '').toContain('<!-- agent-hint:start -->');
      expect(context.getFile('docs/options.md') ?? '').toContain('<!-- agent-hint:start -->');
    });

    it('interpolates pluginName into the index page', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('docs/index.md') ?? '').toContain('My Panel');
    });

    it('writes the validate-docs workflow', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('bumps the build-plugin ref in release.yml', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('.github/workflows/release.yml') ?? '').toContain(
        'grafana/plugin-actions/build-plugin@eriksundell/plugin-docs-build-step'
      );
    });

    it('scaffolds the three shared skills (write, review, validate) under .claude/skills/', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.claude/skills/write-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/review-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/validate-plugin-docs/SKILL.md')).toBe(true);
    });

    it('does not scaffold the datasource-only bootstrap skill for panels', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('scaffolds the generic AGENTS.md authoring guide for panels', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(true);
    });

    it('scaffolds docs/README.txt with panel-specific content', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('docs/README.txt') ?? '';
      expect(content).toContain('My Panel - documentation');
      expect(content).toContain('data-formats.md');
      expect(content).toContain('How docs are published');
    });

    it('appends the AI authoring section to README.txt when agentLoop is claude', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/README.txt') ?? '';
      expect(content).toContain('AI authoring assistance');
      expect(content).toContain('Recommended workflow');
    });

    it('omits the AI authoring section from README.txt when agentLoop is none', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('docs/README.txt') ?? '';
      expect(content).not.toContain('AI authoring assistance');
    });
  });
});
