import migrate from './012-webpack-remove-glob-dependency.js';
import { createDefaultContext } from '../../test-utils.js';

const originalContent = `
import { glob } from 'glob';

// Support bundling nested plugins by finding all plugin.json files in src directory
// then checking for a sibling module.[jt]sx? file.
export async function getEntries() {
    // mock content    
}
`;

describe('Migration - webpack remove glob dependency', () => {
  test('should be idempotent', async () => {
    const context = createDefaultContext();
    context.addFile('.config/webpack/utils.ts', originalContent);

    // run the migration once
    const updated = migrate(context);

    // subsequent runs should be idempotent
    await expect(migrate).toBeIdempotent(updated);
  });

  test('should replace function in both locations', () => {
    const context = createDefaultContext();

    context.addFile('.config/webpack/utils.ts', originalContent);
    context.addFile('.config/bundler/utils.ts', originalContent);

    const updatedContext = migrate(context);
    const bundlerUtilsContent = updatedContext.getFile('.config/bundler/utils.ts');
    const webpackUtilsContent = updatedContext.getFile('.config/webpack/utils.ts');

    for (const content of [bundlerUtilsContent, webpackUtilsContent]) {
      expect(content).not.toContain('mock content');
      expect(content).toContain('for await (const module of glob(');
    }
  });
  test('should remove dependency from package.json', () => {
    const context = createDefaultContext();

    context.addFile('.config/webpack/utils.ts', originalContent);
    context.updateFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          '@grafana/eslint-config': '^9.0.0',
          '@grafana/plugin-e2e': '^3.6.1',
          '@grafana/tsconfig': '^2.0.1',
          '@rspack/core': '^1.6.0',
          '@stylistic/eslint-plugin-ts': '^4.4.0',
          '@swc/core': '^1.15.0',
          '@swc/helpers': '^0.5.0',
          '@swc/jest': '^0.2.0',
          glob: '11.0.0',
        },
      })
    );
    const updatedContext = migrate(context);
    const updatedPackageJSON = updatedContext.getFile('package.json');
    expect(updatedPackageJSON).not.toContain('glob');
  });
});
