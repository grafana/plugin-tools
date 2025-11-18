import fs from 'fs';
import path from 'path';
import type { DependencyInfo } from '../types.js';

/**
 * Resolves package names from source maps back to package.json dependencies
 * Handles both direct and transitive dependencies
 */
export class DependencyResolver {
  private pluginRoot: string;
  private packageJson: any = null;
  private dependencies: Map<string, DependencyInfo> = new Map();

  constructor(pluginRoot: string) {
    this.pluginRoot = pluginRoot;
    this.loadPackageJson();
  }

  /**
   * Load and parse package.json from the plugin root
   */
  private loadPackageJson(): void {
    const packageJsonPath = path.join(this.pluginRoot, 'package.json');

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf8');
      this.packageJson = JSON.parse(content);
      this.buildDependencyMap();
    } catch (error) {
      console.error(`Failed to load package.json from ${packageJsonPath}:`, (error as Error).message);
    }
  }

  /**
   * Build a map of all dependencies from package.json
   */
  private buildDependencyMap(): void {
    if (!this.packageJson) {
      return;
    }

    // Process dependencies
    const deps = this.packageJson.dependencies || {};
    for (const [name, version] of Object.entries(deps)) {
      this.dependencies.set(name, {
        name,
        version: version as string,
        isDirect: true,
      });
    }

    // Process devDependencies (they can also be bundled)
    const devDeps = this.packageJson.devDependencies || {};
    for (const [name, version] of Object.entries(devDeps)) {
      if (!this.dependencies.has(name)) {
        this.dependencies.set(name, {
          name,
          version: version as string,
          isDirect: true,
        });
      }
    }
  }

  /**
   * Find the root dependency that caused a package to be bundled
   *
   * For direct dependencies, returns the package itself.
   * For transitive dependencies, attempts to find the parent dependency.
   *
   * @param packageName The package found in node_modules
   * @returns Root dependency name or null if not found
   */
  findRootDependency(packageName: string): string | null {
    // Check if this is a direct dependency
    if (this.dependencies.has(packageName)) {
      return packageName;
    }

    // For transitive dependencies, we'd need to parse lock files
    // For MVP, we'll return the package name itself and mark it as transitive
    // TODO: Implement lock file parsing for yarn.lock / package-lock.json

    // Check if the package exists in node_modules at all
    const packagePath = path.join(this.pluginRoot, 'node_modules', packageName);
    if (fs.existsSync(packagePath)) {
      return packageName; // Return as-is, we know it's bundled but may be transitive
    }

    return null;
  }

  /**
   * Get dependency info for a package
   *
   * @param packageName Package name
   * @returns Dependency info or null if not found
   */
  getDependencyInfo(packageName: string): DependencyInfo | null {
    return this.dependencies.get(packageName) || null;
  }

  /**
   * Check if a package is a direct dependency (vs transitive)
   *
   * @param packageName Package name
   * @returns True if this is a direct dependency
   */
  isDirectDependency(packageName: string): boolean {
    return this.dependencies.has(packageName);
  }

  /**
   * Get all direct dependencies from package.json
   */
  getAllDependencies(): DependencyInfo[] {
    return Array.from(this.dependencies.values());
  }

  /**
   * Get the version of a dependency from package.json
   *
   * @param packageName Package name
   * @returns Version string or null if not found
   */
  getDependencyVersion(packageName: string): string | null {
    const info = this.dependencies.get(packageName);
    return info ? info.version : null;
  }
}
