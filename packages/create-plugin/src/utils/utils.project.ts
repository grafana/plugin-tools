import { findUpSync } from '@libs/find-up';
import fs from 'node:fs';
import path from 'node:path';

// Every project scaffolded by create-plugin has a root config file holding the create-plugin version.
const PROJECT_ROOT_MARKER = path.join('.config', '.cprc.json');

export interface PluginEntry {
  // Path of the plugin directory relative to the project root ('.' for a single plugin).
  dir: string;
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

/**
 * Resolves the layout of the project `cwd` belongs to.
 * Falls back to `cwd` as the project root for plugins that predate `.config/.cprc.json`.
 */
export function resolveProject(cwd: string = process.cwd()): ProjectLayout {
  const root = findProjectRoot(cwd) ?? cwd;

  return {
    root,
    kind: 'single',
    plugins: [{ dir: '.' }],
  };
}

export interface GenerateLocationCheck {
  // Set when a new plugin must not be generated in this location.
  error?: { title: string; body: string[] };
  // The create-plugin project the new plugin would be added to, if any.
  project?: ProjectLayout;
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

  return { project: resolveProject(workspaceRoot) };
}
