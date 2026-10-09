import { Context } from './context.js';
import { addPluginDependencies, addToolingDependencies, forEachPlugin } from './utils.project.js';

function createMonorepoContext() {
  const context = new Context('/virtual', {
    root: '/virtual',
    kind: 'monorepo',
    plugins: [{ dir: 'plugins/a' }, { dir: 'plugins/b' }],
  });
  context.addFile('package.json', JSON.stringify({ name: 'root', devDependencies: {} }));
  context.addFile('plugins/a/package.json', JSON.stringify({ name: 'a' }));
  context.addFile('plugins/b/package.json', JSON.stringify({ name: 'b' }));

  return context;
}

describe('utils.project', () => {
  describe('forEachPlugin', () => {
    it('resolves plugin paths from the root for a single plugin', () => {
      const context = new Context('/virtual');
      const paths: string[] = [];

      forEachPlugin(context, (_plugin, resolvePath) => {
        paths.push(resolvePath('src/plugin.json'));
      });

      expect(paths).toEqual(['src/plugin.json']);
    });

    it('calls back once per plugin with paths inside each plugin directory', () => {
      const context = createMonorepoContext();
      const visited: Array<{ dir: string; path: string }> = [];

      forEachPlugin(context, (plugin, resolvePath) => {
        visited.push({ dir: plugin.dir, path: resolvePath('src/plugin.json') });
      });

      expect(visited).toEqual([
        { dir: 'plugins/a', path: 'plugins/a/src/plugin.json' },
        { dir: 'plugins/b', path: 'plugins/b/src/plugin.json' },
      ]);
    });
  });

  describe('addToolingDependencies', () => {
    it('adds devDependencies to the root package.json', () => {
      const context = createMonorepoContext();

      addToolingDependencies(context, { webpack: '^5.0.0' });

      expect(JSON.parse(context.getFile('package.json') ?? '{}').devDependencies).toEqual({ webpack: '^5.0.0' });
      expect(JSON.parse(context.getFile('plugins/a/package.json') ?? '{}').devDependencies).toBeUndefined();
    });
  });

  describe('addPluginDependencies', () => {
    it("adds dependencies to the plugin's package.json", () => {
      const context = createMonorepoContext();

      addPluginDependencies(context, { dir: 'plugins/b' }, { '@grafana/data': '^12.0.0' });

      expect(JSON.parse(context.getFile('plugins/b/package.json') ?? '{}').dependencies).toEqual({
        '@grafana/data': '^12.0.0',
      });
      expect(JSON.parse(context.getFile('package.json') ?? '{}').dependencies).toBeUndefined();
    });
  });
});
