import { findUpSync } from '@libs/find-up';
import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

// Every project scaffolded by create-plugin has a root config file holding the create-plugin version.
const PROJECT_ROOT_MARKER = path.join('.config', '.cprc.json');

export interface PluginEntry {
  // Path of the plugin directory relative to the project root ('.' for a single plugin).
  dir: string;
  // The plugin id from src/plugin.json, when it can be read.
  id?: string;
}

export interface ProjectLayout {
  root: string;
  kind: 'single' | 'monorepo';
  plugins: PluginEntry[];
}

/**
 * Walks up from `cwd` to find the directory that contains `.config/.cprc.json`.
 */
export function findProjectRoot(cwd: string = process.cwd()): string | undefined {
  const markerPath = findUpSync(PROJECT_ROOT_MARKER, { cwd });

  if (!markerPath) {
    return undefined;
  }

  return path.dirname(path.dirname(markerPath));
}

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return undefined;
  }
}

function readPluginId(pluginDir: string): string | undefined {
  const pluginJson = readJson(path.join(pluginDir, 'src', 'plugin.json'));
  if (pluginJson && typeof pluginJson === 'object' && 'id' in pluginJson && typeof pluginJson.id === 'string') {
    return pluginJson.id;
  }
  return undefined;
}

function toGlobList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

/**
 * Reads the workspace globs declared at `root`: the package.json "workspaces" field (array or yarn's
 * `{ packages }` form), or the "packages" list in pnpm-workspace.yaml.
 */
export function getWorkspaceGlobs(root: string): string[] {
  const packageJson = readJson(path.join(root, 'package.json'));
  if (packageJson && typeof packageJson === 'object' && 'workspaces' in packageJson) {
    const { workspaces } = packageJson;
    if (workspaces && typeof workspaces === 'object' && 'packages' in workspaces) {
      return toGlobList(workspaces.packages);
    }
    return toGlobList(workspaces);
  }

  const pnpmWorkspacePath = path.join(root, 'pnpm-workspace.yaml');
  if (fs.existsSync(pnpmWorkspacePath)) {
    try {
      const pnpmWorkspace: unknown = parseYaml(fs.readFileSync(pnpmWorkspacePath, 'utf-8'));
      if (pnpmWorkspace && typeof pnpmWorkspace === 'object' && 'packages' in pnpmWorkspace) {
        return toGlobList(pnpmWorkspace.packages);
      }
    } catch {
      return [];
    }
  }

  return [];
}

// Workspaces that hold a plugin (a src/plugin.json), relative to `root` and sorted for a stable order.
function findWorkspacePlugins(root: string): PluginEntry[] {
  const patterns = getWorkspaceGlobs(root).filter((pattern) => !pattern.startsWith('!'));
  if (patterns.length === 0) {
    return [];
  }

  const workspaceDirs = glob.sync(patterns, { cwd: root, ignore: ['**/node_modules/**'] });

  return [...new Set(workspaceDirs)]
    .map((dir) => path.normalize(dir))
    .filter((dir) => fs.existsSync(path.join(root, dir, 'src', 'plugin.json')))
    .sort()
    .map((dir) => ({ dir, id: readPluginId(path.join(root, dir)) }));
}

/**
 * Resolves the layout of the project `cwd` belongs to.
 * A project root without its own src/plugin.json whose workspaces contain plugins is a monorepo.
 * Falls back to `cwd` as the project root for plugins that predate `.config/.cprc.json`.
 */
export function resolveProject(cwd: string = process.cwd()): ProjectLayout {
  const root = findProjectRoot(cwd) ?? cwd;

  if (!fs.existsSync(path.join(root, 'src', 'plugin.json'))) {
    const plugins = findWorkspacePlugins(root);
    if (plugins.length > 0) {
      return { root, kind: 'monorepo', plugins };
    }
  }

  return {
    root,
    kind: 'single',
    plugins: [{ dir: '.', id: readPluginId(root) }],
  };
}

export interface GenerateLocationCheck {
  // Set when a new plugin must not be generated in this location.
  error?: { title: string; body: string[] };
  // The root of the create-plugin monorepo the new plugin is added to, if any.
  monorepoRoot?: string;
}

function declaresWorkspaces(dir: string): boolean {
  if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
    return true;
  }

  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.workspaces !== undefined;
  } catch {
    return false;
  }
}

/**
 * Walks up from `cwd` to the nearest directory that declares workspaces
 * (a `workspaces` field in package.json, or a pnpm-workspace.yaml).
 */
export function findWorkspaceRoot(cwd: string = process.cwd()): string | undefined {
  let currentDir = path.resolve(cwd);

  while (true) {
    if (declaresWorkspaces(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }
    currentDir = parentDir;
  }
}

/**
 * Checks whether a new plugin can be generated in `cwd`. Generating inside an existing plugin, or inside a
 * workspace that create-plugin did not scaffold, has never been supported.
 */
export function checkGenerateLocation(cwd: string = process.cwd()): GenerateLocationCheck {
  const pluginJsonPath = findUpSync(path.join('src', 'plugin.json'), { cwd });
  if (pluginJsonPath) {
    return {
      error: {
        title: 'You are already inside a plugin.',
        body: [
          `Found ${pluginJsonPath}.`,
          'Run this command from the directory where the new plugin folder should be created.',
        ],
      },
    };
  }

  const workspaceRoot = findWorkspaceRoot(cwd);
  if (!workspaceRoot) {
    return {};
  }

  if (!fs.existsSync(path.join(workspaceRoot, PROJECT_ROOT_MARKER))) {
    return {
      error: {
        title: 'Generating a plugin inside this workspace is not supported.',
        body: [
          `${workspaceRoot} declares workspaces but was not scaffolded by create-plugin.`,
          'Run this command outside the workspace, or in a monorepo created by create-plugin.',
        ],
      },
    };
  }

  // Single plugins (with a src/plugin.json) were caught above, so this is a create-plugin monorepo root.
  return { monorepoRoot: workspaceRoot };
}
