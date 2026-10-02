import fs from 'fs';
import path from 'path';

// Each plugin is bundled and shipped on its own, so its bundle must not pull in another plugin's code.
// This plugin fails the build when a file in the plugin imports another plugin, or reaches outside the
// plugin by relative path. Shared code belongs in a workspace package imported by name.
// It only uses hooks that webpack and rspack both provide, through the minimal types below.

export type ScopeViolation = 'crossPlugin' | 'outsidePlugin';

interface ResolveData {
  request: string;
  contextInfo: { issuer: string };
  createData: { resource?: string };
}

interface NormalModuleFactory {
  hooks: { afterResolve: { tap(name: string, callback: (resolveData: ResolveData) => void): void } };
}

interface ScopedCompiler {
  hooks: { normalModuleFactory: { tap(name: string, callback: (factory: NormalModuleFactory) => void): void } };
}

const PLUGIN_NAME = 'PluginScopePlugin';
const pluginRootCache = new Map<string, string | undefined>();

function isWithin(target: string, root: string) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isInNodeModules(filePath: string) {
  return filePath.split(path.sep).includes('node_modules');
}

// The nearest directory at or above `startDir` that holds a src/plugin.json.
function findPluginRoot(startDir: string): string | undefined {
  if (pluginRootCache.has(startDir)) {
    return pluginRootCache.get(startDir);
  }

  let currentDir = startDir;
  let pluginRoot: string | undefined;
  while (true) {
    if (fs.existsSync(path.join(currentDir, 'src', 'plugin.json'))) {
      pluginRoot = currentDir;
      break;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  pluginRootCache.set(startDir, pluginRoot);
  return pluginRoot;
}

export function getScopeViolation({
  request,
  issuer,
  resource,
  pluginRoot,
}: {
  request: string;
  issuer?: string;
  resource?: string;
  pluginRoot: string;
}): ScopeViolation | undefined {
  // Only police imports made by the plugin's own files.
  if (!issuer || !resource || isInNodeModules(issuer) || !isWithin(issuer, pluginRoot)) {
    return undefined;
  }

  if (isWithin(resource, pluginRoot) || isInNodeModules(resource)) {
    return undefined;
  }

  const resourcePluginRoot = findPluginRoot(path.dirname(resource));
  if (resourcePluginRoot && resourcePluginRoot !== pluginRoot) {
    return 'crossPlugin';
  }

  // Workspace packages imported by name resolve outside the plugin through their symlink, which is fine.
  const isPathRequest = request.startsWith('.') || path.isAbsolute(request);
  return isPathRequest ? 'outsidePlugin' : undefined;
}

export class PluginScopePlugin {
  private pluginRoot: string;

  constructor({ pluginRoot = process.cwd() }: { pluginRoot?: string } = {}) {
    this.pluginRoot = pluginRoot;
  }

  apply(compiler: ScopedCompiler) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (factory) => {
      factory.hooks.afterResolve.tap(PLUGIN_NAME, (resolveData) => {
        const issuer = resolveData.contextInfo?.issuer;
        const violation = getScopeViolation({
          request: resolveData.request,
          issuer,
          resource: resolveData.createData?.resource,
          pluginRoot: this.pluginRoot,
        });

        if (!violation) {
          return;
        }

        const importer = path.relative(this.pluginRoot, issuer);
        const reason =
          violation === 'crossPlugin'
            ? 'imports code from another plugin. Plugins are bundled separately, so move shared code into a workspace package and depend on it instead.'
            : 'reaches outside this plugin. Import shared code through a workspace package instead of a relative path.';

        throw new Error(`[create-plugin] "${resolveData.request}" in ${importer} ${reason}`);
      });
    });
  }
}
