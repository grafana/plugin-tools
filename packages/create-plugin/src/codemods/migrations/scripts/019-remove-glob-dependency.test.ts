import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import migrate from './019-remove-glob-dependency.js';
import { createDefaultContext } from '../../test-utils.js';

const BUNDLER_UTILS_PATH = '.config/bundler/utils.ts';
const WEBPACK_UTILS_PATH = '.config/webpack/utils.ts';

const CURRENT_UTILS = readFileSync(
  new URL('../../../../templates/common/.config/bundler/utils.ts', import.meta.url),
  'utf-8'
);

const NEW_GLOB_IMPORT = "import { glob } from 'node:fs/promises';";
const CONSTANTS_IMPORT = "import { SOURCE_DIR } from './constants.ts';";

// The migration appends the new import after the existing ones, so it lands below the constants import.
const MIGRATED_UTILS = CURRENT_UTILS.replace(`${NEW_GLOB_IMPORT}\n`, '').replace(
  CONSTANTS_IMPORT,
  `${CONSTANTS_IMPORT}\n${NEW_GLOB_IMPORT}`
);

// The template's utils.ts as scaffolded before the glob package was removed.
const SCAFFOLDED_UTILS = CURRENT_UTILS.replace(
  "import { glob } from 'node:fs/promises';",
  "import { glob } from 'glob';"
).replace(
  /export async function getEntries\(\) \{[\s\S]*?\n {2}return plugins\.reduce/,
  `export async function getEntries() {
  const pluginsJson = await glob('**/src/**/plugin.json', { absolute: true });

  const plugins = await Promise.all(
    pluginsJson.map((pluginJson) => {
      const folder = path.dirname(pluginJson);
      return glob(\`\${folder}/module.{ts,tsx,js,jsx}\`, { absolute: true });
    })
  );

  return plugins.reduce`
);

function createContextWithGlob(utilsPath = BUNDLER_UTILS_PATH, utilsContent = SCAFFOLDED_UTILS) {
  const context = createDefaultContext();
  context.addFile(utilsPath, utilsContent);
  context.updateFile(
    'package.json',
    JSON.stringify({ devDependencies: { '@grafana/tsconfig': '^2.0.1', glob: '^11.1.0' } }, null, 2)
  );

  return context;
}

function getDevDependencies(context: ReturnType<typeof createDefaultContext>) {
  return JSON.parse(context.getFile('package.json') ?? '{}').devDependencies;
}

describe('Migration - remove glob dependency', () => {
  it('should be idempotent', async () => {
    const context = createContextWithGlob();

    await expect(migrate).toBeIdempotent(context);
  });

  it('should migrate the scaffolded utils to the current template', () => {
    const context = migrate(createContextWithGlob());

    expect(context.getFile(BUNDLER_UTILS_PATH)).toBe(MIGRATED_UTILS);
  });

  it('should migrate the legacy webpack utils location', () => {
    const context = migrate(createContextWithGlob(WEBPACK_UTILS_PATH));

    expect(context.getFile(WEBPACK_UTILS_PATH)).toBe(MIGRATED_UTILS);
  });

  it('should remove glob from package.json', () => {
    const context = migrate(createContextWithGlob());

    expect(getDevDependencies(context)).toEqual({ '@grafana/tsconfig': '^2.0.1' });
  });

  it('should migrate a customised getEntries that calls glob', () => {
    const customisedUtils = SCAFFOLDED_UTILS.replace(
      '{ absolute: true });\n\n  const plugins',
      "{ absolute: true, ignore: ['node_modules/**'] });\n\n  const plugins"
    );
    const context = migrate(createContextWithGlob(BUNDLER_UTILS_PATH, customisedUtils));

    expect(context.getFile(BUNDLER_UTILS_PATH)).toBe(MIGRATED_UTILS);
  });

  it('should skip a getEntries that does not call glob', () => {
    const noGlobCallUtils = SCAFFOLDED_UTILS.replace(
      "const pluginsJson = await glob('**/src/**/plugin.json', { absolute: true });",
      "const pluginsJson = ['src/plugin.json'];"
    ).replace('return glob(', 'return Promise.resolve(');
    const context = createContextWithGlob(BUNDLER_UTILS_PATH, noGlobCallUtils);

    migrate(context);

    expect(context.getFile(BUNDLER_UTILS_PATH)).toBe(noGlobCallUtils);
    expect(getDevDependencies(context).glob).toBe('^11.1.0');
  });

  it('should skip an aliased glob import', () => {
    const aliasedUtils = SCAFFOLDED_UTILS.replace("import { glob } from 'glob';", "import { glob as g } from 'glob';")
      .replaceAll('await glob(', 'await g(')
      .replace('return glob(', 'return g(');
    const context = createContextWithGlob(BUNDLER_UTILS_PATH, aliasedUtils);

    migrate(context);

    expect(context.getFile(BUNDLER_UTILS_PATH)).toBe(aliasedUtils);
    expect(getDevDependencies(context).glob).toBe('^11.1.0');
  });

  it('should keep other glob specifiers and the dependency', () => {
    const mixedUtils = SCAFFOLDED_UTILS.replace(
      "import { glob } from 'glob';",
      "import { glob, globSync } from 'glob';"
    );
    const context = migrate(createContextWithGlob(BUNDLER_UTILS_PATH, mixedUtils));
    const migrated = context.getFile(BUNDLER_UTILS_PATH);

    expect(migrated).toContain("import { globSync } from 'glob';");
    expect(migrated).toContain("import { glob } from 'node:fs/promises';");
    expect(migrated).toContain("for await (const pluginJson of glob('**/src/**/plugin.json'))");
    expect(getDevDependencies(context).glob).toBe('^11.1.0');
  });

  it('should leave files without a glob import unchanged', () => {
    const context = createContextWithGlob(BUNDLER_UTILS_PATH, CURRENT_UTILS);

    migrate(context);

    expect(context.getFile(BUNDLER_UTILS_PATH)).toBe(CURRENT_UTILS);
    expect(getDevDependencies(context).glob).toBe('^11.1.0');
  });

  it('should not fail when the utils file cannot be parsed', () => {
    const context = createContextWithGlob(BUNDLER_UTILS_PATH, "import { glob } from 'glob';\nexport function {");

    expect(() => migrate(context)).not.toThrow();
    expect(getDevDependencies(context).glob).toBe('^11.1.0');
  });
});
