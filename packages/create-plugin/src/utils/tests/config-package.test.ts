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

  describe('files read before install', () => {
    // generate runs prettier straight after scaffolding, before the workspace package is linked.
    it('keeps the prettier config importing .config by relative path', () => {
      const prettierConfig = renderTemplateFromFile(
        path.join(TEMPLATE_PATHS.common, '.prettierrc.js'),
        templateData('npm', '10.9.0')
      );

      expect(prettierConfig).toContain("require('./.config/.prettierrc.js')");
      expect(prettierConfig).not.toContain(CONFIG_PACKAGE);
    });
  });

  describe('eslint config', () => {
    const render = (file: string) =>
      renderTemplateFromFile(path.join(TEMPLATE_PATHS.common, file), templateData('npm', '10.9.0'));

    it('ignores tooling output once, in the shared config', () => {
      const sharedConfig = render('.config/eslint.config.mjs');

      expect(sharedConfig).toContain('globalIgnores([');
      expect(sharedConfig).toContain("'**/dist/'");
      expect(sharedConfig).toContain("'playwright-report/'");
    });

    it('enforces module boundaries between plugins in a monorepo', () => {
      const monorepoConfig = renderTemplateFromFile(path.join(TEMPLATE_PATHS.common, '.config', 'eslint.config.mjs'), {
        ...templateData('npm', '10.9.0'),
        isMonorepo: true,
      });

      expect(monorepoConfig).toContain("import grafanaPluginsPlugin from '@grafana/eslint-plugin-plugins';");
      expect(monorepoConfig).toContain("'@grafana/plugins/no-cross-plugin-imports': 'error'");
    });

    it('leaves the module boundary rule out of single plugins', () => {
      const sharedConfig = render('.config/eslint.config.mjs');

      expect(sharedConfig).not.toContain('no-cross-plugin-imports');
      expect(sharedConfig).not.toContain('@grafana/eslint-plugin-plugins');
    });

    it("keeps the plugin's eslint config to the shared config and its own additions", () => {
      const pluginConfig = render('eslint.config.mjs');

      expect(pluginConfig).toContain(`import baseConfig from '${CONFIG_PACKAGE}/eslint';`);
      expect(pluginConfig).not.toContain("'**/dist/'");
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
