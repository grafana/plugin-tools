import path from 'node:path';
import fs from 'node:fs';

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

  const srcPath = dir || path.join(process.cwd(), 'dist');
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

export function hasTsConfigAutomaticJsx(): boolean {
  const tsConfigPathsToCheck = ['tsconfig.json', '.config/tsconfig.json'];

  for (const tsConfigPath of tsConfigPathsToCheck) {
    const jsxConfig = readJsonFile(path.join(process.cwd(), tsConfigPath));
    const jsx = jsxConfig?.compilerOptions?.jsx;
    if (jsx === 'react-jsx' || jsx === 'react-jsxdev') {
      return true;
    }
  }
  return false;
}

export function hasSwcAutomaticJsx(): boolean {
  const webpackConfigPathsToCheck = ['webpack.config.js', '.config/webpack/webpack.config.js'];
  for (const webpackConfigPath of webpackConfigPathsToCheck) {
    const webpackConfig = fs.readFileSync(path.join(process.cwd(), webpackConfigPath)).toString();
    if (webpackConfig.includes("runtime: 'automatic'")) {
      return true;
    }
  }
  return false;
}
