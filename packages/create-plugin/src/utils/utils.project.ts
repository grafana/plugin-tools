import { findUpSync } from '@libs/find-up';
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
