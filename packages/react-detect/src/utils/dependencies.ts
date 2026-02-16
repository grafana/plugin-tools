import { join } from 'node:path';
import {
  parsePnpmProject,
  parseNpmLockV2Project,
  parseYarnLockV1Project,
  parseYarnLockV2Project,
} from 'snyk-nodejs-lockfile-parser';
import { getLockFilePath } from 'pm-detect';
import type { DepGraph } from '@snyk/dep-graph';
import { readFileSync } from 'node:fs';
import { readJsonFile } from './plugin.js';

export class DependencyContext {
  private dependencies: Map<string, string> = new Map();
  private devDependencies: Map<string, string> = new Map();
  private depGraph: DepGraph | null = null;

  async loadDependencies(pluginRoot = process.cwd()): Promise<void> {
    // traverse up the directory tree to find the lockfile and package.json
    const lockfile = getLockFilePath(pluginRoot);
    const packageJsonPath = join(pluginRoot, 'package.json');

    if (lockfile) {
      const pkgJsonContent = readJsonFile(packageJsonPath);
      const lockfileContent = readFileSync(lockfile, 'utf8');
      const pkgJsonContentString = JSON.stringify(pkgJsonContent);
      if (lockfile.endsWith('pnpm-lock.yaml')) {
        this.depGraph = await parsePnpmProject(pkgJsonContentString, lockfileContent, {
          includeDevDeps: true,
          includeOptionalDeps: true,
          strictOutOfSync: false,
          pruneWithinTopLevelDeps: false,
        });
      } else if (lockfile.endsWith('package-lock.json')) {
        this.depGraph = await parseNpmLockV2Project(pkgJsonContentString, lockfileContent, {
          includeDevDeps: true,
          includeOptionalDeps: true,
          strictOutOfSync: false,
          pruneCycles: false,
        });
      } else if (lockfile.endsWith('yarn.lock')) {
        if (/#\s*yarn lockfile v1/i.test(lockfileContent)) {
          this.depGraph = await parseYarnLockV1Project(pkgJsonContentString, lockfileContent, {
            includeDevDeps: true,
            includeOptionalDeps: true,
            includePeerDeps: true,
            strictOutOfSync: false,
            pruneLevel: 'withinTopLevelDeps',
          });
        } else {
          this.depGraph = await parseYarnLockV2Project(pkgJsonContentString, lockfileContent, {
            includeDevDeps: true,
            includeOptionalDeps: true,
            strictOutOfSync: false,
            pruneWithinTopLevelDeps: true,
          });
        }
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
