import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import { glob, GlobOptions } from 'glob';
import { readFileSync } from 'node:fs';
import { chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { inspect } from 'node:util';
import { defineConfig, Plugin, RollupOptions } from 'rollup';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import html from '@rollup/plugin-html';
import css from 'rollup-plugin-css-only';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

const projectRoot = process.cwd();
const tsconfigPath = join(projectRoot, 'tsconfig.json');
const packageJsonPath = join(projectRoot, 'package.json');
const preserveModulesRoot = join(projectRoot, 'src');

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const input: string[] = [];
const external: string[] = [];
if (pkg.bin) {
  input.push(getSourceFilePath(pkg.bin));
}
if (pkg.main) {
  input.push(getSourceFilePath(pkg.main));
}

// TODO: Remove this once we have a better way to extend this config
if (pkg.name === '@grafana/plugin-e2e') {
  input.push(join(preserveModulesRoot, 'auth', 'auth.setup.ts'));
}

// TODO: Remove this once we have a better way to extend this config
if (pkg.name === '@grafana/create-plugin') {
  const globOptions: GlobOptions = {
    cwd: join(preserveModulesRoot, 'migrations', 'scripts'),
    ignore: ['**/*.test.ts'],
    absolute: true,
  };
  const migrations = glob.sync('**/*.ts', globOptions).map((m) => m.toString());
  input.push(...migrations);
  external.push('prettier');
}

if (pkg.dependencies) {
  external.push(...Object.keys(pkg.dependencies));
}
if (pkg.peerDependencies) {
  external.push(...Object.keys(pkg.peerDependencies));
}

const defaultOptions: Array<Partial<RollupOptions>> = [
  {
    input,
    output: {
      dir: 'dist',
      format: pkg.type === 'module' ? 'esm' : 'cjs',
      entryFileNames: '[name].js',
      preserveModules: true,
      preserveModulesRoot,
    },
    external,
    plugins: [
      del({ targets: join(projectRoot, 'dist/*') }),
      pkg.type !== 'module' && commonjs(),
      resolve({
        preferBuiltins: true,
      }),
      json(),
      esbuild({
        target: 'es2020',
        tsconfig: tsconfigPath,
      }),
      shebang(),
    ],
  },
];

if (pkg.types) {
  defaultOptions.push({
    input: getSourceFilePath(pkg.types),
    output: {
      file: pkg.types,
      format: pkg.type === 'module' ? 'esm' : 'cjs',
    },
    plugins: [
      dts({
        tsconfig: tsconfigPath,
      }),
    ],
  });
}

// Add the ui static build to options
if (pkg.name === '@grafana/create-plugin') {
  defaultOptions.push({
    input: [join(preserveModulesRoot, 'ui', 'static', 'main.ts')],
    output: {
      dir: join(projectRoot, 'dist', 'ui', 'static'),
      format: 'esm',
    },
    plugins: [
      svelte({
        include: 'src/ui/static/**/*.svelte',
        preprocess: sveltePreprocess({
          typescript: {
            tsconfigFile: join(preserveModulesRoot, '..', 'tsconfig.ui.json'),
          },
        }),

        compilerOptions: {
          dev: true,
        },
      }),
      css({
        output: 'main.css',
      }),
      html({
        title: 'Create Plugin - Update',
      }),
      resolve({
        browser: true,
        exportConditions: ['svelte'],
        extensions: ['.svelte'],
        dedupe: ['svelte'],
      }),
      esbuild({
        target: 'es2020',
        tsconfig: join(preserveModulesRoot, '..', 'tsconfig.ui.json'),
      }),
    ],
  });
}

if (process.env.DEBUG_ROLLUP_CONFIG) {
  console.log(inspect(defaultOptions, { depth: null, colors: true }));
}

export default defineConfig(defaultOptions);

function getSourceFilePath(filePath: string) {
  let relativePath = filePath.replace('dist\/', '');
  if (relativePath.endsWith('.d.ts')) {
    relativePath = relativePath.replace(/\.d\.ts$/, '.ts');
  } else if (relativePath.endsWith('.js')) {
    relativePath = relativePath.replace(/\.js$/, '.ts');
  }

  return join(preserveModulesRoot, relativePath);
}

// Make files with a shebang executable
function shebang(): Plugin {
  return {
    name: 'shebang',
    async writeBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && /\.(cjs|js|mjs)$/.test(fileName) && chunk.code.startsWith('#!')) {
          const filePath = options.dir ? `${options.dir}/${fileName}` : fileName;
          await chmod(filePath, 0o755);
        }
      }
    },
  };
}
