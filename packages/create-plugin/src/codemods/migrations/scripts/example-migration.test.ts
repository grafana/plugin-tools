import migrate from './example-migration.js';
import { createDefaultContext } from '../../test-utils.js';

describe('Migration - append profile to webpack', () => {
  test('should update the package.json', async () => {
    const context = createDefaultContext();

    context.updateFile(
      './package.json',
      JSON.stringify({
        scripts: {
          build: 'webpack -c ./.config/webpack/webpack.config.ts --env production',
        },
      })
    );

    const updatedContext = await migrate(context, { profile: true, skipBackup: false, verbose: false });

    expect(updatedContext.getFile('./package.json')).toMatch(
      'webpack -c ./.config/webpack/webpack.config.ts --profile --env production'
    );

    expect(updatedContext.readDir('./src')).toEqual(['src/FOO.md', 'src/foo.json']);
  });

  it('should not make additional changes when run multiple times', async () => {
    const context = await createDefaultContext();

    await context.updateFile(
      './package.json',
      JSON.stringify({
        scripts: {
          build: 'webpack -c ./.config/webpack/webpack.config.ts --env production',
        },
      })
    );

    await expect(migrate).toBeIdempotent(context);
  });
});
