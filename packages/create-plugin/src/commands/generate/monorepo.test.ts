import path from 'node:path';
import { dirSync } from 'tmp';
import { parse as parseYaml } from 'yaml';

import {
  addToReleasePlease,
  createComposeFile,
  createPluginPackageJson,
  createRootPackageJson,
  ESLINT_PLUGIN_PLUGINS_VERSION,
  mergeProvisioning,
  planMonorepoGeneration,
  renderMonorepoTemplates,
  splitPluginFiles,
  useTopLevelBins,
  writeFiles,
} from './monorepo.js';
import { getTemplateActions } from '../generate.command.js';
import { TemplateData } from '../../types.js';

function templateData(packageManagerName: string, packageManagerVersion: string): TemplateData {
  return {
    pluginId: 'myorg-a-panel',
    pluginName: 'a',
    hasBackend: false,
    orgName: 'myorg',
    pluginType: 'panel',
    packageManagerName,
    packageManagerVersion,
    packageManagerInstallCmd: 'npm ci',
    isAppType: false,
    isNPM: packageManagerName === 'npm',
    supportsWorkspaceProtocol: packageManagerName !== 'npm',
    version: '7.12.0',
    bundleGrafanaUI: false,
    scenesVersion: '',
    useExperimentalRspack: false,
    frontendBundler: 'webpack',
  } as TemplateData;
}

const pluginPackageJson = {
  name: 'a',
  version: '1.0.0',
  private: true,
  workspaces: ['.config'],
  scripts: {
    build: 'webpack -c ./webpack.config.ts --env production',
    'lint:fix': 'yarn run lint --fix && prettier --write --list-different .',
    server: 'docker compose up --build',
  },
  devDependencies: { '@grafana/create-plugin-configs': 'workspace:*', webpack: '^5.0.0', jest: '^29.0.0' },
  dependencies: { '@grafana/data': '^12.0.0' },
  packageManager: 'yarn@4.10.3',
};

