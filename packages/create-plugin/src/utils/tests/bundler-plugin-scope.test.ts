import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { dirSync } from 'tmp';

import { TEMPLATE_PATHS } from '../../constants.js';

const tmpObj = dirSync({ unsafeCleanup: true });
const repo = fs.realpathSync(fs.mkdtempSync(path.join(tmpObj.name, 'repo-')));

function writeFile(relativePath: string, content = '') {
  const filePath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

writeFile('plugins/a/src/plugin.json', '{}');
writeFile('plugins/a/src/module.ts');
writeFile('plugins/b/src/plugin.json', '{}');
writeFile('plugins/b/src/thing.ts');
writeFile('packages/shared/index.ts');
writeFile('node_modules/react/index.js');

const pluginA = path.join(repo, 'plugins/a');
const issuer = path.join(pluginA, 'src/module.ts');

// Import a copy so the transform doesn't pick up the template's own tsconfig.json.
async function importPluginScope() {
  const bundlerDir = fs.mkdtempSync(path.join(tmpObj.name, 'bundler-'));
  fs.copyFileSync(
    path.join(TEMPLATE_PATHS.common, '.config', 'bundler', 'pluginScope.ts'),
    path.join(bundlerDir, 'pluginScope.ts')
  );
  return import(pathToFileURL(path.join(bundlerDir, 'pluginScope.ts')).href);
}

describe('templates / .config/bundler/pluginScope.ts', () => {
  afterAll(() => {
    tmpObj.removeCallback();
  });

  describe('getScopeViolation', () => {
    it.each([
      ['a file inside the plugin', './components/x', path.join(pluginA, 'src/components/x.ts')],
      ['a dependency', 'react', path.join(repo, 'node_modules/react/index.js')],
      ['a workspace package imported by name', '@myorg/shared', path.join(repo, 'packages/shared/index.ts')],
    ])('allows %s', async (_label, request, resource) => {
      const { getScopeViolation } = await importPluginScope();

      expect(getScopeViolation({ request, issuer, resource, pluginRoot: pluginA })).toBeUndefined();
    });

    it('reports a relative import of another plugin', async () => {
      const { getScopeViolation } = await importPluginScope();
      const resource = path.join(repo, 'plugins/b/src/thing.ts');

      expect(getScopeViolation({ request: '../../b/src/thing', issuer, resource, pluginRoot: pluginA })).toBe(
        'crossPlugin'
      );
    });

    it('reports importing another plugin through its package name', async () => {
      const { getScopeViolation } = await importPluginScope();
      const resource = path.join(repo, 'plugins/b/src/thing.ts');

      expect(getScopeViolation({ request: 'myorg-b-panel/src/thing', issuer, resource, pluginRoot: pluginA })).toBe(
        'crossPlugin'
      );
    });

    it('reports a relative import that leaves the plugin', async () => {
      const { getScopeViolation } = await importPluginScope();
      const resource = path.join(repo, 'packages/shared/index.ts');

      expect(
        getScopeViolation({ request: '../../../packages/shared/index', issuer, resource, pluginRoot: pluginA })
      ).toBe('outsidePlugin');
    });

    it("ignores imports made by dependencies' own files", async () => {
      const { getScopeViolation } = await importPluginScope();

      expect(
        getScopeViolation({
          request: '../../plugins/b/src/thing',
          issuer: path.join(repo, 'node_modules/react/index.js'),
          resource: path.join(repo, 'plugins/b/src/thing.ts'),
          pluginRoot: pluginA,
        })
      ).toBeUndefined();
    });
  });

  describe('PluginScopePlugin', () => {
    it('fails the module resolution for a cross-plugin import', async () => {
      const { PluginScopePlugin } = await importPluginScope();
      let afterResolve: ((resolveData: unknown) => void) | undefined;
      const compiler = {
        hooks: {
          normalModuleFactory: {
            tap: (_name: string, callback: (factory: unknown) => void) =>
              callback({
                hooks: { afterResolve: { tap: (_n: string, cb: typeof afterResolve) => (afterResolve = cb) } },
              }),
          },
        },
      };

      new PluginScopePlugin({ pluginRoot: pluginA }).apply(compiler);

      expect(() =>
        afterResolve?.({
          request: '../../b/src/thing',
          contextInfo: { issuer },
          createData: { resource: path.join(repo, 'plugins/b/src/thing.ts') },
        })
      ).toThrow(/another plugin/);
    });
  });
});
