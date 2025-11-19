import * as v from 'valibot';
import type { Context } from '../../context.js';
import { addDependenciesToPackageJson } from '../../utils.js';

/**
 * Example addition demonstrating Valibot schema with type inference
 * Schema defines validation rules, defaults and types are automatically inferred
 */
export const schema = v.object({
  featureName: v.pipe(
    v.string(),
    v.minLength(3, 'Feature name must be at least 3 characters'),
    v.maxLength(50, 'Feature name must be at most 50 characters')
  ),
  enabled: v.optional(v.boolean(), true),
  port: v.optional(
    v.pipe(v.number(), v.minValue(1000, 'Port must be at least 1000'), v.maxValue(65535, 'Port must be at most 65535'))
  ),
  frameworks: v.optional(v.array(v.string()), ['react']),
});

// Type is automatically inferred from the schema
type ExampleOptions = v.InferOutput<typeof schema>;

export default function exampleAddition(context: Context, options: ExampleOptions): Context {
  // These options have been validated by the framework
  const { featureName, enabled, port, frameworks } = options;

  const rawPkgJson = context.getFile('./package.json') ?? '{}';
  const packageJson = JSON.parse(rawPkgJson);

  if (packageJson.scripts && !packageJson.scripts['example-script']) {
    packageJson.scripts['example-script'] = `echo "Running ${featureName}"`;
    context.updateFile('./package.json', JSON.stringify(packageJson, null, 2));
  }

  addDependenciesToPackageJson(context, {}, { '@types/node': '^20.0.0' });

  if (!context.doesFileExist(`./src/features/${featureName}.ts`)) {
    const featureCode = `export const ${featureName} = {
  name: '${featureName}',
  enabled: ${enabled},
  port: ${port ?? 3000},
  frameworks: ${JSON.stringify(frameworks)},
  init() {
    console.log('${featureName} initialized on port ${port ?? 3000}');
  },
};
`;
    context.addFile(`./src/features/${featureName}.ts`, featureCode);
  }

  if (context.doesFileExist('./src/deprecated.ts')) {
    context.deleteFile('./src/deprecated.ts');
  }

  if (context.doesFileExist('./src/old-config.json')) {
    context.renameFile('./src/old-config.json', './src/new-config.json');
  }

  return context;
}
