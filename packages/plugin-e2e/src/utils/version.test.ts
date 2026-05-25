import { describe, it, expect } from 'vitest';
import { gte, lt, lte, gt, eq, satisfies } from './version';

describe('version', () => {
  describe('gte', () => {
    it('returns true when versions are equal', () => {
      expect(gte('1.2.3', '1.2.3')).toBe(true);
    });

    it('returns true when first version is greater', () => {
      expect(gte('2.0.0', '1.9.9')).toBe(true);
      expect(gte('1.3.0', '1.2.9')).toBe(true);
      expect(gte('1.2.4', '1.2.3')).toBe(true);
    });

    it('returns false when first version is lower', () => {
      expect(gte('1.2.3', '1.2.4')).toBe(false);
      expect(gte('1.2.3', '2.0.0')).toBe(false);
    });
  });

  describe('lt', () => {
    it('returns true when first version is lower', () => {
      expect(lt('1.2.3', '1.2.4')).toBe(true);
      expect(lt('9.0.0', '10.0.0')).toBe(true);
    });

    it('returns false when versions are equal', () => {
      expect(lt('1.2.3', '1.2.3')).toBe(false);
    });

    it('returns false when first version is greater', () => {
      expect(lt('2.0.0', '1.9.9')).toBe(false);
    });
  });

  describe('lte', () => {
    it('returns true when versions are equal', () => {
      expect(lte('1.2.3', '1.2.3')).toBe(true);
    });

    it('returns true when first version is lower', () => {
      expect(lte('1.2.3', '1.2.4')).toBe(true);
    });

    it('returns false when first version is greater', () => {
      expect(lte('2.0.0', '1.9.9')).toBe(false);
    });
  });

  describe('gt', () => {
    it('returns false when versions are equal', () => {
      expect(gt('1.2.3', '1.2.3')).toBe(false);
    });

    it('returns true when first version is greater', () => {
      expect(gt('2.0.0', '1.9.9')).toBe(true);
    });

    it('returns false when first version is lower', () => {
      expect(gt('1.2.3', '1.2.4')).toBe(false);
    });
  });

  describe('eq', () => {
    it('returns true when versions are equal', () => {
      expect(eq('1.2.3', '1.2.3')).toBe(true);
    });

    it('returns false when versions differ in any segment', () => {
      expect(eq('1.2.3', '1.2.4')).toBe(false);
      expect(eq('1.2.3', '1.3.3')).toBe(false);
      expect(eq('1.2.3', '2.2.3')).toBe(false);
    });
  });

  describe('parsing', () => {
    it('treats missing minor and patch as zero', () => {
      expect(eq('1', '1.0.0')).toBe(true);
      expect(eq('1.2', '1.2.0')).toBe(true);
    });

    it('compares numerically not lexicographically', () => {
      expect(gt('10.0.0', '9.0.0')).toBe(true);
      expect(gt('1.10.0', '1.9.0')).toBe(true);
      expect(gt('1.0.10', '1.0.9')).toBe(true);
    });
  });

  describe('satisfies', () => {
    it('supports exact version match', () => {
      expect(satisfies('1.2.3', '1.2.3')).toBe(true);
      expect(satisfies('1.2.3', '1.2.4')).toBe(false);
    });

    it('supports the = comparator', () => {
      expect(satisfies('1.2.3', '=1.2.3')).toBe(true);
      expect(satisfies('1.2.4', '=1.2.3')).toBe(false);
    });

    it('supports >= and <= comparators', () => {
      expect(satisfies('1.2.3', '>=1.2.3')).toBe(true);
      expect(satisfies('1.2.4', '>=1.2.3')).toBe(true);
      expect(satisfies('1.2.2', '>=1.2.3')).toBe(false);
      expect(satisfies('1.2.3', '<=1.2.3')).toBe(true);
      expect(satisfies('1.2.4', '<=1.2.3')).toBe(false);
    });

    it('supports > and < comparators', () => {
      expect(satisfies('1.2.4', '>1.2.3')).toBe(true);
      expect(satisfies('1.2.3', '>1.2.3')).toBe(false);
      expect(satisfies('1.2.2', '<1.2.3')).toBe(true);
      expect(satisfies('1.2.3', '<1.2.3')).toBe(false);
    });

    it('treats whitespace-separated comparators as AND', () => {
      expect(satisfies('1.5.0', '>=1.0.0 <2.0.0')).toBe(true);
      expect(satisfies('2.0.0', '>=1.0.0 <2.0.0')).toBe(false);
      expect(satisfies('0.9.0', '>=1.0.0 <2.0.0')).toBe(false);
    });

    it('treats || as OR between ranges', () => {
      expect(satisfies('1.5.0', '>=1.0.0 <2.0.0 || >=3.0.0')).toBe(true);
      expect(satisfies('3.1.0', '>=1.0.0 <2.0.0 || >=3.0.0')).toBe(true);
      expect(satisfies('2.5.0', '>=1.0.0 <2.0.0 || >=3.0.0')).toBe(false);
    });
  });
});
