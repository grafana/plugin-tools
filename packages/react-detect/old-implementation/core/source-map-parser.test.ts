import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SourceMapParser } from './source-map-parser.js';

describe('SourceMapParser', () => {
  // Suppress console.error for these tests since we're intentionally using non-existent files
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a parser without loading a file
  function createTestParser() {
    // Use a non-existent path - the methods we're testing don't require the file to exist
    return new SourceMapParser('/non/existent/path.map');
  }

  describe('getPackageName', () => {
    it('should extract package name from standard node_modules path', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('node_modules/react-select/dist/index.js');
      expect(result).toBe('react-select');
    });

    it('should extract scoped package name from standard node_modules path', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('node_modules/@grafana/ui/dist/index.js');
      expect(result).toBe('@grafana/ui');
    });

    it('should extract package name from pnpm virtual store', () => {
      const parser = createTestParser();
      const result = parser.getPackageName(
        '.pnpm/react-select@5.8.0_@types+react@18.3.5_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-select/dist/index.js'
      );
      expect(result).toBe('react-select');
    });

    it('should extract scoped package name from pnpm virtual store', () => {
      const parser = createTestParser();
      const result = parser.getPackageName(
        '.pnpm/@floating-ui+react@0.27.16_react-dom@18.2.0_react@18.2.0/node_modules/@floating-ui/react/dist/index.js'
      );
      expect(result).toBe('@floating-ui/react');
    });

    it('should extract package name from nested pnpm path', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/index.js');
      expect(result).toBe('lodash');
    });

    it('should return null for non-node_modules paths', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('src/components/MyComponent.tsx');
      expect(result).toBeNull();
    });

    it('should return null for relative paths', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('../utils/helper.js');
      expect(result).toBeNull();
    });

    it('should handle paths with /dist suffix', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('.pnpm/react-select@5.8.0/node_modules/react-select/dist/index.js');
      expect(result).toBe('react-select');
    });

    it('should handle paths with /build suffix', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('.pnpm/@emotion+react@11.11.0/node_modules/@emotion/react/build/index.js');
      expect(result).toBe('@emotion/react');
    });

    it('should handle jsx-runtime paths', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('node_modules/react/jsx-runtime.js');
      expect(result).toBe('react');
    });

    it('should handle jsx-dev-runtime paths', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('.pnpm/react@19.0.0/node_modules/react/jsx-dev-runtime.js');
      expect(result).toBe('react');
    });

    it('should handle deeply nested transitive dependencies', () => {
      const parser = createTestParser();
      const result = parser.getPackageName('node_modules/.pnpm/foo@1.0.0/node_modules/bar/node_modules/baz/index.js');
      // Should return the first package in the chain after .pnpm
      expect(result).toBe('bar');
    });
  });

  describe('isDependency', () => {
    it('should return true for standard node_modules path', () => {
      const parser = createTestParser();
      const result = parser.isDependency('node_modules/react/index.js');
      expect(result).toBe(true);
    });

    it('should return true for pnpm virtual store path', () => {
      const parser = createTestParser();
      const result = parser.isDependency('.pnpm/react@18.0.0/node_modules/react/index.js');
      expect(result).toBe(true);
    });

    it('should return false for source file', () => {
      const parser = createTestParser();
      const result = parser.isDependency('src/components/App.tsx');
      expect(result).toBe(false);
    });

    it('should return false for relative path', () => {
      const parser = createTestParser();
      const result = parser.isDependency('../utils/index.js');
      expect(result).toBe(false);
    });
  });
});
