import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { glob, GlobOptions } from 'glob';
import { readFileSync } from 'node:fs';
import { chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { inspect } from 'node:util';
import { defineConfig, ExternalOption, Plugin, RollupOptions } from 'rollup';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

const projectRoot = process.cwd();
const tsconfigPath = join(projectRoot, 'tsconfig.json');
const packageJsonPath = join(projectRoot, 'package.json');
const preserveModulesRoot = join(projectRoot, 'src');

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const input: string[] = [];
const external: ExternalOption = [];
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
  const codeModsGlobOptions: GlobOptions = {
    cwd: join(preserveModulesRoot, 'codemods'),
    ignore: ['**/*.test.ts'],
    absolute: true,
  };
  const codeMods = glob.sync('{migrations,additions}/scripts/*.ts', codeModsGlobOptions).map((m) => m.toString());
  input.push(...codeMods);

  external.push('prettier');
  external.push(/^recast\/parsers\//);
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
      nodeResolve({
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
