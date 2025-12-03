import { join } from 'node:path';
import { parsePnpmProject, parseNpmLockV2Project, parseYarnLockV2Project } from 'snyk-nodejs-lockfile-parser';
import type { DepGraph } from '@snyk/dep-graph';
import { existsSync, readFileSync } from 'node:fs';
import { readJsonFile } from './plugin.js';

export class DependencyContext {
  private dependencies: Map<string, string> = new Map();
  private devDependencies: Map<string, string> = new Map();
  private depGraph: DepGraph | null = null;

  async loadDependencies(pluginRoot = process.cwd()): Promise<void> {
    const lockfile = this.findLockfile(pluginRoot);
    const packageJsonPath = join(pluginRoot, 'package.json');

    if (lockfile) {
      const pkgJsonContent = readJsonFile(packageJsonPath);
      const lockfileContent = readFileSync(join(pluginRoot, lockfile), 'utf8');
      const pkgJsonContentString = JSON.stringify(pkgJsonContent);
      if (lockfile === 'pnpm-lock.yaml') {
        this.depGraph = await parsePnpmProject(pkgJsonContentString, lockfileContent, {
          includeDevDeps: true,
          includeOptionalDeps: true,
          strictOutOfSync: false,
          pruneWithinTopLevelDeps: false,
        });
      } else if (lockfile === 'package-lock.json') {
        this.depGraph = await parseNpmLockV2Project(pkgJsonContentString, lockfileContent, {
          includeDevDeps: true,
          includeOptionalDeps: true,
          strictOutOfSync: false,
          pruneCycles: false,
        });
      } else if (lockfile === 'yarn.lock') {
        this.depGraph = await parseYarnLockV2Project(pkgJsonContentString, lockfileContent, {
          includeDevDeps: true,
          includeOptionalDeps: true,
          strictOutOfSync: false,
          pruneWithinTopLevelDeps: true,
        });
      }

      if (pkgJsonContent.dependencies) {
        Object.entries(pkgJsonContent.dependencies).forEach(([name, version]) => {
          this.dependencies.set(name, version as string);
        });
      }
      if (pkgJsonContent.devDependencies) {
        Object.entries(pkgJsonContent.devDependencies).forEach(([name, version]) => {
          this.devDependencies.set(name, version as string);
        });
      }
    } else {
      throw new Error(`No lockfile found in ${pluginRoot}`);
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
    if (this.isDirect(packageName)) {
      return packageName;
    }

    if (this.depGraph) {
      try {
        const pkgs = this.depGraph.getPkgs().filter((p) => p.name === packageName);

        if (pkgs.length > 0) {
          const paths = this.depGraph.pkgPathsToRoot(pkgs[0]);

          if (paths.length > 0 && paths[0].length > 1) {
            return paths[0][paths[0].length - 2].name;
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    return packageName;
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

export const GRAFANA_EXTERNALS = [
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
