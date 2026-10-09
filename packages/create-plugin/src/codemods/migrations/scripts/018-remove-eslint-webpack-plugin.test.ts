import { describe, expect, it } from 'vitest';
import migrate from './018-remove-eslint-webpack-plugin.js';
import { Context } from '../../context.js';

const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';
const RSPACK_CONFIG_PATH = '.config/rspack/rspack.config.ts';

const WEBPACK_CONFIG = `import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { type Configuration } from 'webpack';
import LiveReloadPlugin from 'webpack-livereload-plugin';

const config = async (env: Record<string, unknown>): Promise<Configuration> => ({
  plugins: [
    ...(env.development ? [
      new LiveReloadPlugin(),
      new ForkTsCheckerWebpackPlugin({
        async: Boolean(env.development),
      }),
      new ESLintPlugin({
        extensions: ['.ts', '.tsx'],
        lintDirtyModulesOnly: Boolean(env.development), // don't lint on start, only lint changed files
        failOnError: Boolean(env.production),
      }),
    ] : []),
  ],
});

export default config;
`;

const RSPACK_CONFIG = `import rspack, { type Configuration } from '@rspack/core';
import ESLintPlugin from 'eslint-webpack-plugin';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';

const config = async (env: Record<string, unknown>): Promise<Configuration> => ({
  plugins: [
    ...(env.development
      ? [
          new TsCheckerRspackPlugin({
            async: Boolean(env.development),
          }),
          new ESLintPlugin({
            extensions: ['.ts', '.tsx'],
            lintDirtyModulesOnly: Boolean(env.development), // don't lint on start, only lint changed files
          }),
        ]
      : []),
  ],
});

export default config;
`;

function setupContext(files: Record<string, string> = { [WEBPACK_CONFIG_PATH]: WEBPACK_CONFIG }) {
  const context = new Context('/virtual');
  context.addFile(
    'package.json',
    JSON.stringify({ devDependencies: { 'eslint-webpack-plugin': '^5.0.0', webpack: '^5.101.0' } })
  );
  for (const [path, content] of Object.entries(files)) {
    context.addFile(path, content);
  }
  return context;
}

describe('018-remove-eslint-webpack-plugin', () => {
  it('should remove the plugin from the webpack config and package.json', () => {
    const result = migrate(setupContext());
    const config = result.getFile(WEBPACK_CONFIG_PATH) || '';
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(config).not.toContain('eslint-webpack-plugin');
    expect(config).not.toContain('ESLintPlugin');
    expect(config).toContain('new LiveReloadPlugin()');
    expect(config).toContain('new ForkTsCheckerWebpackPlugin({');
    expect(packageJson.devDependencies).toEqual({ webpack: '^5.101.0' });
  });

  it('should only remove the plugin lines and keep the rest of the formatting', () => {
    const result = migrate(setupContext());
    const expected = WEBPACK_CONFIG.replace("import ESLintPlugin from 'eslint-webpack-plugin';\n", '').replace(
      /\n {6}new ESLintPlugin\(\{\n(?:.*\n){3} {6}\}\),/,
      ''
    );

    expect(result.getFile(WEBPACK_CONFIG_PATH)).toBe(expected);
  });

  it('should still remove the plugin when it shares a line with other plugins', () => {
    const result = migrate(
      setupContext({
        [WEBPACK_CONFIG_PATH]: `import ESLintPlugin from 'eslint-webpack-plugin';\nimport LiveReloadPlugin from 'webpack-livereload-plugin';\n\nexport default { plugins: [new LiveReloadPlugin(), new ESLintPlugin()] };\n`,
      })
    );
    const config = result.getFile(WEBPACK_CONFIG_PATH) || '';

    expect(config).not.toContain('ESLintPlugin');
    expect(config).toContain('new LiveReloadPlugin()');
  });

  it('should remove the plugin from the rspack config', () => {
    const result = migrate(setupContext({ [RSPACK_CONFIG_PATH]: RSPACK_CONFIG }));
    const config = result.getFile(RSPACK_CONFIG_PATH) || '';

    expect(config).not.toContain('ESLintPlugin');
    expect(config).toContain('new TsCheckerRspackPlugin({');
  });

  it('should keep the dependency when an extended config still imports it', () => {
    const result = migrate(
      setupContext({
        [WEBPACK_CONFIG_PATH]: WEBPACK_CONFIG,
        'webpack.config.ts': `import ESLintPlugin from 'eslint-webpack-plugin';\n`,
      })
    );
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');

    expect(result.getFile(WEBPACK_CONFIG_PATH)).not.toContain('ESLintPlugin');
    expect(packageJson.devDependencies['eslint-webpack-plugin']).toBe('^5.0.0');
  });

  it('should not modify configs that do not use the plugin', () => {
    const context = new Context('/virtual');
    context.addFile(WEBPACK_CONFIG_PATH, `export default {};\n`);

    const result = migrate(context);

    expect(result.getFile(WEBPACK_CONFIG_PATH)).toBe(`export default {};\n`);
  });

  it('should be idempotent', async () => {
    await expect(migrate).toBeIdempotent(
      setupContext({ [WEBPACK_CONFIG_PATH]: WEBPACK_CONFIG, [RSPACK_CONFIG_PATH]: RSPACK_CONFIG })
    );
  });
});
