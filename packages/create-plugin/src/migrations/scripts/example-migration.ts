import type { Context } from '../context.js';

export default function migrate(context: Context): Context {
  const rawPkgJson = context.getFile('./package.json') ?? '{}';
  const packageJson = JSON.parse(rawPkgJson);

  if (packageJson.scripts && packageJson.scripts.build) {
    const buildScript = packageJson.scripts.build;

    const pattern = /(webpack.+-c\s.+\.ts)\s(.+)/;

    if (pattern.test(buildScript) && !buildScript.includes('--profile')) {
      packageJson.scripts.build = buildScript.replace(pattern, `$1 --profile $2`);
    }

    context.updateFile('./package.json', JSON.stringify(packageJson, null, 2));
  }

  if (context.doesFileExist('./src/README.md')) {
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
