import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import * as v from 'valibot';
import { parse as parseYaml } from 'yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../context.js';
import docs, { assertSupportedPluginType, schema, setupDocsScaffolding } from './docs.js';

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
    const dir = mkdtempSync(join(tmpdir(), 'docs-templates-'));
    tempDirs.push(dir);
    mkdirSync(join(dir, 'docs'), { recursive: true });
    for (const [relPath, content] of Object.entries(files)) {
      const target = join(dir, 'docs', relPath);
      mkdirSync(join(target, '..'), { recursive: true });
      writeFileSync(target, content);
    }
    return dir;
  }

  // the templates every plugin type shares, mirroring templates/docs/common
  function makeCommonTemplateDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'docs-common-'));
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
    });
  }

  describe('early exit', () => {
    it('throws if docs directory already exists on disk', () => {
      const root = mkdtempSync(join(tmpdir(), 'docs-exists-'));
      tempDirs.push(root);
      mkdirSync(join(root, 'docs'), { recursive: true });
      const context = new Context(root);
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'My Plugin' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => call(context)).toThrow("A directory already exists at 'docs'");
    });
  });

  it('is idempotent', async () => {
    const context = makeContext();
    // shared across both runs so the second one reaches the skip-existing-file branches
    const templateDir = makeTemplateDir({ 'index.md': '# {{pluginName}}\n' });
    const commonTemplateDir = makeCommonTemplateDir();
    const migrate = async (ctx: Context) =>
      setupDocsScaffolding({ context: ctx, docsPath: 'docs', templateDir, commonTemplateDir });

    await expect(migrate).toBeIdempotent(context);
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
      expect(pkg.devDependencies?.['@grafana/plugin-docs-cli']).toBe('^0.7.0');
    });

    it('adds docs:serve and docs:validate scripts, with no separate release script', () => {
      const context = makeContext();
      call(context);
      const pkg = JSON.parse(context.getFile('package.json') ?? '{}');
      expect(pkg.scripts?.['docs:serve']).toBe('plugin-docs-cli serve --port 3001 --reload');
      expect(pkg.scripts?.['docs:validate']).toBe('plugin-docs-cli validate');
      expect(pkg.scripts?.['docs:validate:release']).toBeUndefined();
    });

    it('leaves a docs:validate:release script from an earlier scaffold alone', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'My Plugin' }));
      context.addFile(
        'package.json',
        JSON.stringify({ scripts: { 'docs:validate:release': 'custom-command' }, devDependencies: {} })
      );
      context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
      call(context);
      const pkg = JSON.parse(context.getFile('package.json') ?? '{}');
      expect(pkg.scripts?.['docs:validate:release']).toBe('custom-command');
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
      expect(pkg.scripts?.['docs:validate']).toBe('plugin-docs-cli validate');
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
      // docsPath already set, so this docs/ folder is ours from a previous run, not a
      // foreign one - the folder-exists guard must fall through rather than refuse.
      const context = makeContext({ type: 'panel', name: 'My Plugin', docsPath: 'docs' });
      context.addFile('docs/index.md', '# Existing\n');
      call(context, { templates: { 'index.md': '# Replacement\n' } });
      expect(context.getFile('docs/index.md')).toBe('# Existing\n');
    });

    it('throws if the docs template directory is missing (packaging bug guard)', () => {
      const context = makeContext();
      const dir = mkdtempSync(join(tmpdir(), 'docs-empty-'));
      tempDirs.push(dir);
      // no `docs/` subdirectory created under `dir` - simulates a broken build
      expect(() =>
        setupDocsScaffolding({
          context,
          docsPath: 'docs',
          templateDir: dir,
          commonTemplateDir: makeCommonTemplateDir(),
        })
      ).toThrow(/Cannot find templates at .*docs/);
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

  describe('release.yml action bumps', () => {
    function bumped(release: string): string | undefined {
      const context = makeContext();
      context.updateFile('.github/workflows/release.yml', release);
      call(context);
      return context.getFile('.github/workflows/release.yml');
    }

    it('raises build-plugin to build-plugin/v1.2.0', () => {
      expect(bumped('uses: grafana/plugin-actions/build-plugin@v1.0.2\n')).toBe(
        'uses: grafana/plugin-actions/build-plugin@build-plugin/v1.2.0\n'
      );
    });

    it('raises package-plugin to package-plugin/v1.3.3', () => {
      expect(bumped('uses: grafana/plugin-actions/package-plugin@package-plugin/v1.3.2\n')).toBe(
        'uses: grafana/plugin-actions/package-plugin@package-plugin/v1.3.3\n'
      );
    });

    it('does not throw when release.yml does not exist', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'My Plugin' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => call(context)).not.toThrow();
      expect(context.doesFileExist('.github/workflows/release.yml')).toBe(false);
    });
  });

  describe('assertSupportedPluginType', () => {
    it('returns the plugin type when it is supported', () => {
      const context = makeContext({ type: 'panel', name: 'X' });
      expect(assertSupportedPluginType(context)).toBe('panel');
    });

    it.each(['app', 'datasource'])('reports %s as not supported yet', (type) => {
      const context = makeContext({ type, name: 'X' });
      expect(() => assertSupportedPluginType(context)).toThrow(
        new RegExp(`does not support '${type}' plugins yet.*Supported so far: panel`, 's')
      );
    });

    it('reports an unset type against the supported list', () => {
      const context = makeContext({ name: 'X' });
      expect(() => assertSupportedPluginType(context)).toThrow(/needs a plugin type of panel.*found 'unset'/s);
    });

    it('reports an unrecognised type against the supported list', () => {
      const context = makeContext({ type: 'renderer', name: 'X' });
      expect(() => assertSupportedPluginType(context)).toThrow(/needs a plugin type of panel.*found 'renderer'/s);
    });
  });
});

