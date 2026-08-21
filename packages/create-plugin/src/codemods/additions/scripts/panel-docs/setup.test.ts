import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../../context.js';
import { assertAgentLoop, assertPluginType, setupDocsScaffolding, type AgentLoop } from './setup.js';

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

describe('panel-docs/setup', () => {
  const tempDirs: string[] = [];

  // build a synthetic templateBaseUrl folder with the given docs template file contents
  function makeTemplateBaseUrl(files: Record<string, string>): URL {
    const dir = mkdtempSync(join(tmpdir(), 'panel-docs-templates-'));
    tempDirs.push(dir);
    mkdirSync(join(dir, 'docs'), { recursive: true });
    mkdirSync(join(dir, 'workflows'), { recursive: true });
    writeFileSync(join(dir, 'workflows', 'validate-docs.yml'), 'name: Validate documentation\n');
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

  function call(
    context: Context,
    overrides: { templates?: Record<string, string>; docsPath?: string; agentLoop?: AgentLoop } = {}
  ): void {
    const templates = overrides.templates ?? { 'index.md': '# {{pluginName}}\n' };
    setupDocsScaffolding({
      context,
      docsPath: overrides.docsPath ?? 'docs',
      templateBaseUrl: makeTemplateBaseUrl(templates),
      codemodName: 'panel-docs',
      agentLoop: overrides.agentLoop,
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
          templateBaseUrl: pathToFileURL(`${dir}/`),
          codemodName: 'panel-docs',
        })
      ).toThrow(/Cannot find docs templates/);
    });

    it('throws if the agent template directory is missing (packaging bug guard)', () => {
      const context = makeContext();
      // makeTemplateBaseUrl only ever creates `docs/` and `workflows/` - no
      // `agent/` subdirectory - simulating a broken build when agentLoop is requested.
      expect(() => call(context, { agentLoop: 'claude' })).toThrow(/Cannot find agent templates/);
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

  describe('assertAgentLoop', () => {
    it('throws a friendly message when loop is undefined', () => {
      expect(() => assertAgentLoop(undefined)).toThrow(
        /Missing required flag: --agent-loop[\s\S]*--agent-loop=claude[\s\S]*--agent-loop=none/
      );
    });

    it('does not throw for any valid loop value', () => {
      for (const loop of ['claude', 'codex', 'cursor', 'none'] as const) {
        expect(() => assertAgentLoop(loop)).not.toThrow();
      }
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
