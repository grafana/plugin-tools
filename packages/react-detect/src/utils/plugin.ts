import path from 'node:path';
import fs from 'node:fs';
import { parseFile } from '../parser.js';
import { walk } from './ast.js';

export function getPluginJson(distDir: string) {
  const pluginJsonPath = path.join(distDir, 'plugin.json');
  return readJsonFile(pluginJsonPath);
}

function isFile(path: string) {
  try {
    return fs.lstatSync(path).isFile();
  } catch (e) {
    return false;
  }
}

export function readJsonFile(filename: string) {
  if (!isFile(filename)) {
    throw new Error(
      `There is no "${path.basename(
        filename
      )}" file found at "${filename}". Make sure you run this command from a plugins root directory.`
    );
  }

  try {
    return JSON.parse(fs.readFileSync(filename).toString());
  } catch (error: unknown) {
    throw new Error(`Failed to load json file ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function hasExternalisedJsxRuntime(pluginRoot: string): boolean {
  const webpackConfigPathsToCheck = ['webpack.config.ts', '.config/webpack/webpack.config.ts'];
  const bundlerExternalPathsToCheck = ['.config/bundler/externals.ts'];
  let found = false;
  for (const webpackConfigPath of webpackConfigPathsToCheck) {
    if (isFile(path.join(pluginRoot, webpackConfigPath))) {
      const webpackConfig = fs.readFileSync(path.join(pluginRoot, webpackConfigPath)).toString();
      const webpackConfigAst = parseFile(webpackConfig, webpackConfigPath);

      walk(webpackConfigAst, (node) => {
        // check for 'react/jsx-runtime' in externals: [array]
        if (
          node.type === 'Property' &&
          node.key.type === 'Identifier' &&
          node.key.name === 'externals' &&
          node.value.type === 'ArrayExpression'
        ) {
          for (const element of node.value.elements) {
            if (
              element &&
              element.type === 'Literal' &&
              typeof element.value === 'string' &&
              element.value.includes('react/jsx-runtime')
            ) {
              found = true;
            }
          }
        }
      });
    }
  }
  for (const bundlerExternalPath of bundlerExternalPathsToCheck) {
    if (isFile(path.join(pluginRoot, bundlerExternalPath))) {
      const bundlerExternals = fs.readFileSync(path.join(pluginRoot, bundlerExternalPath)).toString();
      const bundlerExternalsAst = parseFile(bundlerExternals, bundlerExternalPath);

      walk(bundlerExternalsAst, (node) => {
        // check for 'react/jsx-runtime' in variable array declaration
        if (
          node.type === 'VariableDeclarator' &&
          node.id.type === 'Identifier' &&
          node.id.name === 'externals' &&
          node.init?.type === 'ArrayExpression'
        ) {
          for (const element of node.init.elements) {
            if (
              element &&
              element.type === 'Literal' &&
              typeof element.value === 'string' &&
              element.value.includes('react/jsx-runtime')
            ) {
              found = true;
            }
          }
        }
      });
    }
  }

  return found;
}
