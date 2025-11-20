import migrate from './006-webpack-nested-fix.js';
import { createDefaultContext } from '../../test-utils.js';

describe('Migration - webpack nested fix', () => {
  test('should transform files property to test property', () => {
    const context = createDefaultContext();

    const webpackConfigContent = `
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';

const config = {
  plugins: [
    new ReplaceInFileWebpackPlugin([
      {
        dir: 'dist',
        files: ['plugin.json', 'README.md'],
        rules: [
          { search: /VERSION/g, replace: '1.0.0' }
        ]
      }
    ])
  ]
};
`;

    context.addFile('.config/webpack/webpack.config.ts', webpackConfigContent);

    const updatedContext = migrate(context);
    const webpackConfig = updatedContext.getFile('.config/webpack/webpack.config.ts');

    expect(webpackConfig).toContain('test: [/(^|\\/)plugin\\.json$/, /(^|\\/)README\\.md$/]');
    expect(webpackConfig).not.toContain('files:');
    expect(webpackConfig).toContain('dir:');
    expect(webpackConfig).toContain('rules:');
  });

  test('should not transform if files array has different values', () => {
    const context = createDefaultContext();

    const webpackConfigContent = `
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';

const config = {
  plugins: [
    new ReplaceInFileWebpackPlugin([
      {
        dir: 'dist',
        files: ['custom.json', 'other.md'],
        rules: []
      }
    ])
  ]
};
`;

    context.addFile('.config/webpack/webpack.config.ts', webpackConfigContent);

    const updatedContext = migrate(context);
    const webpackConfig = updatedContext.getFile('.config/webpack/webpack.config.ts');

    expect(webpackConfig).toBe(webpackConfigContent);
  });

  test('should not transform if already using test property', () => {
    const context = createDefaultContext();

    const webpackConfigContent = `
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';

const config = {
  plugins: [
    new ReplaceInFileWebpackPlugin([
      {
        dir: 'dist',
        test: [/(^|\\/)plugin\\.json$/, /(^|\\/)README\\.md$/],
        rules: []
      }
    ])
  ]
};
`;

    context.addFile('.config/webpack/webpack.config.ts', webpackConfigContent);

    const updatedContext = migrate(context);
    const webpackConfig = updatedContext.getFile('.config/webpack/webpack.config.ts');

    expect(webpackConfig).toBe(webpackConfigContent);
  });

  test('should handle multiple ReplaceInFileWebpackPlugin instances', () => {
    const context = createDefaultContext();

    const webpackConfigContent = `
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';

const config = {
  plugins: [
    new ReplaceInFileWebpackPlugin([
      {
        dir: 'dist',
        files: ['plugin.json', 'README.md'],
        rules: [],
      }
    ]),
    new ReplaceInFileWebpackPlugin([
      {
        dir: 'other',
        files: ['custom.json'],
        rules: [],
      }
    ])
  ]
};
`;

    const expectedConfig = `
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';

const config = {
  plugins: [
    new ReplaceInFileWebpackPlugin([
      {
        dir: 'dist',
        test: [/(^|\\/)plugin\\.json$/, /(^|\\/)README\\.md$/],
        rules: [],
      }
    ]),
    new ReplaceInFileWebpackPlugin([
      {
        dir: 'other',
        files: ['custom.json'],
        rules: [],
      }
    ])
  ]
};
`;

    context.addFile('.config/webpack/webpack.config.ts', webpackConfigContent);
    const updatedContext = migrate(context);
    const webpackConfig = updatedContext.getFile('.config/webpack/webpack.config.ts');
    expect(webpackConfig).toBe(expectedConfig);
  });

  test('should be idempotent', () => {
    const context = createDefaultContext();

    const webpackConfigContent = `
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';

const config = {
  plugins: [
    new ReplaceInFileWebpackPlugin([
      {
        dir: 'dist',
        files: ['plugin.json', 'README.md'],
        rules: []
      }
    ])
  ]
};
`;

    context.addFile('.config/webpack/webpack.config.ts', webpackConfigContent);

    expect(migrate).toBeIdempotent(context);
  });
});
