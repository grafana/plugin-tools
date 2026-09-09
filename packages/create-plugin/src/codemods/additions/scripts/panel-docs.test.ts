import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as v from 'valibot';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../context.js';
import panelDocs, { assertPluginType, schema, setupDocsScaffolding } from './panel-docs.js';

// capture the real existsSync before mocking so we can delegate to it in beforeEach
const { existsSync: realExistsSync } = await vi.importActual<typeof import('node:fs')>('node:fs');

vi.mock('node:fs', async (importOriginal) => {
  const mod = await importOriginal<typeof import('node:fs')>();
  return {
    ...mod,
    existsSync: vi.fn().mockImplementation(mod.existsSync),
  };
});

function makeContext(pluginJson: Record<string, unknown> = { type: 'panel', name: 'My Plugin' }): Context {
  const context = new Context('/virtual');
  context.addFile('src/plugin.json', JSON.stringify(pluginJson));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

describe('docs scaffolding', () => {
  const tempDirs: string[] = [];

  // build a synthetic plugin-type template folder with the given docs template file contents
  function makeTemplateDir(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), 'panel-docs-templates-'));
    tempDirs.push(dir);
    mkdirSync(join(dir, 'docs'), { recursive: true });
    // agent scaffolding always runs, so every synthetic template dir needs the subtree
    mkdirSync(join(dir, 'agent', '.config', 'AGENTS'), { recursive: true });
    writeFileSync(join(dir, 'agent', '.config', 'AGENTS', 'plugin-docs.md'), '# Authoring guide\n');
    mkdirSync(join(dir, 'agent', 'skills', 'bootstrap-plugin-docs'), { recursive: true });
    writeFileSync(join(dir, 'agent', 'skills', 'bootstrap-plugin-docs', 'SKILL.md'), '---\nname: b\n---\n');
    writeFileSync(join(dir, 'README-suffix.md'), '## AI authoring assistance\n');
    for (const [relPath, content] of Object.entries(files)) {
      const target = join(dir, 'docs', relPath);
      mkdirSync(join(target, '..'), { recursive: true });
      writeFileSync(target, content);
    }
    return dir;
  }

  // the templates every plugin type shares, mirroring templates/docs/common
  function makeCommonTemplateDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'panel-docs-common-'));
    tempDirs.push(dir);
    mkdirSync(join(dir, 'workflows'), { recursive: true });
    writeFileSync(join(dir, 'workflows', 'validate-docs.yml'), 'name: Validate documentation\n');
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

  function call(context: Context, overrides: { templates?: Record<string, string>; docsPath?: string } = {}): void {
    const templates = overrides.templates ?? { 'index.md': '# {{pluginName}}\n' };
    setupDocsScaffolding({
      context,
      docsPath: overrides.docsPath ?? 'docs',
      templateDir: makeTemplateDir(templates),
      commonTemplateDir: makeCommonTemplateDir(),
      codemodName: 'panel-docs',
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

    it('throws if src/plugin.json is not valid JSON', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', '{ not valid json');
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => call(context)).toThrow(/Cannot parse src\/plugin\.json/);
    });

    it('throws if src/plugin.json is not a JSON object', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify(['panel']));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => call(context)).toThrow(/does not contain a JSON object/);
    });

    it('throws when docsPath is already set to a different value', () => {
      const context = makeContext({ type: 'panel', name: 'My Plugin', docsPath: 'custom-docs' });
      expect(() => call(context)).toThrow(/docsPath set to 'custom-docs'.*--docsPath custom-docs/s);
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
      expect(pkg.devDependencies?.['@grafana/plugin-docs-cli']).toBe('^0.2.1');
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
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'My Plugin' }));
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

  describe('nested template directories', () => {
    it('copies files nested more than one level deep', () => {
      const context = makeContext();
      call(context, { templates: { 'a/b/c.md': 'deeply nested\n' } });
      expect(context.getFile('docs/a/b/c.md')).toBe('deeply nested\n');
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

    it('throws if the docs template directory is missing (packaging bug guard)', () => {
      const context = makeContext();
      const dir = mkdtempSync(join(tmpdir(), 'panel-docs-empty-'));
      tempDirs.push(dir);
      // no `docs/` subdirectory created under `dir` - simulates a broken build
      expect(() =>
        setupDocsScaffolding({
          context,
          docsPath: 'docs',
          templateDir: dir,
          commonTemplateDir: makeCommonTemplateDir(),
          codemodName: 'panel-docs',
        })
      ).toThrow(/Cannot find docs templates/);
    });

    it('throws if the agent template directory is missing (packaging bug guard)', () => {
      const context = makeContext();
      // a template dir with `docs/` but no `agent/` - simulating a build that copied only half
      const dir = mkdtempSync(join(tmpdir(), 'panel-docs-noagent-'));
      tempDirs.push(dir);
      mkdirSync(join(dir, 'docs'), { recursive: true });
      writeFileSync(join(dir, 'docs', 'index.md'), '# Page\n');
      writeFileSync(join(dir, 'README-suffix.md'), '## AI authoring assistance\n');
      expect(() =>
        setupDocsScaffolding({
          context,
          docsPath: 'docs',
          templateDir: dir,
          commonTemplateDir: makeCommonTemplateDir(),
          codemodName: 'panel-docs',
        })
      ).toThrow(/Cannot find agent templates/);
    });
  });

  describe('validate-docs workflow', () => {
    it('creates .github/workflows/validate-docs.yml', () => {
      const context = makeContext();
      call(context);
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('interpolates {{docsPath}} into the workflow path filters', () => {
      const context = makeContext();
      call(context, { docsPath: 'my-docs' });
      // the synthetic test template has no {{docsPath}} placeholder, so this
      // only proves the substitution doesn't error - the real template is
      // covered by index.test.ts against the shipped workflow content.
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('does not overwrite an existing .github/workflows/validate-docs.yml', () => {
      const context = makeContext();
      context.addFile('.github/workflows/validate-docs.yml', 'old content');
      call(context);
      expect(context.getFile('.github/workflows/validate-docs.yml')).toBe('old content');
    });
  });

  describe('release.yml build-plugin bump', () => {
    it('bumps build-plugin ref in release.yml', () => {
      const context = makeContext();
      call(context);
      const content = context.getFile('.github/workflows/release.yml') ?? '';
      expect(content).toContain('grafana/plugin-actions/build-plugin@build-plugin/v1.2.0');
    });

    it('bumps a bare vX.Y.Z ref (no build-plugin/ prefix)', () => {
      const context = makeContext();
      context.updateFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.0\n');
      call(context);
      expect(context.getFile('.github/workflows/release.yml')).toBe(
        'uses: grafana/plugin-actions/build-plugin@build-plugin/v1.2.0\n'
      );
    });

    it('does not downgrade an existing ref that is already newer than required', () => {
      const context = makeContext();
      context.updateFile(
        '.github/workflows/release.yml',
        'uses: grafana/plugin-actions/build-plugin@build-plugin/v2.0.0\n'
      );
      call(context);
      expect(context.getFile('.github/workflows/release.yml')).toBe(
        'uses: grafana/plugin-actions/build-plugin@build-plugin/v2.0.0\n'
      );
    });

    it('handles multiple build-plugin refs independently, only bumping the older one', () => {
      const context = makeContext();
      context.updateFile(
        '.github/workflows/release.yml',
        'uses: grafana/plugin-actions/build-plugin@v1.0.0\nuses: grafana/plugin-actions/build-plugin@build-plugin/v2.0.0\n'
      );
      call(context);
      expect(context.getFile('.github/workflows/release.yml')).toBe(
        'uses: grafana/plugin-actions/build-plugin@build-plugin/v1.2.0\nuses: grafana/plugin-actions/build-plugin@build-plugin/v2.0.0\n'
      );
    });

    it('normalizes an unparseable ref (e.g. a branch name) to the required tag', () => {
      const context = makeContext();
      context.updateFile(
        '.github/workflows/release.yml',
        'uses: grafana/plugin-actions/build-plugin@some-feature-branch\n'
      );
      call(context);
      expect(context.getFile('.github/workflows/release.yml')).toBe(
        'uses: grafana/plugin-actions/build-plugin@build-plugin/v1.2.0\n'
      );
    });

    it('only bumps refs on a `uses:` line, not incidental mentions', () => {
      const context = makeContext();
      context.updateFile(
        '.github/workflows/release.yml',
        '# see grafana/plugin-actions/build-plugin@v1.0.0 for reference\nuses: grafana/plugin-actions/build-plugin@v1.0.0\n'
      );
      call(context);
      expect(context.getFile('.github/workflows/release.yml')).toBe(
        '# see grafana/plugin-actions/build-plugin@v1.0.0 for reference\nuses: grafana/plugin-actions/build-plugin@build-plugin/v1.2.0\n'
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
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'My Plugin' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => call(context)).not.toThrow();
      expect(context.doesFileExist('.github/workflows/release.yml')).toBe(false);
    });
  });

  describe('assertPluginType', () => {
    it('returns the parsed plugin.json when the type matches', () => {
      const context = makeContext({ type: 'panel', name: 'X' });
      const parsed = assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' });
      expect(parsed.name).toBe('X');
    });

    it('throws when the type does not match', () => {
      const context = makeContext({ type: 'datasource', name: 'X' });
      expect(() => assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' })).toThrow(
        /only works on 'panel' plugins.*type is 'datasource'/
      );
    });

    it('points the user at the sibling codemod in the error message', () => {
      const context = makeContext({ type: 'datasource', name: 'X' });
      expect(() => assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' })).toThrow(
        /create-plugin add datasource-docs/
      );
    });

    it('throws when plugin.json is missing', () => {
      const context = new Context('/virtual');
      expect(() => assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' })).toThrow(
        'Cannot find src/plugin.json'
      );
    });

    it('throws when plugin.json is not valid JSON', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', '{ not valid json');
      expect(() => assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' })).toThrow(
        /Cannot parse src\/plugin\.json/
      );
    });

    it('throws when type is unset', () => {
      const context = makeContext({ name: 'X' });
      expect(() => assertPluginType(context, { expectedType: 'panel', codemodName: 'panel-docs' })).toThrow(
        /type is 'unset'/
      );
    });
  });
});

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

    it('ignores unrelated CLI flags that always ride along in argv', () => {
      const parsed = v.parse(schema, { force: false, f: false, 'experimental-updates': false });
      expect(parsed).toEqual({ docsPath: 'docs' });
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

    it('marks section-brief guidance as a fill-in blockquote', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/index.md') ?? '').toContain('> 📝 **Fill this in:**');
    });

    it('interpolates pluginName into the index page', () => {
      const context = makeContext({ type: 'panel', name: 'My Panel' });
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
      const context = makeContext({ type: 'panel', name: 'My Panel' });
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

  describe('AI authoring assistance', () => {
    const SKILLS = ['.claude/skills/bootstrap-plugin-docs/SKILL.md', '.agents/skills/bootstrap-plugin-docs/SKILL.md'];

    it('writes the skill to every agent skills directory', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      for (const skill of SKILLS) {
        expect(context.doesFileExist(skill)).toBe(true);
      }
    });

    it('writes each skill as a complete self-contained file, not an @import shim', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
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
      panelDocs(context, { docsPath: 'docs' });
      const [first, ...rest] = SKILLS.map((s) => context.getFile(s));
      for (const other of rest) {
        expect(other).toEqual(first);
      }
    });

    it('does not write a redundant .codex copy, since codex reads .agents/skills', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('.codex/skills/bootstrap-plugin-docs/SKILL.md')).toBe(false);
    });

    it('does not scaffold the skills that were folded into the authoring guide', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      for (const name of ['write-plugin-docs', 'review-plugin-docs', 'validate-plugin-docs']) {
        expect(context.doesFileExist(`.claude/skills/${name}/SKILL.md`)).toBe(false);
        expect(context.doesFileExist(`.agents/skills/${name}/SKILL.md`)).toBe(false);
      }
    });

    it('scaffolds the authoring guide', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      const content = context.getFile('.config/AGENTS/plugin-docs.md') ?? '';
      expect(content).toContain('## Keeping docs in sync with source');
      expect(content).toContain('bootstrap-plugin-docs');
    });

    it('keeps the authoring guide out of docsPath, where the validator would treat it as a page', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(false);
      expect(context.doesFileExist('.config/AGENTS/plugin-docs.md')).toBe(true);
    });

    it('interpolates the configured docsPath into the guide and the skill body', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'documentation' });
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
      panelDocs(context, { docsPath: 'docs' });
      expect(context.getFile('.config/AGENTS/plugin-docs.md')).toEqual('CUSTOMIZED');
    });

    it('points .config/AGENTS/instructions.md at the authoring guide when present', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n\nDo the thing.\n');
      panelDocs(context, { docsPath: 'docs' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).toContain('# Existing instructions');
      expect(content).toContain('Do the thing.');
      expect(content).toContain('@./.config/AGENTS/plugin-docs.md');
      expect(content).toContain('before writing or modifying plugin documentation');
    });

    it('names the configured docsPath in the instructions pointer', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n');
      panelDocs(context, { docsPath: 'documentation' });
      expect(context.getFile('.config/AGENTS/instructions.md') ?? '').toContain('`documentation/`');
    });

    it('does not duplicate the instructions pointer if already present', () => {
      const context = makeContext();
      context.addFile(
        '.config/AGENTS/instructions.md',
        '# Existing\n\n- Read @./.config/AGENTS/plugin-docs.md before writing or modifying plugin documentation.\n'
      );
      panelDocs(context, { docsPath: 'docs' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content.match(/before writing or modifying plugin documentation/g)?.length).toBe(1);
    });

    it('does not throw or create .config/AGENTS/instructions.md when it is absent', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('.config/AGENTS/instructions.md')).toBe(false);
    });

    it('appends the AI authoring section to docs/README.md by default', () => {
      const context = makeContext();
      panelDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('## AI authoring assistance');
      expect(content).toContain('bootstrap-plugin-docs');
    });

    it('does not duplicate the AI authoring section if docs/README.md already contains it', () => {
      const context = makeContext();
      context.addFile('docs/README.md', '# My Panel documentation\n\n## AI authoring assistance\n\nAlready here.\n');
      panelDocs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content.match(/## AI authoring assistance/g)?.length).toBe(1);
    });
  });
});
