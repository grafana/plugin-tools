import type { Context } from '../../context.js';

/**
 * Example migration that demonstrates basic context operations
 * This example shows how to modify package.json, add/delete files, and rename files
 */

type MigrateOptions = {
  profile?: boolean;
  skipBackup?: boolean;
  verbose?: boolean;
};

export default function migrate(context: Context, options: MigrateOptions = {}): Context {
  const { profile = false, skipBackup = false, verbose = false } = options;

  if (verbose) {
    console.log('Running migration with options:', options);
  }

  const rawPkgJson = context.getFile('./package.json') ?? '{}';
  const packageJson = JSON.parse(rawPkgJson);

  if (packageJson.scripts && packageJson.scripts.build) {
    const buildScript = packageJson.scripts.build;

    const pattern = /(webpack.+-c\s.+\.ts)\s(.+)/;

    if (profile && pattern.test(buildScript) && !buildScript.includes('--profile')) {
      packageJson.scripts.build = buildScript.replace(pattern, `$1 --profile $2`);
    }

    context.updateFile('./package.json', JSON.stringify(packageJson, null, 2));
  }

  if (!skipBackup && context.doesFileExist('./src/README.md')) {
    context.deleteFile('./src/README.md');
  }

  if (!context.doesFileExist('./src/foo.json')) {
    context.addFile('./src/foo.json', JSON.stringify({ foo: 'bar' }));
  }

  if (context.doesFileExist('.eslintrc')) {
    context.renameFile('.eslintrc', '.eslint.config.json');
  }

  context.readDir('./src');

  return context;
}
