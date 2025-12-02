import { describe, it, expect, beforeEach, vi } from 'vitest';
import { join } from 'node:path';
import { DependencyContext, isExternal } from './dependencies.js';

describe('DependencyContext', () => {
  let context: DependencyContext;
  const fixturesPath = join(__dirname, '../../test/fixtures/dependencies');

  beforeEach(() => {
    context = new DependencyContext();
  });

  describe('loadDependencies', () => {
    it('should load direct dependencies from package.json', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.isDirect('has')).toBe(true);
      expect(context.getVersion('has')).toBe('^1.0.4');
    });

    it('should load dev dependencies from package.json', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.isDirect('debug')).toBe(true);
      expect(context.getVersion('debug')).toBe('^4.4.3');
    });
  });

  describe('findRootDependency', () => {
    it('should return package name if it is a direct dependency', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.findRootDependency('has')).toBe('has');
      expect(context.findRootDependency('debug')).toBe('debug');
    });

    it('should find root dependency for transitive packages', async () => {
      await context.loadDependencies(fixturesPath);

      const rootDep = context.findRootDependency('ms');
      expect(rootDep).toBe('debug');
    });

    it('should return package name as fallback if not found in tree', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.findRootDependency('unknown-package')).toBe('unknown-package');
    });
  });

  describe('isDirect', () => {
    it('should return true for direct dependencies', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.isDirect('has')).toBe(true);
      expect(context.isDirect('debug')).toBe(true);
    });

    it('should return false for transitive dependencies', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.isDirect('ms')).toBe(false);
    });

    it('should return false for unknown packages', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.isDirect('unknown-package')).toBe(false);
    });
  });

  describe('getVersion', () => {
    it('should return version for direct dependencies', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.getVersion('has')).toBe('^1.0.4');
      expect(context.getVersion('debug')).toBe('^4.4.3');
    });

    it('should return undefined for transitive dependencies', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.getVersion('ms')).toBeUndefined();
    });

    it('should return undefined for unknown packages', async () => {
      await context.loadDependencies(fixturesPath);

      expect(context.getVersion('unknown-package')).toBeUndefined();
    });
  });

  describe('getAllDependencies', () => {
    it('should return combined dependencies and devDependencies', async () => {
      await context.loadDependencies(fixturesPath);

      const allDeps = context.getAllDependencies();
      expect(allDeps.has('has')).toBe(true);
      expect(allDeps.has('debug')).toBe(true);
      expect(allDeps.size).toBe(2);
    });
  });

  describe('isExternal', () => {
    it('should return true for Grafana external packages', () => {
      expect(isExternal('react')).toBe(true);
      expect(isExternal('react-dom')).toBe(true);
      expect(isExternal('@grafana/data')).toBe(true);
      expect(isExternal('@grafana/ui')).toBe(true);
      expect(isExternal('@emotion/css')).toBe(true);
    });

    it('should return true for sub-paths of external packages', () => {
      expect(isExternal('react/jsx-runtime')).toBe(true);
      expect(isExternal('@grafana/data/utils')).toBe(true);
    });

    it('should return false for non-external packages', () => {
      expect(isExternal('axios')).toBe(false);
      expect(isExternal('express')).toBe(false);
      expect(isExternal('@some-org/package')).toBe(false);
    });
  });
});
