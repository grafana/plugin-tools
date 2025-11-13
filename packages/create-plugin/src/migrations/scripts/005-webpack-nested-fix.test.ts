import migrate from './005-webpack-nested-fix.js';
import { createDefaultContext } from '../test-utils.js';

vi.mock('../../utils/utils.templates.js', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    getTemplateData: vi.fn().mockReturnValue({
      pluginId: 'test-plugin',
      pluginName: 'Test Plugin',
      orgName: 'Test Org',
      pluginType: 'panel',
      packageManagerName: 'npm',
      packageManagerVersion: '8.0.0',
    }),
  };
});

describe('Migration - webpack nested fix', () => {
  test('should update the webpack config', async () => {
    const context = createDefaultContext();

    context.addFile('.config/webpack/webpack.config.ts', 'module.exports = { ...config, ...webpackConfig };');

    const updatedContext = await migrate(context);
    const webpackConfig = updatedContext.getFile('.config/webpack/webpack.config.ts');
    expect(webpackConfig).toContain('test: [/(^|\\/)plugin\\.json$/, /(^|\\/)README\\.md$/],');
    expect(webpackConfig).not.toContain('files: ["plugin.json", "README.md"]');
  });

  it('should not make additional changes when run multiple times', async () => {
    const context = await createDefaultContext();

    await expect(migrate).toBeIdempotent(context);
  });
});
