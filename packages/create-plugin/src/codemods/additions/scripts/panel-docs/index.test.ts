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

    it('wraps sections in section-brief blocks', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('docs/index.md') ?? '').toContain('<!-- section-brief:start -->');
      expect(context.getFile('docs/options.md') ?? '').toContain('<!-- section-brief:start -->');
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

    it('scaffolds all four skills (write, review, validate, bootstrap) under .claude/skills/', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.claude/skills/write-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/review-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/validate-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
    });

    it('scaffolds a panel-specific bootstrap skill (not the datasource one)', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.claude/skills/bootstrap-plugin-docs/SKILL.md') ?? '';
      expect(content).toContain('create-plugin add panel-docs');
      expect(content).toContain('PanelPlugin');
      expect(content).toContain('setPanelOptions');
      expect(content).toContain('useFieldConfig');
    });

    it('routes the bootstrap skill to the correct agent-loop path', () => {
      const codexCtx = makeContext();
      panelDocs(codexCtx, { docsPath: 'docs', agentLoop: 'codex' });
      expect(codexCtx.doesFileExist('.agents/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);

      const cursorCtx = makeContext();
      panelDocs(cursorCtx, { docsPath: 'docs', agentLoop: 'cursor' });
      expect(cursorCtx.doesFileExist('.cursor/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
    });

    it('does not scaffold the bootstrap skill when agentLoop is none', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
      expect(context.doesFileExist('.agents/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
      expect(context.doesFileExist('.cursor/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('options.md asks for the Panel options table format with the four expected columns', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/options.md') ?? '';
      expect(content).toContain('| Option | Type | Default | Description |');
      expect(content).toContain('## Standard field options');
      expect(content).toContain('## Custom field options');
    });

    it('appends a slim Multi-page docs pointer to .config/AGENTS/instructions.md when present', () => {
      const context = makeContext();
      context.addFile(
        '.config/AGENTS/instructions.md',
        '---\nname: agent information\ndescription: existing guide\n---\n\n# Grafana Plugin\n\nExisting content.\n'
      );
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).toContain('Existing content.');
      expect(content).toContain('## Multi-page docs');
      // the directive itself is one sentence; the detail lives in docs/AGENTS.md
      expect(content).toContain('Always update those pages when features change in `src/`');
      expect(content).toContain('docs/AGENTS.md');
      // the section stays terse - no skill list, no bullet expansion
      expect(content).not.toContain('/bootstrap-plugin-docs');
      expect(content).not.toContain('Added feature');
    });

    it('does not duplicate the Multi-page docs section if already present', () => {
      const context = makeContext();
      const seeded = '# Plugin\n\n## Multi-page docs\n\nAlready here.\n';
      context.addFile('.config/AGENTS/instructions.md', seeded);
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content.match(/## Multi-page docs/g)?.length).toBe(1);
    });

    it('does not append the Multi-page docs section when agentLoop is none', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Grafana Plugin\n\nExisting content.\n');
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).not.toContain('## Multi-page docs');
    });

    it('scaffolds the generic AGENTS.md authoring guide for panels with the feature-change directive', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(true);
      const content = context.getFile('docs/AGENTS.md') ?? '';
      // the feature-change directive lives here; instructions.md just points at it
      expect(content).toContain('## Keeping docs in sync with source');
      expect(content).toContain('add, change or remove a feature');
      expect(content).toContain('/write-plugin-docs');
    });

    it('scaffolds docs/README.md with panel-specific content', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('# My Panel documentation');
      expect(content).toContain('data-formats.md');
      expect(content).toContain('## How docs are published');
      expect(content).toContain('## How to disable multi-page docs');
    });

    it('appends the AI authoring section to README.md when agentLoop is claude', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('## AI authoring assistance');
      expect(content).toContain('### Recommended workflow');
    });

    it('omits the AI authoring section from README.md when agentLoop is none', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).not.toContain('AI authoring assistance');
    });

    it('does not scaffold a docs/README.txt (legacy filename)', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/README.txt')).toBe(false);
    });
  });
});
