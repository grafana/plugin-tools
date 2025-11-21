import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExternalsDetector } from './externals-detector.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ExternalsDetector', () => {
  const testDir = path.join(__dirname, '__test-fixtures__', 'externals');

  beforeEach(() => {
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('default externals', () => {
    it('should detect react as external', () => {
      const detector = new ExternalsDetector(testDir);
      expect(detector.isExternal('react')).toBe(true);
    });

    it('should detect react-dom as external', () => {
      const detector = new ExternalsDetector(testDir);
      expect(detector.isExternal('react-dom')).toBe(true);
    });

    it('should detect @grafana scoped packages as external', () => {
      const detector = new ExternalsDetector(testDir);
      expect(detector.isExternal('@grafana/ui')).toBe(true);
      expect(detector.isExternal('@grafana/data')).toBe(true);
      expect(detector.isExternal('@grafana/runtime')).toBe(true);
    });

    it('should detect lodash as external', () => {
      const detector = new ExternalsDetector(testDir);
      expect(detector.isExternal('lodash')).toBe(true);
    });

    it('should detect moment as external', () => {
      const detector = new ExternalsDetector(testDir);
      expect(detector.isExternal('moment')).toBe(true);
    });

    it('should detect rxjs as external', () => {
      const detector = new ExternalsDetector(testDir);
      expect(detector.isExternal('rxjs')).toBe(true);
    });

    it('should not detect non-external packages', () => {
      const detector = new ExternalsDetector(testDir);
      expect(detector.isExternal('react-select')).toBe(false);
      expect(detector.isExternal('@floating-ui/react')).toBe(false);
      expect(detector.isExternal('axios')).toBe(false);
    });
  });

  describe('pattern matching', () => {
    it('should match packages using regex patterns', () => {
      const detector = new ExternalsDetector(testDir);

      // Default externals include @grafana/* pattern
      expect(detector.isExternal('@grafana/ui')).toBe(true);
      expect(detector.isExternal('@grafana/data')).toBe(true);
      expect(detector.isExternal('@grafana/runtime')).toBe(true);
    });

    it('should work without custom externals file', () => {
      const detector = new ExternalsDetector(testDir);
      // Should still have default externals
      expect(detector.isExternal('react')).toBe(true);
      expect(detector.isExternal('lodash')).toBe(true);
    });
  });

  describe('getExternals and getExternalPatterns', () => {
    it('should return default externals', () => {
      const detector = new ExternalsDetector(testDir);
      const externals = detector.getExternals();

      expect(externals).toContain('react');
      expect(externals).toContain('react-dom');
      expect(externals).toContain('lodash');
    });

    it('should return external patterns', () => {
      const detector = new ExternalsDetector(testDir);
      const patterns = detector.getExternalPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some((p) => p.test('@grafana/ui'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should be case-sensitive for package names', () => {
      const detector = new ExternalsDetector(testDir);
      expect(detector.isExternal('React')).toBe(false);
      expect(detector.isExternal('react')).toBe(true);
    });

    it('should handle missing custom externals file', () => {
      const detector = new ExternalsDetector(testDir);
      // Should use default externals
      expect(detector.isExternal('react')).toBe(true);
      expect(detector.isExternal('lodash')).toBe(true);
    });
  });
});