describe('monorepo generation', () => {
  describe('splitPluginFiles', () => {
    it('sorts files into shared root files, plugin files and provisioning', () => {
      const files = new Map([
        ['.config/tsconfig.json', 'config'],
        ['.nvmrc', '24'],
        ['.cprc.json', '{}'],
        ['.claude/skills/build-plugin/SKILL.md', 'skill'],
        ['.github/workflows/ci.yml', 'ci'],
        ['docker-compose.yaml', 'compose'],
        ['AGENTS.md', 'agents'],
        ['pnpm-workspace.yaml', 'pnpm'],
        ['provisioning/datasources/datasources.yml', 'ds'],
        ['.gitignore', 'node_modules'],
        ['package.json', '{}'],
        ['src/module.ts', 'module'],
        ['webpack.config.ts', 'wrapper'],
      ]);

      const { rootFiles, pluginFiles, provisioningFiles } = splitPluginFiles(files);

      expect([...rootFiles.keys()].sort()).toEqual(
        ['.claude/skills/build-plugin/SKILL.md', '.config/tsconfig.json', '.cprc.json', '.gitignore', '.nvmrc'].sort()
      );
      expect([...pluginFiles.keys()].sort()).toEqual([
        '.gitignore',
        'package.json',
        'src/module.ts',
        'webpack.config.ts',
      ]);
      expect([...provisioningFiles.keys()]).toEqual(['provisioning/datasources/datasources.yml']);
    });
  });

  describe('package.json files', () => {
    it('names the plugin package after the plugin id and keeps only its runtime dependencies', () => {
      const result = createPluginPackageJson(pluginPackageJson, templateData('npm', '11.12.1'));

      expect(result.name).toBe('myorg-a-panel');
      expect(result.dependencies).toEqual({ '@grafana/data': '^12.0.0' });
      expect(result.devDependencies).toEqual({ '@grafana/create-plugin-configs': 'workspace:*' });
      expect(result).not.toHaveProperty('workspaces');
      expect(result).not.toHaveProperty('packageManager');
      expect(result.scripts?.build).toBe('webpack -c ./webpack.config.ts --env production');
    });

    it('runs root tooling with yarn run -T in a yarn berry monorepo', () => {
      const result = createPluginPackageJson(pluginPackageJson, templateData('yarn', '4.10.3'));

      expect(result.scripts?.build).toBe('yarn run -T webpack -c ./webpack.config.ts --env production');
      expect(result.scripts?.['lint:fix']).toBe(
        'yarn run lint --fix && yarn run -T prettier --write --list-different .'
      );
      expect(result.scripts?.server).toBe('docker compose -f ../../docker-compose.yaml up --build');
    });

    it("starts the shared Grafana from a plugin's server script", () => {
      const result = createPluginPackageJson(pluginPackageJson, templateData('npm', '11.12.1'));

      expect(result.scripts?.server).toBe('docker compose -f ../../docker-compose.yaml up --build');
    });

    it('only prefixes known tooling binaries', () => {
      expect(useTopLevelBins('tsc --noEmit')).toBe('yarn run -T tsc --noEmit');
      expect(useTopLevelBins('docker compose up')).toBe('docker compose up');
    });

    it.each([
      ['npm', '11.12.1', 'npm run build --workspaces --if-present', true],
      ['pnpm', '9.15.0', 'pnpm -r --if-present run build', false],
      ['yarn', '4.10.3', 'yarn workspaces foreach --all --exclude my-plugins run build', true],
    ])(
      'gives the %s root package.json the tooling and recursive scripts',
      (name, version, buildScript, hasWorkspaces) => {
        const result = createRootPackageJson(pluginPackageJson, templateData(name, version), 'my-plugins');

        expect(result.scripts?.build).toBe(buildScript);
        expect(result.devDependencies).toEqual({
          webpack: '^5.0.0',
          jest: '^29.0.0',
          '@grafana/eslint-plugin-plugins': ESLINT_PLUGIN_PLUGINS_VERSION,
        });
        expect(result.packageManager).toBe(`${name}@${version}`);
        expect('workspaces' in result).toBe(hasWorkspaces);
      }
    );
  });

  describe('mergeProvisioning', () => {
    it('gives each plugin its own dashboards folder and prefixes other files', () => {
      const merged = mergeProvisioning(
        new Map(),
        new Map([
          ['provisioning/dashboards/default.yaml', 'options:\n  path: /etc/grafana/provisioning/dashboards'],
          ['provisioning/dashboards/dashboard.json', '{}'],
          ['provisioning/datasources/datasources.yml', 'testdata'],
          ['provisioning/README.md', 'readme'],
          ['provisioning/dashboards/.gitkeep', ''],
        ]),
        'myorg-a-panel'
      );

      expect(Object.fromEntries(merged)).toEqual({
        'provisioning/dashboards/myorg-a-panel.yaml':
          'options:\n  path: /etc/grafana/provisioning/dashboards/myorg-a-panel',
        'provisioning/dashboards/myorg-a-panel/dashboard.json': '{}',
        'provisioning/datasources/myorg-a-panel-datasources.yml': 'testdata',
      });
    });

    it('skips a file that is already provisioned with the same content', () => {
      const merged = mergeProvisioning(
        new Map([['provisioning/datasources/myorg-a-panel-datasources.yml', 'testdata']]),
        new Map([['provisioning/datasources/datasources.yml', 'testdata']]),
        'myorg-b-panel'
      );

      expect(merged.size).toBe(0);
    });
  });

  describe('createComposeFile', () => {
    it('runs one Grafana that loads every plugin', () => {
      const composeBase = `services:
  grafana:
    build:
      context: .
      args:
        grafana_version: \${GRAFANA_VERSION:-13.2.2}
        development: \${DEVELOPMENT:-false}
`;

      const compose = parseYaml(
        createComposeFile(
          composeBase,
          [
            { dir: 'plugins/a', id: 'myorg-a-panel' },
            { dir: 'plugins/b', id: 'myorg-b-app' },
          ],
          'my-plugins'
        )
      );

      const grafana = compose.services.grafana;
      expect(grafana.build).toEqual({
        context: './.config',
        args: { grafana_version: '${GRAFANA_VERSION:-13.2.2}', development: 'false' },
      });
      expect(grafana.volumes).toEqual([
        './plugins/a/dist:/var/lib/grafana/plugins/myorg-a-panel',
        './plugins/b/dist:/var/lib/grafana/plugins/myorg-b-app',
        './provisioning:/etc/grafana/provisioning',
      ]);
      expect(grafana.environment.GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS).toBe('myorg-a-panel,myorg-b-app');
    });
  });

  describe('addToReleasePlease', () => {
    it('creates a manifest config with one component per plugin', () => {
      const { config, manifest } = addToReleasePlease({}, 'plugins/a', 'myorg-a-panel', '1.2.0');

      expect(JSON.parse(config)).toMatchObject({
        'include-component-in-tag': true,
        packages: { 'plugins/a': { 'release-type': 'node', component: 'myorg-a-panel' } },
      });
      expect(JSON.parse(manifest)).toEqual({ 'plugins/a': '1.2.0' });
    });

    it('adds a plugin to the existing files', () => {
      const first = addToReleasePlease({}, 'plugins/a', 'myorg-a-panel', '1.2.0');

      const { config, manifest } = addToReleasePlease(first, 'plugins/b', 'myorg-b-app', '1.0.0');

      expect(Object.keys(JSON.parse(config).packages)).toEqual(['plugins/a', 'plugins/b']);
      expect(JSON.parse(manifest)).toEqual({ 'plugins/a': '1.2.0', 'plugins/b': '1.0.0' });
    });
  });

  describe('planMonorepoGeneration', () => {
    const tmpObj = dirSync({ unsafeCleanup: true });

    afterAll(() => {
      tmpObj.removeCallback();
    });

    function plan(data: TemplateData, options: { monorepoRoot?: string; newMonorepoPath?: string }) {
      return planMonorepoGeneration({
        templateData: data,
        actions: getTemplateActions({ templateData: data, exportPath: '' }),
        monorepoRoot: options.monorepoRoot,
        newMonorepoPath: options.newMonorepoPath ?? path.join(tmpObj.name, 'unused'),
      });
    }

    it('creates a monorepo with the shared root and the first plugin', () => {
      const newMonorepoPath = path.join(tmpObj.name, 'my-plugins');

      const { files, pluginDir, isNewMonorepo } = plan(templateData('npm', '11.12.1'), { newMonorepoPath });
      const paths = [...files.keys()];

      expect(isNewMonorepo).toBe(true);
      expect(pluginDir).toBe('plugins/myorg-a-panel');
      expect(paths).toEqual(
        expect.arrayContaining([
          '.config/package.json',
          '.config/tsconfig.json',
          'package.json',
          'docker-compose.yaml',
          '.github/workflows/ci.yml',
          'release-please-config.json',
          'plugins/myorg-a-panel/package.json',
          'plugins/myorg-a-panel/src/plugin.json',
          'plugins/myorg-a-panel/webpack.config.ts',
        ])
      );
      expect(paths.filter((filePath) => filePath.startsWith('plugins/myorg-a-panel/.config'))).toEqual([]);
      expect(paths).not.toContain('plugins/myorg-a-panel/docker-compose.yaml');
      expect(JSON.parse(files.get('package.json') ?? '{}').name).toBe('my-plugins');
    });

    it('adds a plugin to an existing monorepo without rewriting the shared root', async () => {
      const root = path.join(tmpObj.name, 'existing');
      const first = plan(templateData('npm', '11.12.1'), { newMonorepoPath: root });
      await writeFiles(first.root, first.files);

      const second = plan(
        { ...templateData('npm', '11.12.1'), pluginId: 'myorg-b-panel', pluginName: 'b' },
        {
          monorepoRoot: root,
        }
      );
      const paths = [...second.files.keys()];

      expect(second.isNewMonorepo).toBe(false);
      expect(paths.some((filePath) => filePath.startsWith('.config/'))).toBe(false);
      expect(paths).not.toContain('package.json');
      expect(paths).toContain('plugins/myorg-b-panel/package.json');
      expect(JSON.parse(second.files.get('.release-please-manifest.json') ?? '{}')).toEqual({
        'plugins/myorg-a-panel': '1.0.0',
        'plugins/myorg-b-panel': '1.0.0',
      });
      expect(second.files.get('docker-compose.yaml')).toContain('/var/lib/grafana/plugins/myorg-a-panel');
      expect(second.files.get('docker-compose.yaml')).toContain('/var/lib/grafana/plugins/myorg-b-panel');
    });

    it('refuses to overwrite an existing plugin directory', async () => {
      const root = path.join(tmpObj.name, 'duplicate');
      const first = plan(templateData('npm', '11.12.1'), { newMonorepoPath: root });
      await writeFiles(first.root, first.files);

      expect(() => plan(templateData('npm', '11.12.1'), { monorepoRoot: root })).toThrow(/already exists/);
    });
  });

  describe('renderMonorepoTemplates', () => {
    it('renders the root workflows and agent files', () => {
      const files = renderMonorepoTemplates(templateData('npm', '11.12.1'));

      expect([...files.keys()]).toEqual(
        expect.arrayContaining([
          '.github/workflows/ci.yml',
          '.github/workflows/e2e.yml',
          '.github/workflows/release-please.yml',
          '.github/dependabot.yml',
          'AGENTS.md',
          'CLAUDE.md',
          'GEMINI.md',
          'packages/README.md',
        ])
      );
      expect(files.get('.github/workflows/ci.yml')).toContain('${{ fromJson(needs.discover.outputs.plugins) }}');
      expect(files.get('.github/workflows/ci.yml')).not.toContain('$\\{{');
    });
  });
});
