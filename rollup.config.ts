import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inspect } from 'node:util';
import { defineConfig, RollupOptions } from 'rollup';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

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
    ],
  },
];

if (pkg.types) {
  defaultOptions.push({
    input,
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
  const relativePath = filePath.replace('dist', '').replace(/\.js$/, '.ts');
  return join(preserveModulesRoot, relativePath);
}
