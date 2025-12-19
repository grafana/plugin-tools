import path from 'node:path';
import fs from 'node:fs';
import { parseFile } from '../parser.js';
import { walk } from './ast.js';

interface PluginJson {
  id: string;
  type: string;
  info: {
    version: string;
  };
  name: string;
}

let cachedPluginJson: PluginJson | null = null;

export function getPluginJson(dir?: string) {
  if (cachedPluginJson) {
    return cachedPluginJson;
  }

  const srcPath = dir ? path.join(dir, 'dist') : path.join(process.cwd(), 'dist');
  const pluginJsonPath = path.join(srcPath, 'plugin.json');
  cachedPluginJson = readJsonFile(pluginJsonPath);
  return cachedPluginJson;
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

export function hasExternalisedJsxRuntime(): boolean {
  const webpackConfigPathsToCheck = ['webpack.config.ts', '.config/webpack/webpack.config.ts'];
  let found = false;
  for (const webpackConfigPath of webpackConfigPathsToCheck) {
    if (isFile(path.join(process.cwd(), webpackConfigPath))) {
      const webpackConfig = fs.readFileSync(path.join(process.cwd(), webpackConfigPath)).toString();
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
  return found;
}
