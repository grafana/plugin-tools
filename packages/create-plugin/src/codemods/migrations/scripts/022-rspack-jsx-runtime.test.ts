import { describe, expect, it } from 'vitest';
import migrate from './022-rspack-jsx-runtime.js';
import { Context } from '../../context.js';

const RSPACK_CONFIG_PATH = '.config/rspack/rspack.config.ts';

function createRspackConfig(developmentValue?: string): string {
  const developmentLine = developmentValue === undefined ? '' : `development: ${developmentValue},`;
  return `
const config = async (env: Env) => ({
  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        test: /\\.[tj]sx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              transform: {
                react: {
                  ${developmentLine}
                  refresh: false,
                },
              },
            },
          },
        },
      },
    ],
  },
});
export default config;
`;
}

function createContextWithConfig(content: string): Context {
  const context = new Context('/virtual');
  context.addFile(RSPACK_CONFIG_PATH, content);
  return context;
}

describe('022-rspack-jsx-runtime', () => {
  it('should set development to false when it follows the production flag', () => {
    const context = createContextWithConfig(createRspackConfig('!env.production'));

    const result = migrate(context);

    const content = result.getFile(RSPACK_CONFIG_PATH);
    expect(content).toContain('development: false');
    expect(content).not.toContain('!env.production');
  });

  it('should set development to false when it is true', () => {
    const context = createContextWithConfig(createRspackConfig('true'));

    const result = migrate(context);

    expect(result.getFile(RSPACK_CONFIG_PATH)).toContain('development: false');
  });

  it('should be idempotent', async () => {
    const context = createContextWithConfig(createRspackConfig('!env.production'));

    await expect(migrate).toBeIdempotent(context);
  });

  it('should not modify the file when development is already false', () => {
    const original = createRspackConfig('false');
    const context = createContextWithConfig(original);

    const result = migrate(context);

    expect(result.getFile(RSPACK_CONFIG_PATH)).toBe(original);
  });

  it('should not modify the file when development is absent', () => {
    const original = createRspackConfig();
    const context = createContextWithConfig(original);

    const result = migrate(context);

    expect(result.getFile(RSPACK_CONFIG_PATH)).toBe(original);
  });

  it('should not modify the file when there is no swc-loader rule', () => {
    const original = `export default { module: { rules: [{ loader: 'other-loader', options: { jsc: { transform: { react: { development: true } } } } }] } };`;
    const context = createContextWithConfig(original);

    const result = migrate(context);

    expect(result.getFile(RSPACK_CONFIG_PATH)).toBe(original);
  });

  it('should not modify the file when the file cannot be parsed', () => {
    const original = 'const config = {{{';
    const context = createContextWithConfig(original);

    const result = migrate(context);

    expect(result.getFile(RSPACK_CONFIG_PATH)).toBe(original);
  });

  it('should not do anything when the rspack config does not exist', () => {
    const context = new Context('/virtual');

    const result = migrate(context);

    expect(result.hasChanges()).toBe(false);
  });
});
