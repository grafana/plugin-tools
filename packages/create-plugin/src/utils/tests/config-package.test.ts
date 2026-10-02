import path from 'node:path';

import { TEMPLATE_PATHS } from '../../constants.js';
import { getActionsForTemplateFolder } from '../../commands/generate.command.js';
import { renderTemplateFromFile } from '../utils.templates.js';
import { TemplateData } from '../../types.js';

const CONFIG_PACKAGE = '@grafana/create-plugin-configs';

function templateData(packageManagerName: string, packageManagerVersion: string): TemplateData {
  const isYarnBerry = packageManagerName === 'yarn' && !packageManagerVersion.startsWith('1.');

  return {
    pluginId: 'myorg-test-panel',
    pluginName: 'test',
    hasBackend: false,
    orgName: 'myorg',
    pluginType: 'panel',
    packageManagerName,
    packageManagerVersion,
    packageManagerInstallCmd: '',
    isAppType: false,
    isNPM: packageManagerName === 'npm',
    supportsWorkspaceProtocol: packageManagerName === 'pnpm' || isYarnBerry,
    version: '7.12.0',
    bundleGrafanaUI: false,
    scenesVersion: '',
    useExperimentalRspack: false,
    frontendBundler: 'webpack',
  } as TemplateData;
}

function renderPackageJson(data: TemplateData) {
  return JSON.parse(renderTemplateFromFile(path.join(TEMPLATE_PATHS.common, '_package.json'), data));
}

describe('.config workspace package', () => {
  describe('package.json template', () => {
    it.each([
      ['npm', '10.9.0'],
      ['yarn', '1.22.22'],
    ])('declares .config as a workspace for %s without a workspace: dependency', (name, version) => {
      const packageJson = renderPackageJson(templateData(name, version));

      expect(packageJson.private).toBe(true);
      expect(packageJson.workspaces).toEqual(['.config']);
      expect(packageJson.devDependencies[CONFIG_PACKAGE]).toBeUndefined();
    });

    it('depends on the config package through the workspace protocol for yarn berry', () => {
      const packageJson = renderPackageJson(templateData('yarn', '4.10.3'));

      expect(packageJson.workspaces).toEqual(['.config']);
      expect(packageJson.devDependencies[CONFIG_PACKAGE]).toBe('workspace:*');
    });

    it('leaves workspaces to pnpm-workspace.yaml for pnpm', () => {
      const packageJson = renderPackageJson(templateData('pnpm', '9.15.0'));

      expect(packageJson.private).toBe(true);
      expect(packageJson.workspaces).toBeUndefined();
      expect(packageJson.devDependencies[CONFIG_PACKAGE]).toBe('workspace:*');
    });

    it('builds through the plugin-root bundler config', () => {
      const packageJson = renderPackageJson(templateData('npm', '10.9.0'));

      expect(packageJson.scripts.build).toBe('webpack -c ./webpack.config.ts --env production');
      expect(packageJson.scripts.dev).toBe('webpack -w -c ./webpack.config.ts --env development');
    });
  });

  describe('generated files', () => {
    function generatedFiles(data: TemplateData) {
      return getActionsForTemplateFolder({
        folderPath: TEMPLATE_PATHS.common,
        exportPath: '/plugin',
        templateData: data,
      })
        .map((action) => path.relative('/plugin', action.path))
        .sort();
    }

    it('adds the config package manifest and the plugin-root bundler wrapper', () => {
      const files = generatedFiles(templateData('npm', '10.9.0'));

      expect(files).toContain('.config/package.json');
      expect(files).toContain('webpack.config.ts');
      expect(files).not.toContain('rspack.config.ts');
    });

    it('only adds pnpm-workspace.yaml for pnpm', () => {
      expect(generatedFiles(templateData('pnpm', '9.15.0'))).toContain('pnpm-workspace.yaml');
      expect(generatedFiles(templateData('npm', '10.9.0'))).not.toContain('pnpm-workspace.yaml');
      expect(generatedFiles(templateData('yarn', '4.10.3'))).not.toContain('pnpm-workspace.yaml');
    });
  });

  describe('config package manifest', () => {
    it('exports every config a plugin wrapper imports', () => {
      const manifest = JSON.parse(
        renderTemplateFromFile(
          path.join(TEMPLATE_PATHS.common, '.config', '_package.json'),
          templateData('npm', '10.9.0')
        )
      );

      expect(manifest.name).toBe(CONFIG_PACKAGE);
      expect(manifest.private).toBe(true);
      expect(manifest.dependencies).toBeUndefined();
      expect(manifest.exports).toMatchObject({
        './tsconfig.json': './tsconfig.json',
        './jest': './jest.config.js',
        './jest-setup': './jest-setup.js',
        './eslint': './eslint.config.mjs',
        './prettier': './.prettierrc.js',
        './playwright': './playwright.config.ts',
        './webpack': './webpack/webpack.config.ts',
        './*': './*',
      });
    });
  });
});
