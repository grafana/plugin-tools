import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import * as v from 'valibot';
import { parse as parseYaml } from 'yaml';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../context.js';
import { flushChanges } from '../../utils.js';
import { getPackageManagerWithFallback } from '../../../utils/utils.packageManager.js';
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

vi.mock(import('../../../utils/utils.packageManager.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  getPackageManagerWithFallback: vi.fn(() => ({ packageManagerName: 'npm', packageManagerVersion: '10.9.0' })),
}));

function makeContext(
  pluginJson: Record<string, unknown> = { type: 'panel', id: 'acme-test-panel', name: 'My Plugin' }
): Context {
  const context = new Context('/virtual');
  context.addFile('src/plugin.json', JSON.stringify(pluginJson));
  context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
  context.addFile('.github/workflows/release.yml', 'uses: grafana/plugin-actions/build-plugin@v1.0.2\n');
  return context;
}

// a plugin.json per type with every feature that adds a page turned on, so every template is rendered
const FULL_PLUGIN_JSON: Record<string, Record<string, unknown>> = {
  panel: { type: 'panel', id: 'acme-test-panel', name: 'My Plugin' },
  datasource: {
    type: 'datasource',
    id: 'acme-test-datasource',
    name: 'My Plugin',
    backend: true,
    annotations: true,
    alerting: true,
    includes: [{ type: 'dashboard', name: 'Overview', path: 'dashboards/overview.json' }],
  },
  app: {
    type: 'app',
    id: 'acme-test-app',
    name: 'My Plugin',
    backend: true,
    roles: [],
    includes: [
      { type: 'page', name: 'Overview', path: '/a/%PLUGIN_ID%/overview', role: 'Editor', defaultNav: true },
      { type: 'page', name: 'Configuration', path: '/plugins/%PLUGIN_ID%', role: 'Admin' },
      { type: 'dashboard', name: 'Overview', path: 'dashboards/overview.json' },
    ],
  },
};
const PAGES_BY_TYPE: Record<string, string[]> = {
  panel: ['index', 'options', 'data-formats', 'examples', 'troubleshooting'],
  datasource: [
    'index',
    'configure',
    'query-editor',
    'template-variables',
    'annotations',
    'alerting',
    'dashboards',
    'troubleshooting',
  ],
  app: ['index', 'configure', 'overview', 'dashboards', 'permissions', 'troubleshooting'],
};
const PLUGIN_TYPES = Object.keys(PAGES_BY_TYPE);

