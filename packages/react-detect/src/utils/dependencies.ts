import { join } from 'node:path';
import { buildDepTreeFromFiles, PkgTree } from 'snyk-nodejs-lockfile-parser';
import { readJsonFile } from './plugin.js';
import { existsSync } from 'node:fs';

export class DependencyContext {
  private dependencies: Map<string, string> = new Map();
  private devDependencies: Map<string, string> = new Map();
  private depTree: PkgTree | null = null;

  async loadDependencies(pluginRoot: string): Promise<void> {
    const packageJsonPath = join(pluginRoot, 'package.json');

    // Still load direct dependencies for quick lookups
    try {
      const json = readJsonFile(packageJsonPath);

      if (json.dependencies) {
        Object.entries(json.dependencies).forEach(([name, version]) => {
          this.dependencies.set(name, version as string);
        });
      }

      if (json.devDependencies) {
        Object.entries(json.devDependencies).forEach(([name, version]) => {
          this.devDependencies.set(name, version as string);
        });
      }
    } catch (error) {
      throw new Error(`Failed to load package.json: ${error}`);
    }

    // Find and parse lock file
    const lockfile = this.findLockfile(pluginRoot);
    if (lockfile) {
      try {
        this.depTree = await buildDepTreeFromFiles(
          pluginRoot,
          'package.json',
          lockfile,
          true // Include devDependencies to trace their transitive deps
        );
      } catch (error) {
        console.warn('Could not build dependency tree:', error);
      }
    }
  }

  private findLockfile(pluginRoot: string): string | null {
    const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];

    for (const lockfile of lockfiles) {
      if (existsSync(join(pluginRoot, lockfile))) {
        return lockfile;
      }
    }

    return null;
  }

  findRootDependency(packageName: string): string {
    // If it's direct, return it
    if (this.isDirect(packageName)) {
      return packageName;
    }

    // Search dep tree for the package
    // Start from direct dependencies, not root
    if (this.depTree && this.depTree.dependencies) {
      for (const [depName, child] of Object.entries(this.depTree.dependencies)) {
        const found = this.findInDepTree(child, packageName, depName);
        if (found) {
          return found;
        }
      }
    }

    // Fallback
    return packageName;
  }

  /**
   * Recursively search dep tree to find which direct dependency contains this package
   */
  private findInDepTree(node: any, packageName: string, rootDep?: string): string | null {
    // Track the root dependency (top-level)
    const currentRoot = rootDep || node.name;

    // Check if this node is the package we're looking for
    if (node.name === packageName) {
      return currentRoot;
    }

    // Search children
    if (node.dependencies) {
      for (const child of Object.values(node.dependencies)) {
        const found = this.findInDepTree(child, packageName, currentRoot);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  isDirect(packageName: string): boolean {
    return this.dependencies.has(packageName) || this.devDependencies.has(packageName);
  }

  getVersion(packageName: string): string | undefined {
    return this.dependencies.get(packageName) || this.devDependencies.get(packageName);
  }

  getAllDependencies(): Map<string, string> {
    return new Map([...this.dependencies, ...this.devDependencies]);
  }
}

const GRAFANA_EXTERNALS = [
  '@emotion/css',
  '@emotion/react',
  '@grafana/data',
  '@grafana/runtime',
  '@grafana/slate-react',
  '@grafana/ui',
  'angular',
  'd3',
  'emotion',
  'i18next',
  'jquery',
  'lodash',
  'moment',
  'prismjs',
  'react-dom',
  'react-redux',
  'react-router-dom',
  'react-router',
  'react',
  'redux',
  'rxjs',
  'slate-plain-serializer',
  'slate',
];

/**
 * Check if a package is externalized by Grafana
 */
export function isExternal(packageName: string): boolean {
  // Direct match
  if (GRAFANA_EXTERNALS.includes(packageName)) {
    return true;
  }

  return GRAFANA_EXTERNALS.some((external) => packageName.startsWith(external + '/'));
}
