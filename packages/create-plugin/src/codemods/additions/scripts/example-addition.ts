import * as v from 'valibot';
import type { Context } from '../../context.js';
import { addToolingDependencies, forEachPlugin } from '../../utils.project.js';

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

  // Tooling dependencies live in the root package.json, shared by every plugin in a monorepo.
  addToolingDependencies(context, { '@types/node': '^20.0.0' });

  // Per-plugin files go through forEachPlugin so the addition works for a single plugin and in a monorepo.
  forEachPlugin(context, (_plugin, resolvePath) => {
    const packageJsonPath = resolvePath('package.json');
    const packageJson = JSON.parse(context.getFile(packageJsonPath) ?? '{}');

    if (packageJson.scripts && !packageJson.scripts['example-script']) {
      packageJson.scripts['example-script'] = `echo "Running ${featureName}"`;
      context.updateFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    const featurePath = resolvePath(`src/features/${featureName}.ts`);
    if (!context.doesFileExist(featurePath)) {
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
      context.addFile(featurePath, featureCode);
    }

    if (context.doesFileExist(resolvePath('src/deprecated.ts'))) {
      context.deleteFile(resolvePath('src/deprecated.ts'));
    }

    if (context.doesFileExist(resolvePath('src/old-config.json'))) {
      context.renameFile(resolvePath('src/old-config.json'), resolvePath('src/new-config.json'));
    }
  });

  return context;
}
