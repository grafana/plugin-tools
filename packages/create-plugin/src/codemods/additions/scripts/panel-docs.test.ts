import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { Context } from '../../context.js';
import panelDocs, { schema } from './panel-docs.js';

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
      expect(() => panelDocs(context, { docsPath: 'docs', agents: true })).toThrow(
        /only works on 'panel'.*type is 'datasource'.*datasource-docs/s
      );
    });

    it('errors when plugin.json type is app', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'app', name: 'X' }));
      expect(() => panelDocs(context, { docsPath: 'docs', agents: true })).toThrow(/only works on 'panel'/);
    });

    it('errors when plugin.json type is unset', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ name: 'X' }));
      expect(() => panelDocs(context, { docsPath: 'docs', agents: true })).toThrow(/type is 'unset'/);
    });
  });

  describe('docsPath validation', () => {
    it('defaults to "docs" when omitted', () => {
      expect(v.parse(schema, {})).toEqual({ docsPath: 'docs', agents: true });
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
      expect(v.parse(schema, { docsPath: 'documentation' })).toEqual({ docsPath: 'documentation', agents: true });
    });

    it('defaults agents to true when the flag is omitted', () => {
      expect(v.parse(schema, { docsPath: 'docs' }).agents).toBe(true);
    });

    it('accepts agents: false, which is what --no-agents produces', () => {
      expect(v.parse(schema, { agents: false }).agents).toBe(false);
    });

    it('rejects a non-boolean agents value', () => {
      expect(() => v.parse(schema, { agents: 'false' })).toThrow();
    });

    it('ignores unrelated CLI flags that always ride along in argv', () => {
      const parsed = v.parse(schema, { force: false, f: false, 'experimental-updates': false });
      expect(parsed).toEqual({ docsPath: 'docs', agents: true });
    });
  });

  describe('generated files', () => {
    it('creates all six panel docs files', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/data-formats.md')).toBe(true);
      expect(context.doesFileExist('docs/options.md')).toBe(true);
      expect(context.doesFileExist('docs/examples.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
      expect(context.doesFileExist('docs/README.md')).toBe(true);
    });

    it('uses the expected H2s in each panel file', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.getFile('docs/data-formats.md') ?? '').toContain('## Supported data shape');
      expect(context.getFile('docs/options.md') ?? '').toContain('## Panel options');
      expect(context.getFile('docs/examples.md') ?? '').toContain('## Basic example');
      expect(context.getFile('docs/troubleshooting.md') ?? '').toContain('## Common issues');
    });

    it('wraps sections in section-brief blocks', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.getFile('docs/index.md') ?? '').toContain('<!-- section-brief:start -->');
      expect(context.getFile('docs/options.md') ?? '').toContain('<!-- section-brief:start -->');
    });

    it('marks section-brief guidance as a fill-in blockquote', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.getFile('docs/index.md') ?? '').toContain('> 📝 **Fill this in:**');
    });

    it('interpolates pluginName into the index page', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.getFile('docs/index.md') ?? '').toContain('My Panel');
    });

    it('writes the validate-docs workflow', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('interpolates a custom docsPath into the workflow path filters', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'documentation', agents: true });
      const content = context.getFile('.github/workflows/validate-docs.yml') ?? '';
      expect(content).toContain("'documentation/**'");
      expect(content).not.toContain('{{docsPath}}');
    });

    it('bumps the build-plugin ref in release.yml', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.getFile('.github/workflows/release.yml') ?? '').toContain(
        'grafana/plugin-actions/build-plugin@build-plugin/v1.2.0'
      );
    });

    it('options.md asks for the Panel options table format with the four expected columns', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      const content = context.getFile('docs/options.md') ?? '';
      expect(content).toContain('| Option | Type | Default | Description |');
      expect(content).toContain('## Standard field options');
      expect(content).toContain('## Custom field options');
    });

    it('scaffolds docs/README.md with panel-specific content', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('# My Panel documentation');
      expect(content).toContain('data-formats.md');
      expect(content).toContain('## How docs are published');
      expect(content).toContain('## How to disable multi-page docs');
    });

    it('does not scaffold a docs/README.txt (legacy filename)', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.doesFileExist('docs/README.txt')).toBe(false);
    });
  });

  describe('AI authoring assistance', () => {
    const SKILLS = ['.claude/skills/bootstrap-plugin-docs/SKILL.md', '.agents/skills/bootstrap-plugin-docs/SKILL.md'];

    it('writes the skill to every agent skills directory', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      for (const skill of SKILLS) {
        expect(context.doesFileExist(skill)).toBe(true);
      }
    });

    it('writes each skill as a complete self-contained file, not an @import shim', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      for (const skill of SKILLS) {
        const content = context.getFile(skill) ?? '';
        // Claude Code ignores @imports in SKILL.md and treats a file whose first
        // line isn't `---` as literal content, so both copies must be whole.
        expect(content).toMatch(/^---\nname: bootstrap-plugin-docs\ndescription: .+\n---/s);
        expect(content).toContain('## Steps');
        expect(content).not.toContain('@../');
      }
    });

    it('writes identical content to every skills directory', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      const [first, ...rest] = SKILLS.map((s) => context.getFile(s));
      for (const other of rest) {
        expect(other).toEqual(first);
      }
    });

    it('does not write a redundant .codex copy, since codex reads .agents/skills', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.doesFileExist('.codex/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('does not scaffold the skills that were folded into the authoring guide', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      for (const name of ['write-plugin-docs', 'review-plugin-docs', 'validate-plugin-docs']) {
        expect(context.doesFileExist(`.claude/skills/${name}/SKILL.md`)).toBe(false);
        expect(context.doesFileExist(`.agents/skills/${name}/SKILL.md`)).toBe(false);
      }
    });

    it('writes nothing agent-related with --no-agents but still scaffolds the docs stubs', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: false });
      for (const skill of SKILLS) {
        expect(context.doesFileExist(skill)).toBe(false);
      }
      expect(context.doesFileExist('.config/AGENTS/plugin-docs.md')).toBe(false);
      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/options.md')).toBe(true);
    });

    it('scaffolds the authoring guide', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      const content = context.getFile('.config/AGENTS/plugin-docs.md') ?? '';
      expect(content).toContain('## Keeping docs in sync with source');
      expect(content).toContain('bootstrap-plugin-docs');
    });

    it('keeps the authoring guide out of docsPath, where the validator would treat it as a page', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(false);
      expect(context.doesFileExist('.config/AGENTS/plugin-docs.md')).toBe(true);
    });

    it('interpolates the configured docsPath into the guide and the skill body', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'documentation', agents: true });
      const guide = context.getFile('.config/AGENTS/plugin-docs.md') ?? '';
      const skill = context.getFile('.claude/skills/bootstrap-plugin-docs/SKILL.md') ?? '';
      expect(guide).toContain('documentation/');
      expect(guide).not.toContain('{{docsPath}}');
      expect(skill).toContain('documentation/');
      expect(skill).not.toContain('{{docsPath}}');
    });

    it('does not overwrite an existing customized guide', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/plugin-docs.md', 'CUSTOMIZED');
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.getFile('.config/AGENTS/plugin-docs.md')).toEqual('CUSTOMIZED');
    });

    it('points .config/AGENTS/instructions.md at the authoring guide when present', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n\nDo the thing.\n');
      panelDocs(context, { docsPath: 'docs', agents: true });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).toContain('# Existing instructions');
      expect(content).toContain('Do the thing.');
      expect(content).toContain('@./.config/AGENTS/plugin-docs.md');
      expect(content).toContain('before writing or modifying plugin documentation');
    });

    it('names the configured docsPath in the instructions pointer', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n');
      panelDocs(context, { docsPath: 'documentation', agents: true });
      expect(context.getFile('.config/AGENTS/instructions.md') ?? '').toContain('`documentation/`');
    });

    it('does not duplicate the instructions pointer if already present', () => {
      const context = makeContext();
      context.addFile(
        '.config/AGENTS/instructions.md',
        '# Existing\n\n- Read @./.config/AGENTS/plugin-docs.md before writing or modifying plugin documentation.\n'
      );
      panelDocs(context, { docsPath: 'docs', agents: true });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content.match(/before writing or modifying plugin documentation/g)?.length).toBe(1);
    });

    it('does not add the instructions pointer with --no-agents', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n');
      panelDocs(context, { docsPath: 'docs', agents: false });
      expect(context.getFile('.config/AGENTS/instructions.md') ?? '').not.toContain('plugin-docs.md');
    });

    it('does not throw or create .config/AGENTS/instructions.md when it is absent', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      expect(context.doesFileExist('.config/AGENTS/instructions.md')).toBe(false);
    });

    it('appends the AI authoring section to docs/README.md by default', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: true });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('## AI authoring assistance');
      expect(content).toContain('bootstrap-plugin-docs');
    });

    it('omits the AI authoring section from docs/README.md with --no-agents', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs', agents: false });
      expect(context.getFile('docs/README.md') ?? '').not.toContain('AI authoring assistance');
    });

    it('does not duplicate the AI authoring section if docs/README.md already contains it', () => {
      const context = makeContext();
      context.addFile('docs/README.md', '# My Panel documentation\n\n## AI authoring assistance\n\nAlready here.\n');
      panelDocs(context, { docsPath: 'docs', agents: true });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content.match(/## AI authoring assistance/g)?.length).toBe(1);
    });
  });
});