describe('docs codemod', () => {
  describe('validate-docs workflow package manager', () => {
    // exercises the real shipped workflow template, so these assert on generated CI content
    function workflowFor(packageManager?: string): string {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'P' }));
      context.addFile(
        'package.json',
        JSON.stringify({ scripts: {}, devDependencies: {}, ...(packageManager ? { packageManager } : {}) })
      );
      docs(context, { docsPath: 'docs' });
      return context.getFile('.github/workflows/validate-docs.yml') ?? '';
    }

    it('runs validation on every push rather than skipping while docs are unfinished', () => {
      // unfilled stubs are warnings, so CI can check links and frontmatter from the first commit
      // instead of waiting until the docs are done
      const workflow = workflowFor('npm@10.2.3');
      expect(workflow).not.toContain('section-brief');
      expect(workflow).toContain('npm run docs:validate');
    });

    it('runs the pinned CLI through the docs:validate script rather than fetching the latest', () => {
      const workflow = workflowFor('npm@10.2.3');
      expect(workflow).toContain('npm run docs:validate');
      expect(workflow).not.toContain('npx');
    });

    it.each([
      ['npm@10.2.3', 'npm ci', 'npm'],
      ['pnpm@9.1.0', 'pnpm install --frozen-lockfile --prefer-offline', 'pnpm'],
      ['yarn@4.1.0', 'yarn install --immutable', 'yarn'],
    ])('uses the %s install command and cache', (packageManager, installCmd, name) => {
      const workflow = workflowFor(packageManager);
      expect(workflow).toContain(`run: ${installCmd}`);
      expect(workflow).toContain(`cache: '${name}'`);
      expect(workflow).toContain(`${name} run docs:validate`);
    });

    it('adds the pnpm setup action only for pnpm', () => {
      expect(workflowFor('pnpm@9.1.0')).toContain('pnpm/action-setup@v6');
      expect(workflowFor('npm@10.2.3')).not.toContain('pnpm/action-setup');
    });

    it('adds the pnpm setup step right after checkout, the way ci.yml does', () => {
      expect(workflowFor('pnpm@9.1.0')).toContain(
        '          persist-credentials: false\n      # pnpm action uses the packageManager field in package.json to\n      # understand which version to install.\n      - uses: pnpm/action-setup@v6\n      - name: Setup Node.js environment\n'
      );
      expect(workflowFor('npm@10.2.3')).toContain(
        '          persist-credentials: false\n      - name: Setup Node.js environment\n'
      );
    });

    it('falls back to npm when package.json has no packageManager field', () => {
      const workflow = workflowFor();
      expect(workflow).toContain('run: npm ci');
      expect(workflow).not.toContain('pnpm/action-setup');
    });
  });

  describe('re-running on an adopted plugin', () => {
    it('is additive when plugin.json already declares the same docsPath', () => {
      const root = mkdtempSync(join(tmpdir(), 'docs-rerun-'));
      mkdirSync(join(root, 'docs'), { recursive: true });
      writeFileSync(join(root, 'docs', 'index.md'), '# Mine\n');
      const context = new Context(root);
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'P', docsPath: 'docs' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));

      docs(context, { docsPath: 'docs' });

      // the author's page is left untouched, and agent files can still be picked up after a bump
      expect(context.listChanges()['docs/index.md']).toBeUndefined();
      expect(context.doesFileExist('.config/AGENTS/instructions.md')).toBe(true);
    });

    it('does not bring back a page the author deleted, but still adds missing meta files', () => {
      const root = mkdtempSync(join(tmpdir(), 'docs-rerun-deleted-'));
      mkdirSync(join(root, 'docs'), { recursive: true });
      writeFileSync(join(root, 'docs', 'index.md'), '# Mine\n');
      const context = new Context(root);
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'P', docsPath: 'docs' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));

      docs(context, { docsPath: 'docs' });

      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(false);
      expect(context.doesFileExist('docs/options.md')).toBe(false);
      for (const meta of ['README.md', 'AGENTS.md', 'CLAUDE.md']) {
        expect(context.doesFileExist(`docs/${meta}`), meta).toBe(true);
      }
    });

    it('scaffolds the pages into an empty docs folder that plugin.json already declares', () => {
      const root = mkdtempSync(join(tmpdir(), 'docs-rerun-empty-'));
      mkdirSync(join(root, 'docs'), { recursive: true });
      writeFileSync(join(root, 'docs', 'README.md'), '# Notes\n');
      const context = new Context(root);
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'P', docsPath: 'docs' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));

      docs(context, { docsPath: 'docs' });

      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
    });

    it.each(['./docs', 'docs/', 'docs/v1.0'])(
      'refuses an existing docsPath of %s instead of suggesting a --docsPath the schema rejects',
      (existingDocsPath) => {
        const context = makeContext({ type: 'panel', name: 'P', docsPath: existingDocsPath });
        expect(() => docs(context, { docsPath: 'catalog-docs' })).toThrow(
          `src/plugin.json has docsPath set to '${existingDocsPath}', which create-plugin add docs can't use.`
        );
      }
    );

    it('refuses a docs folder that plugin.json knows nothing about', () => {
      const root = mkdtempSync(join(tmpdir(), 'docs-unknown-'));
      mkdirSync(join(root, 'docs'), { recursive: true });
      const context = new Context(root);
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'P' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => docs(context, { docsPath: 'docs' })).toThrow(/has no docsPath/);
    });
  });

  describe('plugin.json requirements', () => {
    it('refuses a plugin.json with no name rather than scaffolding docs about "my-plugin"', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => docs(context, { docsPath: 'docs' })).toThrow(/has no "name"/);
    });

    it('writes a plugin name with special characters as-is, not HTML-escaped', () => {
      const context = makeContext({ type: 'panel', name: "Erik's A & B" });
      docs(context, { docsPath: 'docs' });
      const index = context.getFile('docs/index.md') ?? '';
      expect(index).toContain(`description: "Where to start and what to read next in the Erik's A & B docs."`);
      expect(index).not.toMatch(/&amp;|&#x27;/);
    });

    it('keeps every page frontmatter valid YAML when the plugin name contains YAML syntax', () => {
      const name = 'Clock: "Analog" #2 \\ *';
      const context = makeContext({ type: 'panel', name });
      docs(context, { docsPath: 'docs' });
      const pages = ['index.md', 'options.md', 'data-formats.md', 'examples.md', 'troubleshooting.md'];
      for (const page of pages) {
        const frontmatter = /^---\n([\s\S]*?)\n---/.exec(context.getFile(`docs/${page}`) ?? '')?.[1] ?? '';
        const { description } = parseYaml(frontmatter);
        expect(description, page).toContain(name);
      }
    });

    it('gives the landing page a title that stays short whatever the plugin is called', () => {
      const context = makeContext({ type: 'panel', name: 'A'.repeat(80) });
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/index.md')).toContain('\ntitle: Introduction\n');
    });

    it('substitutes the plugin id into catalog URLs', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', name: 'P', id: 'acme-p-panel' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      docs(context, { docsPath: 'docs' });
      const readme = context.getFile('docs/README.md') ?? '';
      expect(readme).toContain('grafana/plugins/acme-p-panel/');
      expect(readme).not.toContain('<slug>');
    });
  });

  describe('plugin type support', () => {
    it.each(['app', 'datasource'])('refuses a %s plugin until its templates exist', (type) => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type, name: 'X' }));
      expect(() => docs(context, { docsPath: 'docs' })).toThrow(new RegExp(`does not support '${type}' plugins yet`));
    });

    it('refuses a plugin with no type set', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ name: 'X' }));
      expect(() => docs(context, { docsPath: 'docs' })).toThrow(/needs a plugin type of panel/);
    });
  });

  describe('docsPath validation', () => {
    it('defaults to "catalog-docs" when omitted', () => {
      expect(v.parse(schema, {})).toEqual({ docsPath: 'catalog-docs' });
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

    it('accepts a nested docsPath', () => {
      expect(v.parse(schema, { docsPath: 'docs/plugin' })).toEqual({ docsPath: 'docs/plugin' });
    });

    it('rejects a leading "./"', () => {
      expect(() => v.parse(schema, { docsPath: './docs' })).toThrow();
    });

    it('rejects a trailing slash', () => {
      expect(() => v.parse(schema, { docsPath: 'docs/' })).toThrow();
    });

    it('rejects a backslash', () => {
      expect(() => v.parse(schema, { docsPath: 'C:\\docs' })).toThrow();
    });

    it('rejects a quote character', () => {
      expect(() => v.parse(schema, { docsPath: "docs'" })).toThrow();
    });

    it('ignores unrelated CLI flags that always ride along in argv', () => {
      const parsed = v.parse(schema, { force: false, f: false, 'experimental-updates': false });
      expect(parsed).toEqual({ docsPath: 'catalog-docs' });
    });
  });

  describe('generated files', () => {
    it('creates all six panel docs files', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/data-formats.md')).toBe(true);
      expect(context.doesFileExist('docs/options.md')).toBe(true);
      expect(context.doesFileExist('docs/examples.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
      expect(context.doesFileExist('docs/README.md')).toBe(true);
    });

    it('uses the expected H2s in each panel file', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/data-formats.md') ?? '').toContain('## Supported data shape');
      expect(context.getFile('docs/options.md') ?? '').toContain('## Panel options');
      expect(context.getFile('docs/examples.md') ?? '').toContain('## Basic example');
      expect(context.getFile('docs/troubleshooting.md') ?? '').toContain('## Common issues');
    });

    it('scaffolds section briefs as HTML comments that start with section-brief', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/index.md') ?? '').toContain('<!-- section-brief\nFill this in:');
      expect(context.getFile('docs/options.md') ?? '').toContain('<!-- section-brief\nFill this in:');
    });

    it('closes every brief and never nests a comment inside one', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      for (const page of ['index', 'options', 'data-formats', 'examples', 'troubleshooting']) {
        const content = context.getFile(`docs/${page}.md`) ?? '';
        const briefs = content.match(/<!-- section-brief\n[\s\S]*?-->/g) ?? [];
        expect(briefs.length, page).toBeGreaterThan(0);
        expect(content.match(/<!--/g)?.length, page).toBe(briefs.length);
        expect(content, page).not.toContain('section-brief:');
      }
    });

    it('scaffolds pages where every section is only a brief, so an untouched scaffold is all stubs', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      for (const page of ['index', 'options', 'data-formats', 'examples', 'troubleshooting']) {
        const left = (context.getFile(`docs/${page}.md`) ?? '')
          .replace(/^---\n[\s\S]*?\n---\n/, '')
          .replace(/<!-- section-brief\n[\s\S]*?-->/g, '')
          .replace(/^#{1,6} .*$/gm, '')
          .trim();
        expect(left, page).toBe('');
      }
    });

    it('interpolates pluginName into the index page', () => {
      const context = makeContext({ type: 'panel', name: 'My Panel' });
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/index.md') ?? '').toContain('My Panel');
    });

    it('writes the validate-docs workflow', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('.github/workflows/validate-docs.yml')).toBe(true);
    });

    it('interpolates a custom docsPath into the workflow path filters', () => {
      const context = makeContext();
      docs(context, { docsPath: 'documentation' });
      const content = context.getFile('.github/workflows/validate-docs.yml') ?? '';
      expect(content).toContain("'documentation/**'");
      expect(content).not.toContain('{{docsPath}}');
    });

    it('bumps the build-plugin ref in release.yml', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('.github/workflows/release.yml') ?? '').toContain(
        'grafana/plugin-actions/build-plugin@build-plugin/v1.2.0'
      );
    });

    it('options.md asks for the Panel options table format with the four expected columns', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/options.md') ?? '';
      expect(content).toContain('| Option | Type | Default | Description |');
      expect(content).toContain('## Standard field options');
      expect(content).toContain('## Custom field options');
    });

    it('scaffolds docs/README.md with panel-specific content', () => {
      const context = makeContext({ type: 'panel', name: 'My Panel' });
      docs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain('# My Panel documentation');
      expect(content).toContain('grafana.com/developers/plugin-tools/how-to-guides/plugin-docs');
      expect(content).toContain('npm run docs:validate');
      expect(content).not.toContain('docs:validate:release');
    });

    it('does not scaffold a docs/README.txt (legacy filename)', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/README.txt')).toBe(false);
    });
  });

  describe('AI authoring assistance', () => {
    it('does not scaffold any skills', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      const skills = Object.keys(context.listChanges()).filter((file) => /(^|\/)skills\//.test(file));
      expect(skills).toEqual([]);
    });

    it('scaffolds AGENTS.md in the docs folder, pointing at the guides shipped with plugin-docs-cli', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/AGENTS.md') ?? '';
      expect(content).toContain('node_modules/@grafana/plugin-docs-cli/docs/index.md');
      expect(content).toContain('npm run docs:validate');
      expect(content).toContain('`empty-section` or `unfilled-section-brief` warning');
      expect(content).not.toContain('docs:validate:release');
      expect(content).toContain('## Pages and their source');
      expect(content).toContain('## Section briefs');
      expect(content).not.toContain('{{');
    });

    it('lists the conventional filenames for optional pages in the docs AGENTS.md', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/AGENTS.md') ?? '';
      expect(content).toContain('## Optional pages');
      for (const page of ['presets.md', 'permissions.md', 'accessibility.md']) {
        expect(content).toContain(`\`${page}\``);
      }
    });

    it('scaffolds CLAUDE.md in the docs folder as an import of AGENTS.md', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/CLAUDE.md')).toEqual('@AGENTS.md\n');
    });

    it('no longer scaffolds an authoring guide under .config', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('.config/AGENTS/plugin-docs.md')).toBe(false);
    });

    it('scaffolds the docs AGENTS.md under the configured docsPath', () => {
      const context = makeContext();
      docs(context, { docsPath: 'documentation' });
      expect(context.doesFileExist('documentation/AGENTS.md')).toBe(true);
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(false);
    });

    it('does not overwrite an existing customized docs AGENTS.md', () => {
      const context = makeContext({ type: 'panel', name: 'My Plugin', docsPath: 'docs' });
      context.addFile('docs/AGENTS.md', 'CUSTOMIZED');
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/AGENTS.md')).toEqual('CUSTOMIZED');
    });

    it('appends a Plugin docs section to .config/AGENTS/instructions.md when present', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n\nDo the thing.\n');
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('.config/AGENTS/instructions.md')).toBe(
        '# Existing instructions\n\nDo the thing.\n\n## Plugin docs\n\nWhenever you add, remove or change a feature in the plugin, you must update the plugin documentation under `docs/`. Refer to [`docs/AGENTS.md`](../../docs/AGENTS.md) for instructions.\n'
      );
    });

    it('names the configured docsPath in the Plugin docs section', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n');
      docs(context, { docsPath: 'documentation' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).toContain('under `documentation/`');
      expect(content).toContain('[`documentation/AGENTS.md`](../../documentation/AGENTS.md)');
    });

    it.each([
      ['a re-run', '## Documentation\n\nRefer to [`docs/AGENTS.md`](./docs/AGENTS.md) for instructions.\n'],
      ['an older one-line pointer', '- Read `docs/AGENTS.md` before writing or modifying plugin documentation.\n'],
    ])('does not add a second pointer after %s', (_, pointer) => {
      const context = makeContext();
      const original = `# Existing\n\n${pointer}`;
      context.addFile('.config/AGENTS/instructions.md', original);
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('.config/AGENTS/instructions.md')).toBe(original);
    });

    it('creates .config/AGENTS/instructions.md with the Plugin docs section when it is absent', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      const content = context.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(content).toContain('This repository contains a **Grafana plugin**');
      expect(content).toContain('\n\n## Plugin docs\n\n');
      expect(content).toContain('[`docs/AGENTS.md`](../../docs/AGENTS.md)');
    });

    it('creates root AGENTS.md, CLAUDE.md and GEMINI.md when absent, pointing at .config/AGENTS/instructions.md', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      for (const filename of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md']) {
        const content = context.getFile(filename) ?? '';
        expect(content).toContain('.config/AGENTS/instructions.md');
      }
    });

    it('keeps existing content in root AGENTS.md, CLAUDE.md and GEMINI.md, appending a pointer to instructions.md', () => {
      const context = makeContext();
      context.addFile('AGENTS.md', 'CUSTOM AGENTS');
      context.addFile('CLAUDE.md', 'CUSTOM CLAUDE');
      context.addFile('GEMINI.md', 'CUSTOM GEMINI');
      docs(context, { docsPath: 'docs' });
      for (const [filename, original] of [
        ['AGENTS.md', 'CUSTOM AGENTS'],
        ['CLAUDE.md', 'CUSTOM CLAUDE'],
        ['GEMINI.md', 'CUSTOM GEMINI'],
      ] as const) {
        const content = context.getFile(filename) ?? '';
        expect(content).toContain(original);
        expect(content).toContain('.config/AGENTS/instructions.md');
      }
    });

    it('creates the e2e-testing.md that instructions.md imports, rendered for the plugin', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('.config/AGENTS/instructions.md')).toContain('@./.config/AGENTS/e2e-testing.md');
      const content = context.getFile('.config/AGENTS/e2e-testing.md') ?? '';
      expect(content).toContain('npm run e2e');
      expect(content).not.toContain('{{');
    });

    it('leaves the rest of .config/AGENTS alone when instructions.md already exists', () => {
      const context = makeContext();
      context.addFile('.config/AGENTS/instructions.md', '# Existing instructions\n');
      docs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('.config/AGENTS/e2e-testing.md')).toBe(false);
    });

    it.each([
      ['npm@10.2.3', 'npx -y @grafana/create-plugin@latest add docs-content'],
      ['pnpm@9.1.0', 'pnpm dlx @grafana/create-plugin@latest add docs-content'],
      ['yarn@4.1.0', 'yarn dlx @grafana/create-plugin@latest add docs-content'],
    ])('points docs/README.md at docs-content with the %s exec command', (packageManager, command) => {
      const context = makeContext();
      context.updateFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {}, packageManager }));
      docs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/README.md') ?? '';
      expect(content).toContain(`\`${command}\``);
      expect(content).not.toContain('bootstrap-plugin-docs');
    });
  });

  describe('scaffold wording', () => {
    it('never refers to strict mode, the unfilled-stubs flag or a release script', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      const stale = /--strict|--no-strict|allow-unfilled|validate:release|strict mode/;
      // .config/AGENTS is the shared create-plugin template, which has its own wording
      const files = Object.keys(context.listChanges()).filter((file) => !file.startsWith('.config/'));
      expect(files.length).toBeGreaterThan(10);
      for (const file of files) {
        expect(context.getFile(file) ?? '', file).not.toMatch(stale);
      }
      expect((context.getMessage()?.body ?? []).join('\n')).not.toMatch(stale);
    });
  });

  describe('next steps', () => {
    function nextSteps(context: Context): string[] {
      docs(context, { docsPath: 'docs' });
      return (context.getMessage()?.body ?? []).map((line) => stripVTControlCharacters(line));
    }

    it('numbers the steps in the order the author does them', () => {
      expect(nextSteps(makeContext()).filter((line) => /^ \d\. /.test(line))).toEqual([
        ' 1. Read docs/README.md',
        ' 2. Optional: have an AI agent draft the pages',
        ' 3. Fill in or review the pages under docs/',
      ]);
    });

    it('tells the author to commit before running docs-content, since add needs a clean tree', () => {
      const body = nextSteps(makeContext());
      const step = body.indexOf(' 2. Optional: have an AI agent draft the pages');
      expect(body[step + 1]).toBe(
        '    Commit these changes, then run npx -y @grafana/create-plugin@latest add docs-content. It fills the pages from your source code and README.'
      );
    });

    it('indents each detail line under its step', () => {
      const body = nextSteps(makeContext());
      const step = body.indexOf(' 3. Fill in or review the pages under docs/');
      expect(body[step + 1]).toBe(
        '    Preview them with npm run docs:serve, which also warns about every section left to fill.'
      );
      expect(body.join('\n')).not.toContain('docs:validate:release');
      expect(body.join('\n')).not.toContain('strict');
    });

    it('leaves out the attention section when there is nothing to check', () => {
      expect(nextSteps(makeContext())).not.toContain('Needs your attention:');
    });

    it('says nothing about agent files, since root files that miss instructions.md get fixed instead of flagged', () => {
      const context = makeContext();
      context.addFile('CLAUDE.md', '# My own instructions\n\nRead docs/AGENTS.md for docs.\n');
      context.addFile('GEMINI.md', '# Gemini notes\n');
      expect(nextSteps(context).join('\n')).not.toContain("won't find docs/AGENTS.md");
    });

    it('reports each existing root agent file it appended the instructions pointer to', () => {
      const context = makeContext();
      context.addFile('CLAUDE.md', '# My own instructions\n');
      const body = nextSteps(context);
      expect(body).toContain('Needs your attention:');
      expect(body).toContain(' ! Added a pointer to .config/AGENTS/instructions.md at the end of CLAUDE.md');
      expect(body.join('\n')).not.toContain('end of AGENTS.md');
    });

    it('says nothing about the release pipeline when build-plugin was bumped', () => {
      expect(nextSteps(makeContext()).join('\n')).not.toContain('build-plugin');
    });

    it('asks to check the release pipeline when release.yml has no build-plugin step', () => {
      const context = makeContext();
      context.updateFile('.github/workflows/release.yml', 'name: Release\n');
      expect(nextSteps(context).join('\n')).toContain('Make sure your release pipeline builds docs/');
    });

    it('asks to check a build-plugin ref pinned to a branch or commit', () => {
      const context = makeContext();
      context.updateFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@my-branch\n');
      expect(nextSteps(context).join('\n')).toContain('Docs need build-plugin/v1.2.0 or later.');
    });

    it('asks to check a package-plugin ref pinned to a commit', () => {
      const context = makeContext();
      context.updateFile(
        '.github/workflows/release.yml',
        'uses: grafana/plugin-actions/package-plugin@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n'
      );
      const body = nextSteps(context).join('\n');
      expect(body).toContain('Docs need package-plugin/v1.3.3 or later.');
      expect(body).not.toContain('Make sure your release pipeline');
    });

    it('says nothing about an action on main, which always runs the latest release', () => {
      const context = makeContext();
      context.updateFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@main\n');
      expect(nextSteps(context).join('\n')).not.toContain('build-plugin');
    });
  });
});
