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

    it('omits agentLoop from the parsed output when not provided', () => {
      const parsed = v.parse(schema, { docsPath: 'docs' });
      expect(Object.prototype.hasOwnProperty.call(parsed, 'agentLoop')).toBe(false);
    });

    it('rejects an invalid agentLoop value', () => {
      expect(() => v.parse(schema, { agentLoop: 'bogus' })).toThrow(/--agent-loop must be one of/);
    });

    it('accepts each valid agentLoop literal', () => {
      for (const value of ['claude', 'codex', 'cursor', 'none']) {
        expect(() => v.parse(schema, { agentLoop: value })).not.toThrow();
      }
    });

    it('throws the friendly "Missing required flag" error when agentLoop is omitted', () => {
      const context = makeContext();
      expect(() => panelDocs(context, { docsPath: 'docs' } as never)).toThrow(
        /Missing required flag: --agent-loop[\s\S]*--agent-loop=claude[\s\S]*--agent-loop=none/
      );
    });
  });

  describe('generated files', () => {
    it('creates all six panel docs files', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/data-formats.md')).toBe(true);
      expect(context.doesFileExist('docs/options.md')).toBe(true);
      expect(context.doesFileExist('docs/examples.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
      expect(context.doesFileExist('docs/README.md')).toBe(true);
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

    it('marks section-brief guidance as a fill-in blockquote', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('docs/index.md') ?? '').toContain('> 📝 **Fill this in:**');
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

    it('interpolates a custom docsPath into the workflow path filters', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'documentation', agentLoop: 'claude' });
      const content = context.getFile('.github/workflows/validate-docs.yml') ?? '';
      expect(content).toContain("'documentation/**'");
      expect(content).not.toContain('{{docsPath}}');
    });

    it('bumps the build-plugin ref in release.yml', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('.github/workflows/release.yml') ?? '').toContain(
        'grafana/plugin-actions/build-plugin@build-plugin/v1.2.0'
      );
    });

    it('options.md asks for the Panel options table format with the four expected columns', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/options.md') ?? '';
      expect(content).toContain('| Option | Type | Default | Description |');
      expect(content).toContain('## Standard field options');
      expect(content).toContain('## Custom field options');
    });

    it('scaffolds docs/README.md with panel-specific content', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('# My Panel documentation');
      expect(content).toContain('data-formats.md');
      expect(content).toContain('## How docs are published');
      expect(content).toContain('## How to disable multi-page docs');
    });

    it('does not scaffold a docs/README.txt (legacy filename)', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('docs/README.txt')).toBe(false);
    });
  });

  describe('AI authoring assistance', () => {
    it('scaffolds all four skills under .claude/skills/ for agentLoop claude', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/write-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/review-plugin-docs/SKILL.md')).toBe(true);
      expect(context.doesFileExist('.claude/skills/validate-plugin-docs/SKILL.md')).toBe(true);
    });

    it('scaffolds a panel-specific bootstrap skill', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.claude/skills/bootstrap-plugin-docs/SKILL.md') ?? '';
      expect(content).toContain('create-plugin add panel-docs');
      expect(content).toContain('PanelPlugin');
      expect(content).toContain('setPanelOptions');
      expect(content).toContain('useFieldConfig');
    });

    it('routes skills to .agents/skills/ for agentLoop codex', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'codex' });
      expect(context.doesFileExist('.agents/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
    });

    it('routes skills to .cursor/skills/ for agentLoop cursor', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'cursor' });
      expect(context.doesFileExist('.cursor/skills/bootstrap-plugin-docs/SKILL.md')).toBe(true);
    });

    it('does not scaffold any skill files when agentLoop is none', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      expect(context.doesFileExist('.claude/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
      expect(context.doesFileExist('.agents/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
      expect(context.doesFileExist('.cursor/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('never writes the internal .config/AGENTS/skills/ template-prefix path as real output', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.config/AGENTS/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('scaffolds the generic AGENTS.md authoring guide', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/AGENTS.md') ?? '';
      expect(content).toContain('## Keeping docs in sync with source');
      expect(content).toContain('/write-plugin-docs');
    });

    it('scaffolds AGENTS.md under the configured docsPath when it is not the default', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'documentation', agentLoop: 'claude' });
      expect(context.doesFileExist('documentation/AGENTS.md')).toBe(true);
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(false);
    });

    it('does not overwrite an existing customized docs/AGENTS.md', () => {
      const context = makeContext();
      context.addFile('docs/AGENTS.md', 'CUSTOMIZED');
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.getFile('docs/AGENTS.md')).toEqual('CUSTOMIZED');
    });

    it('appends a Multi-page docs pointer to .config/AGENTS/instructions.md when present', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n\nDo the thing.\n');
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).toContain('# Existing instructions');
      expect(content).toContain('Do the thing.');
      expect(content).toContain('## Multi-page docs');
      expect(content).toContain('Always update those pages when features change in `src/`');
      expect(content).toContain('docs/AGENTS.md');
      expect(content).not.toContain('/bootstrap-plugin-docs');
      expect(content).not.toContain('Added feature');
    });

    it('does not duplicate the Multi-page docs section if already present', () => {
      const context = makeContext();
      context.addFile(
        '.config/AGENTS/instructions.md',
        '# Existing instructions\n\n## Multi-page docs\n\nAlready here.\n'
      );
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content.match(/## Multi-page docs/g)?.length).toBe(1);
    });

    it('does not append the Multi-page docs section when agentLoop is none', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n');
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).not.toContain('## Multi-page docs');
    });

    it('does not throw or create .config/AGENTS/instructions.md when it is absent', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      expect(context.doesFileExist('.config/AGENTS/instructions.md')).toBe(false);
    });

    it('appends the AI authoring section to docs/README.md when agentLoop is claude', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('## AI authoring assistance');
      expect(content).toContain('### Recommended workflow');
    });

    it('omits the AI authoring section from docs/README.md when agentLoop is none', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agentLoop: 'none' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).not.toContain('AI authoring assistance');
    });

    it('does not duplicate the AI authoring section if docs/README.md already contains it', () => {
      const context = makeContext();
      context.addFile('docs/README.md', '# My Panel documentation\n\n## AI authoring assistance\n\nAlready here.\n');
      panelDocs(context, { docsPath: 'docs', agentLoop: 'claude' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content.match(/## AI authoring assistance/g)?.length).toBe(1);
    });
  });
});
