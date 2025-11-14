import * as v from 'valibot';
import type { Context } from '../../context.js';

/**
 * Example migration with Valibot schema
 * Migrations can accept validated and typed options from CLI
 */
export const schema = v.object({
  profile: v.optional(v.boolean(), false),
  skipBackup: v.optional(v.boolean(), false),
  verbose: v.optional(v.boolean(), false),
});

// Type is automatically inferred from the schema
type MigrateOptions = v.InferOutput<typeof schema>;

export default function migrate(context: Context, options: MigrateOptions): Context {
  const { profile, skipBackup, verbose } = options;

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