// scaffolds once and writes it to disk, so the re-run sees a plugin that is already fully set up
function scaffoldThenRerun(
  pluginJson: Record<string, unknown>,
  addFeature: Record<string, unknown>,
  docsFile?: string
) {
  const root = mkdtempSync(join(tmpdir(), 'docs-rerun-feature-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: {}, devDependencies: {} }));
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src', 'plugin.json'), JSON.stringify(pluginJson));
  const first = new Context(root);
  docs(first, { docsPath: 'docs' });
  flushChanges(first);
  writeFileSync(join(root, 'src', 'plugin.json'), JSON.stringify({ ...pluginJson, docsPath: 'docs', ...addFeature }));
  if (docsFile) {
    mkdirSync(join(root, 'docs', docsFile, '..'), { recursive: true });
    writeFileSync(join(root, 'docs', docsFile), '# Mine\n');
  }

  const context = new Context(root);
  docs(context, { docsPath: 'docs' });
  rmSync(root, { recursive: true, force: true });
  return { context, body: stripVTControlCharacters((context.getMessage()?.body ?? []).join('\n')) };
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
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'My Plugin' }));
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
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'My Plugin', docsPath: 'custom-docs' });
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
      expect(pkg.devDependencies?.['@grafana/plugin-docs-cli']).toBe('^0.8.0');
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
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'My Plugin' }));
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
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'My Plugin' }));
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
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'My Plugin', docsPath: 'docs' });
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
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'My Plugin' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => call(context)).not.toThrow();
      expect(context.doesFileExist('.github/workflows/release.yml')).toBe(false);
    });
  });

  describe('assertSupportedPluginType', () => {
    it('returns the plugin type when it is supported', () => {
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'X' });
      expect(assertSupportedPluginType(context)).toBe('panel');
    });

    it('returns datasource for a data source plugin', () => {
      const context = makeContext({ type: 'datasource', id: 'acme-test-datasource', name: 'X' });
      expect(assertSupportedPluginType(context)).toBe('datasource');
    });

    it('returns app for an app plugin', () => {
      const context = makeContext({ type: 'app', id: 'acme-test-app', name: 'X' });
      expect(assertSupportedPluginType(context)).toBe('app');
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
    function workflowFor(packageManager: string): string {
      const [packageManagerName, packageManagerVersion] = packageManager.split('@');
      vi.mocked(getPackageManagerWithFallback).mockReturnValueOnce({ packageManagerName, packageManagerVersion });
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'P' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
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

    it.each([
      ['npm@10.2.3', 'package-lock.json'],
      ['pnpm@9.1.0', 'pnpm-lock.yaml'],
      ['yarn@4.1.0', 'yarn.lock'],
    ])(
      'also runs for %s when package.json or %s changes, so a docs CLI bump is validated',
      (packageManager, lockFile) => {
        const { on } = parseYaml(workflowFor(packageManager));
        for (const trigger of [on.push, on.pull_request]) {
          expect(trigger.paths).toEqual(['docs/**', 'src/plugin.json', 'package.json', lockFile]);
        }
      }
    );

    it('runs docs:validate directly, with no docsPath guard', () => {
      const { jobs } = parseYaml(workflowFor('npm@10.2.3'));
      expect(jobs.validate.steps.at(-1)).toEqual({
        name: 'Validate plugin documentation',
        run: 'npm run docs:validate',
      });
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
  });

  describe('re-running on an adopted plugin', () => {
    it('is additive when plugin.json already declares the same docsPath', () => {
      const root = mkdtempSync(join(tmpdir(), 'docs-rerun-'));
      mkdirSync(join(root, 'docs'), { recursive: true });
      writeFileSync(join(root, 'docs', 'index.md'), '# Mine\n');
      const context = new Context(root);
      context.addFile(
        'src/plugin.json',
        JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'P', docsPath: 'docs' })
      );
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
      context.addFile(
        'src/plugin.json',
        JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'P', docsPath: 'docs' })
      );
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
      context.addFile(
        'src/plugin.json',
        JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'P', docsPath: 'docs' })
      );
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));

      docs(context, { docsPath: 'docs' });

      expect(context.doesFileExist('docs/index.md')).toBe(true);
      expect(context.doesFileExist('docs/troubleshooting.md')).toBe(true);
    });

    it.each<string | number | null>(['./docs', 'docs/', 'docs/v1.0', null, 5])(
      'refuses an existing docsPath of %s instead of suggesting a --docsPath the schema rejects',
      (existingDocsPath) => {
        const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'P', docsPath: existingDocsPath });
        expect(() => docs(context, { docsPath: 'catalog-docs' })).toThrow(
          `src/plugin.json has docsPath set to '${existingDocsPath}', which create-plugin add docs can't use.`
        );
      }
    );

    it('scaffolds into "catalog-docs" when neither --docsPath nor plugin.json sets one', () => {
      const context = makeContext();
      docs(context, {});
      expect(JSON.parse(context.getFile('src/plugin.json') ?? '{}').docsPath).toBe('catalog-docs');
      expect(context.doesFileExist('catalog-docs/index.md')).toBe(true);
    });

    it('reuses the docsPath in plugin.json when --docsPath is omitted', () => {
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'P', docsPath: 'docs' });
      docs(context, {});
      expect(context.doesFileExist('docs/AGENTS.md')).toBe(true);
      expect(context.doesFileExist('catalog-docs/AGENTS.md')).toBe(false);
    });

    it('counts pages that live only in subfolders, so it does not scaffold stubs next to them', () => {
      const root = mkdtempSync(join(tmpdir(), 'docs-rerun-nested-'));
      mkdirSync(join(root, 'docs', 'options'), { recursive: true });
      writeFileSync(join(root, 'docs', 'options', 'index.md'), '# Options\n');
      const context = new Context(root);
      context.addFile(
        'src/plugin.json',
        JSON.stringify({ type: 'panel', id: 'acme-p-panel', name: 'P', docsPath: 'docs' })
      );
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));

      docs(context, {});

      expect(context.doesFileExist('docs/index.md')).toBe(false);
    });

    it.each(['CHANGELOG.md', 'readme.md', 'nested/LICENSE.md', 'node_modules/pkg/index.md', 'dist/index.md'])(
      'does not count %s as a page, the same way plugin-docs-cli does not',
      (file) => {
        const root = mkdtempSync(join(tmpdir(), 'docs-rerun-meta-'));
        mkdirSync(join(root, 'docs', file, '..'), { recursive: true });
        writeFileSync(join(root, 'docs', file), '# Meta\n');
        const context = new Context(root);
        context.addFile(
          'src/plugin.json',
          JSON.stringify({ type: 'panel', id: 'acme-p-panel', name: 'P', docsPath: 'docs' })
        );
        context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));

        docs(context, {});

        expect(context.doesFileExist('docs/index.md')).toBe(true);
      }
    );

    it('refuses a docs folder that plugin.json knows nothing about', () => {
      const root = mkdtempSync(join(tmpdir(), 'docs-unknown-'));
      mkdirSync(join(root, 'docs'), { recursive: true });
      const context = new Context(root);
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel', id: 'acme-test-panel', name: 'P' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => docs(context, { docsPath: 'docs' })).toThrow(/has no docsPath/);
    });
  });

  describe('plugin.json requirements', () => {
    it('refuses a plugin.json with no id, since the catalog links need it', () => {
      const context = makeContext({ type: 'panel', name: 'P' });
      expect(() => docs(context, {})).toThrow(/has no "id"/);
    });

    it('refuses an empty id', () => {
      const context = makeContext({ type: 'panel', id: '', name: 'P' });
      expect(() => docs(context, {})).toThrow(/has no "id"/);
    });

    it('refuses a plugin.json with no name rather than scaffolding docs about "my-plugin"', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'panel' }));
      context.addFile('package.json', JSON.stringify({ scripts: {}, devDependencies: {} }));
      expect(() => docs(context, { docsPath: 'docs' })).toThrow(/has no "name"/);
    });

    it('writes a plugin name with special characters as-is, not HTML-escaped', () => {
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: "Erik's A & B" });
      docs(context, { docsPath: 'docs' });
      const index = context.getFile('docs/index.md') ?? '';
      expect(index).toContain(`description: "Where to start and what to read next in the Erik's A & B docs."`);
      expect(index).not.toMatch(/&amp;|&#x27;/);
    });

    it.each(PLUGIN_TYPES)(
      'keeps every %s page frontmatter valid YAML when the plugin name contains YAML syntax',
      (type) => {
        const name = 'Clock: "Analog" #2 \\ *';
        const context = makeContext({ ...FULL_PLUGIN_JSON[type], name });
        docs(context, { docsPath: 'docs' });
        for (const page of PAGES_BY_TYPE[type]) {
          const frontmatter = /^---\n([\s\S]*?)\n---/.exec(context.getFile(`docs/${page}.md`) ?? '')?.[1] ?? '';
          const { description, keywords } = parseYaml(frontmatter);
          expect(description, page).toContain(name);
          if (type === 'datasource') {
            expect(keywords, page).toContain(name);
          }
        }
      }
    );

    it('gives the landing page a title that stays short whatever the plugin is called', () => {
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'A'.repeat(80) });
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
    it('refuses a plugin with no type set', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ name: 'X' }));
      expect(() => docs(context, { docsPath: 'docs' })).toThrow(/needs a plugin type of panel/);
    });
  });

  describe('docsPath validation', () => {
    it('leaves docsPath unset when omitted, so the codemod can tell it from an explicit value', () => {
      expect(v.parse(schema, {})).toEqual({});
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
      expect(parsed).toEqual({});
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
      expect(context.getFile('docs/troubleshooting.md') ?? '').toContain('## Get more detail about an error');
    });

    it('scaffolds section briefs as HTML comments that start with section-brief', () => {
      const context = makeContext();
      docs(context, { docsPath: 'docs' });
      expect(context.getFile('docs/index.md') ?? '').toContain('<!-- section-brief\nFill this in:');
      expect(context.getFile('docs/options.md') ?? '').toContain('<!-- section-brief\nFill this in:');
    });

    it.each(PLUGIN_TYPES)('closes every %s brief and never nests a comment inside one', (type) => {
      const context = makeContext(FULL_PLUGIN_JSON[type]);
      docs(context, { docsPath: 'docs' });
      for (const page of PAGES_BY_TYPE[type]) {
        const content = context.getFile(`docs/${page}.md`) ?? '';
        const briefs = content.match(/<!-- section-brief\n[\s\S]*?-->/g) ?? [];
        expect(briefs.length, page).toBeGreaterThan(0);
        expect(content.match(/<!--/g)?.length, page).toBe(briefs.length);
        expect(content, page).not.toContain('section-brief:');
      }
    });

    // text the scaffold keeps on purpose, which agents leave in place
    const FIXED_TEXT: Record<string, Record<string, string[]>> = {
      panel: {
        index: [
          "- [Shape your query results for My Plugin](./data-formats.md)\n- [Configure panel and field options](./options.md)\n- [See worked dashboard.json examples](./examples.md)\n- [Fix a panel that isn't rendering correctly](./troubleshooting.md)",
        ],
        options: [
          'To change these options, edit the panel and use the options pane.',
          'For what each standard option does, refer to [Configure standard options](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-standard-options/).',
        ],
        'data-formats': [
          'This document explains the data the My Plugin panel needs from a query, so you can build a matching query or check your test data.',
          'To see the data the panel receives, open the panel editor, click **Query inspector** and select the **Data** tab. You can also turn on **Table view** at the top of the panel editor to see the data as a table.',
          'If a query returns data in a different shape, you can reshape it without changing the query. Select the **Transform data** tab in the panel editor and add a transformation. For more information, refer to [Transform data](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/).',
        ],
        examples: [
          'To use an example, open your dashboard and go to **Dashboard settings** > **JSON Model**. Paste the excerpt into the `panels` array and click **Save changes**.',
          'A panel excerpt in dashboard JSON has this shape:',
          '```json\n{\n  "type": "acme-test-panel",\n  "options": {},\n  "targets": []\n}\n```',
        ],
        troubleshooting: [
          'This page explains how to fix common issues when you use the My Plugin panel. For the data the panel expects, refer to [Data formats](./data-formats.md).',
          'To see the data the panel receives, open the panel editor, click **Query inspector** and select the **Data** tab.',
          'For errors in the panel itself, open the developer tools in your browser and check the console.',
          "If this page doesn't solve your problem:",
          '- Search the [Grafana community forums](https://community.grafana.com/).\n- If your Grafana Cloud or Grafana Enterprise plan includes support, contact Grafana Support.',
          'When you report an issue, include:',
          '- The Grafana and plugin versions.\n- The error message, with sensitive information removed.\n- The steps to reproduce the issue.\n- The panel options and a sample of the data it shows, with sensitive information removed.',
        ],
      },
      datasource: {
        configure: [
          'This document explains how to add and configure the My Plugin data source in Grafana. After you configure the data source, refer to the [My Plugin query editor](./query-editor.md) to start querying your data.',
          'Before you configure the data source, ensure you have:',
          '- **Grafana permissions:** The `Organization administrator` role. Only organization administrators can add data sources.',
          'To add the My Plugin data source:',
          '1. Click **Connections** in the left-side menu.\n1. Click **Add new connection**.\n1. Enter `My Plugin` in the search bar.\n1. Select **My Plugin**.\n1. Click **Add new data source**.',
          'Click **Save & test** to verify the connection.',
          'You can provision the My Plugin data source as code, with a Grafana provisioning file or with the Grafana Terraform provider.',
          'You can define the data source in a YAML file as part of the Grafana provisioning system. For more information, refer to [Provision Grafana](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources).',
          'You can provision the data source with the [Grafana Terraform provider](https://registry.terraform.io/providers/grafana/grafana/latest/docs/resources/data_source) using the `grafana_data_source` resource.',
        ],
        'template-variables': [
          'Use template variables to create dynamic, reusable dashboards that let you change query parameters without editing individual panels. For general information about template variables, refer to [Templates and variables](https://grafana.com/docs/grafana/latest/dashboards/variables/).',
          '- [Configure the My Plugin data source](./configure.md).\n- Understand [Grafana template variables](https://grafana.com/docs/grafana/latest/dashboards/variables/).\n- Know how to write queries in the [My Plugin query editor](./query-editor.md).',
          'The My Plugin data source supports the following variable types:',
          'A query variable fills its drop-down by running a query against My Plugin, so its options stay current with your data. Use one to let viewers pick a value, such as a host, a table or a project, and update every panel that uses it.',
          'To create a query variable:',
          '1. Navigate to **Dashboard settings** > **Variables**.\n1. Click **Add variable**.\n1. Select **Query** as the variable type.\n1. Select the **My Plugin** data source.',
        ],
        alerting: [
          'You can create alert rules that run My Plugin queries on a schedule and fire when the result meets a condition, such as a value above a threshold. For general information about alerting, refer to [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/).',
          '- [Configure the My Plugin data source](./configure.md).',
          'To create an alert rule from a My Plugin query:',
          '1. Navigate to **Alerting** > **Alert rules**.\n1. Click **New alert rule**.\n1. Enter a **Name** for the rule.\n1. Select the **My Plugin** data source.',
        ],
        annotations: [
          'Annotations overlay event markers on time series panels, so you can correlate events from My Plugin, such as deployments or incidents, with the metrics on your dashboards. For general information about annotations, refer to [Annotate visualizations](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/annotate-visualizations/).',
          '- [Configure the My Plugin data source](./configure.md).',
          'To add an annotation query to a dashboard:',
          '1. Navigate to **Dashboard settings** > **Annotations**.\n1. Click **Add annotation query**.\n1. Enter a **Name** for the annotation.\n1. Select the **My Plugin** data source.',
        ],
        dashboards: [
          'My Plugin ships with ready-made dashboards that you can import and use as they are, or as a starting point for your own. For general information about dashboards, refer to [Dashboards](https://grafana.com/docs/grafana/latest/dashboards/).',
          'To import a dashboard that ships with My Plugin:',
          '1. Click **Connections** > **Data sources** in the left-side menu.\n1. Select your My Plugin data source.\n1. Click the **Dashboards** tab.\n1. Click **Import** next to the dashboard.',
          "Imported dashboards don't update when you upgrade the plugin. When a plugin upgrade ships a newer version of a dashboard, click **Update** next to it. This overwrites any changes you made to it.",
        ],
        'query-editor': [
          'This document explains how to use the My Plugin query editor to build queries and visualize My Plugin data in Grafana dashboards.',
          '- [Configure the My Plugin data source](./configure.md).',
        ],
        troubleshooting: [
          'This page explains how to fix common issues when you configure or use the My Plugin data source. For setup instructions, refer to [Configure the My Plugin data source](./configure.md).',
          'To see the raw request and response for a panel, open the panel editor and click **Query inspector**.',
          'In self-managed Grafana, you can also find more detail in the Grafana server logs:',
          "1. Set the log level to `debug` in the Grafana configuration file:\n\n   ```ini\n   [log]\n   level = debug\n   ```\n\n1. Restart Grafana and reproduce the error.\n1. Look for log lines with `logger=plugin.acme-test-datasource`.\n1. Set the log level back to `info` when you're done, to keep the logs small.",
          "If this page doesn't solve your problem:",
          '- Search the [Grafana community forums](https://community.grafana.com/).\n- If your Grafana Cloud or Grafana Enterprise plan includes support, contact Grafana Support.',
          'When you report an issue, include:',
          '- The Grafana and plugin versions.\n- The error message, with sensitive information removed.\n- The steps to reproduce the issue.\n- The relevant data source settings, with credentials removed.',
        ],
      },
      app: {
        index: [
          'Before you set up the app, ensure you have:',
          '- **Grafana permissions:** The `Organization administrator` role. Only organization administrators can enable and configure apps.',
          'To enable My Plugin:',
          '1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.\n1. Enter `My Plugin` in the search bar.\n1. Select **My Plugin**.\n1. Click **Enable**.',
          'After you enable the app, refer to [Configure](./configure.md) for its settings.',
        ],
        configure: [
          'This document explains how to configure My Plugin after you enable it.',
          'Before you configure the app, ensure you have:',
          '- **Grafana permissions:** The `Organization administrator` role. Only organization administrators can configure apps.\n- **The app enabled:** Follow [Enable the app](./index.md#enable-the-app).',
          'To open the My Plugin configuration page:',
          '1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.\n1. Enter `My Plugin` in the search bar.\n1. Select **My Plugin**.',
          'You can provision My Plugin as code with a Grafana provisioning file. For more information, refer to [Provision Grafana](https://grafana.com/docs/grafana/latest/administration/provisioning/#plugins).',
        ],
        overview: ['- **Grafana permissions:** At least the `Editor` role.'],
        dashboards: [
          'My Plugin ships with ready-made dashboards that you can import and use as they are, or as a starting point for your own. For general information about dashboards, refer to [Dashboards](https://grafana.com/docs/grafana/latest/dashboards/).',
          'To import a dashboard that ships with My Plugin:',
          '1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.\n1. Enter `My Plugin` in the search bar.\n1. Select **My Plugin**.\n1. Click the **Dashboards** tab.\n1. Click **Import** next to the dashboard.',
          "Imported dashboards don't update when you upgrade the plugin. When a plugin upgrade ships a newer version of a dashboard, click **Update** next to it. This overwrites any changes you made to it.",
        ],
        permissions: [
          'This document explains who can use each part of My Plugin and what the app can access. For general information, refer to [Role-based access control for app plugins](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/rbac-for-app-plugins/).',
          'To assign a role to a user, team or service account, refer to [Assign RBAC roles](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/assign-rbac-roles/).',
        ],
        troubleshooting: [
          'This page explains how to fix common issues when you set up or use My Plugin. For setup instructions, refer to the [Introduction](./index.md).',
          'For errors in the app, open the developer tools in your browser and check the console.',
          'In self-managed Grafana, you can also find more detail in the Grafana server logs:',
          "1. Set the log level to `debug` in the Grafana configuration file:\n\n   ```ini\n   [log]\n   level = debug\n   ```\n\n1. Restart Grafana and reproduce the error.\n1. Look for log lines with `logger=plugin.acme-test-app`.\n1. Set the log level back to `info` when you're done, to keep the logs small.",
          "If this page doesn't solve your problem:",
          '- Search the [Grafana community forums](https://community.grafana.com/).\n- If your Grafana Cloud or Grafana Enterprise plan includes support, contact Grafana Support.',
          'When you report an issue, include:',
          '- The Grafana and plugin versions.\n- The error message, with sensitive information removed.\n- The steps to reproduce the issue.\n- The app page where it happens and the relevant app settings, with credentials removed.',
        ],
      },
    };

    it.each(PLUGIN_TYPES)(
      'scaffolds %s pages where every section is only a brief or fixed text, so an untouched scaffold is all stubs',
      (type) => {
        const context = makeContext(FULL_PLUGIN_JSON[type]);
        docs(context, { docsPath: 'docs' });
        for (const page of PAGES_BY_TYPE[type]) {
          let left = (context.getFile(`docs/${page}.md`) ?? '')
            .replace(/^---\n[\s\S]*?\n---\n/, '')
            .replace(/<!-- section-brief\n[\s\S]*?-->/g, '')
            .replace(/^#{1,6} .*$/gm, '');
          for (const text of FIXED_TEXT[type][page] ?? []) {
            expect(left, page).toContain(text);
            left = left.replace(text, '');
          }
          expect(left.trim(), page).toBe('');
        }
      }
    );

    it('interpolates pluginName into the index page', () => {
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'My Panel' });
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
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'My Panel' });
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

  describe('datasource pages', () => {
    const datasource = { type: 'datasource', id: 'acme-test-datasource', name: 'My Data Source' };
    const conditionalPages = ['annotations.md', 'alerting.md', 'dashboards.md'];

    it('scaffolds the pages every data source needs, and no feature pages when plugin.json declares none', () => {
      const context = makeContext(datasource);
      docs(context, { docsPath: 'docs' });
      const files = [
        ...PAGES_BY_TYPE.datasource.map((page) => `${page}.md`).filter((file) => !conditionalPages.includes(file)),
        'README.md',
        'AGENTS.md',
        'CLAUDE.md',
      ];
      for (const file of files) {
        expect(context.doesFileExist(`docs/${file}`), file).toBe(true);
      }
      for (const file of conditionalPages) {
        expect(context.doesFileExist(`docs/${file}`), file).toBe(false);
      }
    });

    it.each([
      ['annotations.md', { annotations: true }],
      ['alerting.md', { alerting: true }],
      ['dashboards.md', { includes: [{ type: 'dashboard', name: 'Overview', path: 'dashboards/overview.json' }] }],
    ])('scaffolds %s when plugin.json declares the feature', (page, feature) => {
      const context = makeContext({ ...datasource, ...feature });
      docs(context, { docsPath: 'docs' });
      for (const file of conditionalPages) {
        expect(context.doesFileExist(`docs/${file}`), file).toBe(file === page);
      }
    });

    it.each([{ annotations: false }, { alerting: 'true' }, { includes: [{ type: 'page' }, { type: 'datasource' }] }])(
      'scaffolds no feature page for %j',
      (feature) => {
        const context = makeContext({ ...datasource, ...feature });
        docs(context, { docsPath: 'docs' });
        for (const file of conditionalPages) {
          expect(context.doesFileExist(`docs/${file}`), file).toBe(false);
        }
      }
    );

    it.each([
      ['no feature', datasource],
      ['every feature', FULL_PLUGIN_JSON.datasource],
    ])('links only scaffolded pages from index.md with %s pages', (_, pluginJson) => {
      const context = makeContext(pluginJson);
      docs(context, { docsPath: 'docs' });
      const links = [...(context.getFile('docs/index.md') ?? '').matchAll(/\]\(\.\/([\w-]+\.md)\)/g)].map(
        ([, file]) => file
      );
      expect(links).toContain('configure.md');
      for (const file of links) {
        expect(context.doesFileExist(`docs/${file}`), file).toBe(true);
      }
    });

    it.each([
      ['query-editor', '## Macros'],
      ['configure', '## Private data source connect'],
      ['troubleshooting', '## Private data source connect errors'],
      ['troubleshooting', 'level = debug'],
    ])('renders %s.md "%s" only for a backend data source', (page, heading) => {
      for (const backend of [true, false]) {
        const context = makeContext({ ...datasource, backend });
        docs(context, { docsPath: 'docs' });
        const content = context.getFile(`docs/${page}.md`) ?? '';
        expect(content.includes(heading), `backend: ${backend}`).toBe(backend);
        expect(content).not.toContain('{{');
        expect(content).not.toMatch(/\n\n\n/);
      }
    });

    it.each([
      ['annotations', '## Annotation errors'],
      ['alerting', '## Alerting errors'],
    ])('renders troubleshooting.md "%s" only when plugin.json sets %s', (flag, heading) => {
      for (const enabled of [true, false]) {
        const context = makeContext({ ...datasource, [flag]: enabled });
        docs(context, { docsPath: 'docs' });
        const content = context.getFile('docs/troubleshooting.md') ?? '';
        expect(content.includes(heading), `${flag}: ${enabled}`).toBe(enabled);
        expect(content).not.toContain('{{');
        expect(content).not.toMatch(/\n\n\n/);
      }
    });

    it('keeps the template conditionals out of index.md', () => {
      const context = makeContext(FULL_PLUGIN_JSON.datasource);
      docs(context, { docsPath: 'docs' });
      const index = context.getFile('docs/index.md') ?? '';
      expect(index).not.toContain('{{');
      expect(index).not.toMatch(/\n\n\n/);
    });

    it('scaffolds configure.md, the page plugin-docs-cli requires for data sources', () => {
      const context = makeContext(datasource);
      docs(context, { docsPath: 'docs' });
      expect(context.doesFileExist('docs/configuration.md')).toBe(false);
      expect(context.getFile('docs/configure.md') ?? '').toContain('## Provision the data source');
    });

    it('gives every page a unique sidebar_position', () => {
      const context = makeContext(FULL_PLUGIN_JSON.datasource);
      docs(context, { docsPath: 'docs' });
      const positions = PAGES_BY_TYPE.datasource.map(
        (page) => /\nsidebar_position: (\d+)\n/.exec(context.getFile(`docs/${page}.md`) ?? '')?.[1]
      );
      expect(positions.every(Boolean)).toBe(true);
      expect(new Set(positions).size).toBe(positions.length);
    });

    it('lists every data source page in the docs AGENTS.md', () => {
      const context = makeContext(datasource);
      docs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/AGENTS.md') ?? '';
      for (const page of PAGES_BY_TYPE.datasource) {
        expect(content).toContain(`| \`${page}.md\``);
      }
      expect(content).not.toContain('setPanelOptions');
    });

    it('warns about a feature page on a re-run that changes nothing else, without adding it', () => {
      const { context, body } = scaffoldThenRerun(datasource, { annotations: true });
      expect(context.hasChanges()).toBe(false);
      expect(context.doesFileExist('docs/annotations.md')).toBe(false);
      expect(body).toContain('docs/annotations.md documents');
      expect(body).toContain('Optional pages in docs/AGENTS.md');
      expect(body).not.toContain('alerting.md');
    });

    it.each(['annotations.md', 'annotations/index.md'])(
      'says nothing about a feature page at %s on a re-run',
      (file) => {
        const { context, body } = scaffoldThenRerun(datasource, { annotations: true }, file);
        expect(context.getMessage()).toBeUndefined();
        expect(body).not.toContain('annotations.md');
      }
    );

    it('never warns about data source feature pages for a panel', () => {
      const panel = { type: 'panel', id: 'acme-test-panel', name: 'My Plugin' };
      const { context } = scaffoldThenRerun(panel, {
        annotations: true,
        alerting: true,
        includes: [{ type: 'dashboard', name: 'Overview', path: 'dashboards/overview.json' }],
      });
      expect(context.getMessage()).toBeUndefined();
    });
  });

  describe('app pages', () => {
    const app = { type: 'app', id: 'acme-test-app', name: 'My App' };
    const gatedPages = ['configure.md', 'dashboards.md', 'permissions.md', 'traces.md'];
    const page = (name: string, path?: string, extra: Record<string, unknown> = {}) => ({
      type: 'page',
      name,
      path,
      ...extra,
    });

    function scaffold(pluginJson: Record<string, unknown>, files: Record<string, string> = {}) {
      const context = makeContext(pluginJson);
      for (const [file, content] of Object.entries(files)) {
        context.addFile(file, content);
      }
      docs(context, { docsPath: 'docs' });
      return context;
    }

    function docsFiles(context: Context): string[] {
      return Object.keys(context.listChanges())
        .filter((file) => file.startsWith('docs/') && file.endsWith('.md'))
        .map((file) => file.slice('docs/'.length))
        .sort();
    }

    it('scaffolds the pages every app needs, and no gated pages when the app declares nothing', () => {
      const context = scaffold(app);
      expect(docsFiles(context)).toEqual(['AGENTS.md', 'CLAUDE.md', 'README.md', 'index.md', 'troubleshooting.md']);
    });

    it.each([
      [
        'configure.md',
        { 'src/module.tsx': 'export const plugin = new AppPlugin().addConfigPage({ title: "Config" });' },
        {},
      ],
      ['configure.md', { 'src/module.ts': 'new AppPlugin()\n  .addConfigPage({ title: "Config" })' }, {}],
      ['configure.md', {}, { includes: [page('Configuration', '/plugins/%PLUGIN_ID%')] }],
      ['configure.md', {}, { includes: [page('Configuration', '/plugins/acme-test-app')] }],
      ['dashboards.md', {}, { includes: [{ type: 'dashboard', name: 'Overview', path: 'dashboards/overview.json' }] }],
      ['permissions.md', {}, { roles: [{ role: { name: 'plugins:acme-test-app:reader' }, grants: ['Viewer'] }] }],
      ['permissions.md', {}, { iam: { permissions: [{ action: 'datasources:read', scope: 'datasources:*' }] } }],
      ['traces.md', {}, { includes: [page('Traces', '/a/acme-test-app/traces')] }],
    ])('scaffolds %s when the app declares it (%j %j)', (expected, files, feature) => {
      const context = scaffold({ ...app, ...feature }, files);
      for (const file of gatedPages) {
        expect(context.doesFileExist(`docs/${file}`), file).toBe(file === expected);
      }
    });

    it('gives a page only to app pages, not to the config page, dashboard links or example pages', () => {
      const context = scaffold({
        ...app,
        includes: [
          page('Traces', '/a/acme-test-app/traces'),
          page('Home', '/a/%PLUGIN_ID%/'),
          page('Configuration', '/plugins/%PLUGIN_ID%'),
          page('Redis CLI', '/d/_SGxCBNGk'),
          page('Page One', '/a/%PLUGIN_ID%/one'),
          page('Elsewhere', '/a/other-app/elsewhere'),
          page('No path'),
        ],
      });
      expect(docsFiles(context)).toEqual([
        'AGENTS.md',
        'CLAUDE.md',
        'README.md',
        'configure.md',
        'home.md',
        'index.md',
        'traces.md',
        'troubleshooting.md',
      ]);
      const body = stripVTControlCharacters((context.getMessage()?.body ?? []).join('\n'));
      expect(body).toContain('Page One (/a/%PLUGIN_ID%/one, an example page from the create-plugin app template)');
    });

    it('puts up to three app pages at the root, in the order of the nav, with no features folder', () => {
      const context = scaffold({
        ...app,
        includes: [
          page('Time Travel', '/a/%PLUGIN_ID%/timetravel'),
          page('Overview', '/a/%PLUGIN_ID%/overview', { defaultNav: true }),
          page('Queries', '/a/%PLUGIN_ID%/queries'),
        ],
      });
      const position = (file: string) => /\nsidebar_position: (\d+)\n/.exec(context.getFile(`docs/${file}`) ?? '')?.[1];
      expect(docsFiles(context).some((file) => file.startsWith('features/'))).toBe(false);
      expect(position('overview.md')).toBe('3');
      expect(position('time-travel.md')).toBe('4');
      expect(position('queries.md')).toBe('5');
      expect(context.getFile('docs/time-travel.md')).toContain('title: "Time Travel"');
      expect(context.getFile('docs/time-travel.md')).toContain('`/a/acme-test-app/timetravel`');
      expect(context.getFile('docs/index.md')).toContain('](./overview.md)');
    });

    it('moves the app pages into a features folder from the fourth page', () => {
      const context = scaffold({
        ...app,
        includes: [
          page('Overview', '/a/%PLUGIN_ID%/overview', { defaultNav: true }),
          page('Time Travel', '/a/%PLUGIN_ID%/timetravel'),
          page('Queries', '/a/%PLUGIN_ID%/queries'),
          page('Merges', '/a/%PLUGIN_ID%/merges'),
        ],
      });
      const position = (file: string) => /\nsidebar_position: (\d+)\n/.exec(context.getFile(`docs/${file}`) ?? '')?.[1];
      expect(docsFiles(context).filter((file) => file.startsWith('features/'))).toEqual([
        'features/index.md',
        'features/merges.md',
        'features/overview.md',
        'features/queries.md',
        'features/time-travel.md',
      ]);
      expect(docsFiles(context)).not.toContain('overview.md');
      expect(position('features/index.md')).toBe('3');
      expect(position('features/overview.md')).toBe('4');
      expect(position('features/merges.md')).toBe('7');
      expect(context.getFile('docs/index.md')).toContain('](./features/overview.md)');
    });

    it('leaves out an app page that would take the file name of another page', () => {
      const context = scaffold({ ...app, includes: [page('Permissions', '/a/%PLUGIN_ID%/permissions')] });
      expect(context.doesFileExist('docs/permissions.md')).toBe(false);
      expect(context.getFile('docs/index.md')).not.toContain('](./permissions.md)');
      const body = stripVTControlCharacters((context.getMessage()?.body ?? []).join('\n'));
      expect(body).toContain('Permissions (/a/%PLUGIN_ID%/permissions, its file name is used by another page)');
    });

    it.each(['Configuration', 'Configure'])('uses an app page named %s as the root configure page', (name) => {
      const includes = ['One', 'Two', 'Three', 'Four'].map((n) => page(n, `/a/%PLUGIN_ID%/${n.toLowerCase()}`));
      const context = scaffold({
        ...app,
        includes: [page(name, '/a/%PLUGIN_ID%/configuration', { role: 'Editor' }), ...includes],
      });
      const content = context.getFile('docs/configure.md') ?? '';
      expect(content).toContain(`title: "${name}"`);
      expect(content).toContain('/a/acme-test-app/configuration');
      expect(content).toContain('At least the `Editor` role.');
      expect(content).toMatch(/\nsidebar_position: 2\n/);
      expect(content).not.toContain('Administration');
      expect(docsFiles(context)).not.toContain(`features/${name.toLowerCase()}.md`);
      expect(docsFiles(context)).toContain('features/one.md');
      expect(context.getFile('docs/index.md')).toContain('](./configure.md)');
    });

    it('keeps an app page named Configuration among the app pages when the app has a config page', () => {
      const context = scaffold(
        { ...app, includes: [page('Configuration', '/a/%PLUGIN_ID%/configuration')] },
        { 'src/module.tsx': 'new AppPlugin().addConfigPage({ title: "Config" });' }
      );
      expect(context.getFile('docs/configure.md')).toContain('Open the configuration page');
      expect(context.doesFileExist('docs/configuration.md')).toBe(true);
    });

    it('says nothing on a re-run when the configure page exists', () => {
      const pluginJson = { ...app, includes: [page('Configuration', '/a/%PLUGIN_ID%/configuration')] };
      const { context } = scaffoldThenRerun(pluginJson, {});
      expect(context.getMessage()).toBeUndefined();
    });

    it('adds a before you begin section to an app page only for a role above Viewer', () => {
      const context = scaffold({
        ...app,
        includes: [
          page('Admin Tools', '/a/%PLUGIN_ID%/admin', { role: 'Admin' }),
          page('Open', '/a/%PLUGIN_ID%/open'),
          page('Reader', '/a/%PLUGIN_ID%/reader', { role: 'Viewer' }),
        ],
      });
      expect(context.getFile('docs/reader.md')).not.toContain('## Before you begin');
      expect(context.getFile('docs/admin-tools.md')).toContain('At least the `Admin` role.');
      expect(context.getFile('docs/open.md')).not.toContain('## Before you begin');
      expect(context.getFile('docs/admin-tools.md')).toContain('remove it, including its heading');
    });

    it.each([
      ['no feature', app],
      ['every feature', FULL_PLUGIN_JSON.app],
    ])('links only scaffolded pages and leaves no template syntax with %s', (_, pluginJson) => {
      const context = scaffold(pluginJson);
      for (const file of docsFiles(context)) {
        const content = context.getFile(`docs/${file}`) ?? '';
        expect(content, file).not.toContain('{{');
        expect(content, file).not.toMatch(/\n\n\n/);
        if (file === 'AGENTS.md') {
          continue;
        }
        for (const [, link] of content.matchAll(/\]\(\.\/([\w/-]+\.md)\)/g)) {
          expect(context.doesFileExist(`docs/${link}`), `${file} -> ${link}`).toBe(true);
        }
      }
    });

    it('gives every root page a unique sidebar_position', () => {
      const context = scaffold(FULL_PLUGIN_JSON.app);
      const positions = PAGES_BY_TYPE.app.map(
        (file) => /\nsidebar_position: (\d+)\n/.exec(context.getFile(`docs/${file}.md`) ?? '')?.[1]
      );
      expect(positions.every(Boolean)).toBe(true);
      expect(new Set(positions).size).toBe(positions.length);
    });

    it('lists every app page in the docs AGENTS.md', () => {
      const content = scaffold(app).getFile('docs/AGENTS.md') ?? '';
      for (const file of ['index', 'configure', 'features/index', 'dashboards', 'permissions']) {
        expect(content).toContain(`| \`${file}.md\``);
      }
      expect(content).toContain('| App pages');
      expect(content).not.toContain('setConfigEditor');
    });

    it('warns about a new app page on a re-run, without adding it', () => {
      const { context, body } = scaffoldThenRerun(
        { ...app, includes: [page('Traces', '/a/%PLUGIN_ID%/traces')] },
        { includes: [page('Traces', '/a/%PLUGIN_ID%/traces'), page('Logs', '/a/%PLUGIN_ID%/logs')] }
      );
      expect(context.hasChanges()).toBe(false);
      expect(context.doesFileExist('docs/logs.md')).toBe(false);
      expect(body).toContain('such as docs/logs.md');
      expect(body).toContain('Optional pages in docs/AGENTS.md');
    });

    it('finds the app pages of a root layout after a fourth page moves the layout to features/', () => {
      const three = ['One', 'Two', 'Three'].map((name) => page(name, `/a/%PLUGIN_ID%/${name.toLowerCase()}`));
      const { context, body } = scaffoldThenRerun(
        { ...app, includes: three },
        { includes: [...three, page('Four', '/a/%PLUGIN_ID%/four')] }
      );
      expect(context.hasChanges()).toBe(false);
      expect(body).toContain('such as docs/features/four.md');
      expect(body).not.toContain('one.md');
    });

    it('finds an app page that the author turned into a folder', () => {
      const pluginJson = { ...app, includes: [page('Traces', '/a/%PLUGIN_ID%/traces')] };
      const { context } = scaffoldThenRerun(pluginJson, {}, 'traces/index.md');
      expect(context.getMessage()).toBeUndefined();
    });

    it.each([
      [
        'pages with the same file name',
        [page('Foo Bar', '/a/%PLUGIN_ID%/a'), page('foo-bar', '/a/%PLUGIN_ID%/b')],
        'foo-bar (/a/%PLUGIN_ID%/b, its file name',
      ],
      [
        'a name that is a docs-cli meta file',
        [page('README', '/a/%PLUGIN_ID%/readme')],
        'README (/a/%PLUGIN_ID%/readme, its file name',
      ],
      [
        'a name that is the features index',
        [page('Index', '/a/%PLUGIN_ID%/index')],
        'Index (/a/%PLUGIN_ID%/index, its file name',
      ],
    ])('leaves out %s and says so', (_, includes, expected) => {
      const context = scaffold({ ...app, includes });
      const body = stripVTControlCharacters((context.getMessage()?.body ?? []).join('\n'));
      expect(body).toContain(expected);
      expect(docsFiles(context)).not.toContain('readme.md');
    });

    it('ignores a page whose name is not a string', () => {
      const context = scaffold({ ...app, includes: [{ type: 'page', name: 123, path: '/a/%PLUGIN_ID%/x' }] });
      expect(docsFiles(context)).toEqual(['AGENTS.md', 'CLAUDE.md', 'README.md', 'index.md', 'troubleshooting.md']);
    });

    it.each([
      ['a trailing comment', 'new AppPlugin().setRootPage(App); // .addConfigPage({})'],
      ['a string', "const help = 'call .addConfigPage( to add one';"],
    ])('does not count addConfigPage in %s as a config page', (_, source) => {
      const context = scaffold(app, { 'src/module.tsx': source });
      expect(context.doesFileExist('docs/configure.md')).toBe(false);
    });

    it.each([
      [
        'a glob string before it',
        "const files = '**/*.svg';\nnew AppPlugin().addConfigPage({ title: 'Config' });",
        'src/module.ts',
      ],
      [
        'JSX',
        "export const plugin = new AppPlugin().addConfigPage({ title: 'Config', body: () => <div /> });",
        'src/module.tsx',
      ],
      [
        'a JavaScript module',
        "export const plugin = new AppPlugin().addConfigPage({ title: 'Config' });",
        'src/module.js',
      ],
    ])('finds addConfigPage after %s', (_, source, file) => {
      const context = scaffold(app, { [file]: source });
      expect(context.doesFileExist('docs/configure.md')).toBe(true);
    });

    it('gives an app page with accented letters a readable file name', () => {
      const context = scaffold({ ...app, includes: [page('Übersicht', '/a/%PLUGIN_ID%/overview')] });
      expect(docsFiles(context)).toContain('ubersicht.md');
    });

    it('leaves out an app page whose name has no letters or digits for a file name, and says so', () => {
      const context = scaffold({ ...app, includes: [page('概览', '/a/%PLUGIN_ID%/overview')] });
      const body = stripVTControlCharacters((context.getMessage()?.body ?? []).join('\n'));
      expect(body).toContain('概览 (/a/%PLUGIN_ID%/overview, its name has no letters or digits for a file name)');
    });

    it.each([
      ['a role above Viewer', { role: 'Admin' }, true],
      ['an action', { action: 'plugins.app:access' }, true],
      ['the Viewer role', { role: 'Viewer' }, false],
    ])('scaffolds permissions.md for a page with %s', (_, extra, expected) => {
      const context = scaffold({ ...app, includes: [page('Traces', '/a/%PLUGIN_ID%/traces', extra)] });
      expect(context.doesFileExist('docs/permissions.md')).toBe(expected);
    });

    it('does not count a commented-out addConfigPage as a config page', () => {
      const context = scaffold(app, { 'src/module.ts': '// plugin.addConfigPage({})\n/* .addConfigPage(x) */\n' });
      expect(context.doesFileExist('docs/configure.md')).toBe(false);
    });

    it('keeps every root position unique with three app pages and every gated page', () => {
      const includes = [
        ...(FULL_PLUGIN_JSON.app.includes as Array<Record<string, unknown>>),
        page('Two', '/a/%PLUGIN_ID%/two'),
        page('Three', '/a/%PLUGIN_ID%/three'),
      ];
      const context = scaffold({ ...FULL_PLUGIN_JSON.app, includes });
      const positions = docsFiles(context)
        .filter((file) => !file.includes('/') && !['AGENTS.md', 'CLAUDE.md', 'README.md'].includes(file))
        .map((file) => /\nsidebar_position: (\d+)\n/.exec(context.getFile(`docs/${file}`) ?? '')?.[1]);
      expect(positions).toHaveLength(8);
      expect(positions.every(Boolean)).toBe(true);
      expect(new Set(positions).size).toBe(positions.length);
    });

    it.each([
      ['a flat layout', FULL_PLUGIN_JSON.app],
      [
        'a features folder',
        {
          ...FULL_PLUGIN_JSON.app,
          includes: ['One', 'Two', 'Three', 'Four'].map((name) => page(name, `/a/%PLUGIN_ID%/${name.toLowerCase()}`)),
        },
      ],
    ])('is idempotent with %s', async (_, pluginJson) => {
      const context = makeContext(pluginJson);
      await expect((ctx: Context) => docs(ctx, { docsPath: 'docs' })).toBeIdempotent(context);
    });

    it('says nothing on a re-run when every app page has a docs page', () => {
      const pluginJson = { ...app, includes: [page('Traces', '/a/%PLUGIN_ID%/traces')] };
      const { context } = scaffoldThenRerun(pluginJson, {});
      expect(context.getMessage()).toBeUndefined();
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
      expect(content).toContain('Docs guides:');
      expect(content).toContain('node_modules/@grafana/plugin-docs-cli/docs/index.md');
      expect(content).toContain('npm run docs:validate');
      expect(content).toContain('`unfilled-section-brief` suggestion');
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

    it.each(PLUGIN_TYPES)('tells agents never to write installation instructions for a %s', (type) => {
      const context = makeContext(FULL_PLUGIN_JSON[type]);
      docs(context, { docsPath: 'docs' });
      const content = context.getFile('docs/AGENTS.md') ?? '';
      expect(content).toContain('## What not to write');
      expect(content).toContain('Never write installation instructions');
      expect(content).toContain('Installation tab');
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
      const context = makeContext({ type: 'panel', id: 'acme-test-panel', name: 'My Plugin', docsPath: 'docs' });
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
      const [packageManagerName, packageManagerVersion] = packageManager.split('@');
      vi.mocked(getPackageManagerWithFallback).mockReturnValueOnce({ packageManagerName, packageManagerVersion });
      const context = makeContext();
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
        ' 2. Write the pages, yourself or with an AI agent',
        ' 3. Preview the pages',
      ]);
    });

    it('tells the author to commit before running docs-content, since add needs a clean tree', () => {
      const body = nextSteps(makeContext());
      const step = body.indexOf(' 2. Write the pages, yourself or with an AI agent');
      expect(body.slice(step + 1, step + 5)).toEqual([
        '    Fill in or review the pages under docs/ by hand.',
        '    Or commit these changes, then have an agent draft them from your source code and README:',
        '    npx -y @grafana/create-plugin@latest add docs-content',
        '    Review its work either way.',
      ]);
    });

    it('indents each detail line under its step', () => {
      const body = nextSteps(makeContext());
      const step = body.indexOf(' 3. Preview the pages');
      expect(body[step + 1]).toBe('    Run npm run docs:serve, which also lists every section left to fill.');
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
