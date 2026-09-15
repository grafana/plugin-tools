import { describe, it, expect } from 'vitest';
import { resolveGrafanaSelector } from './utils';

describe('resolveGrafanaSelector', () => {
  describe('data-testid selectors', () => {
    it('wraps a data-testid selector in a data-testid attribute selector', () => {
      expect(resolveGrafanaSelector('data-testid Panel header')).toBe('[data-testid="data-testid Panel header"]');
    });

    it('adds the ^ prefix operator when startsWith is true', () => {
      expect(resolveGrafanaSelector('data-testid Panel header', { startsWith: true })).toBe(
        '[data-testid^="data-testid Panel header"]'
      );
    });

    it('does not add the ^ prefix operator when startsWith is false', () => {
      expect(resolveGrafanaSelector('data-testid Panel header', { startsWith: false })).toBe(
        '[data-testid="data-testid Panel header"]'
      );
    });
  });

  describe('aria-label selectors (fallback)', () => {
    it('wraps a non-data-testid selector in an aria-label attribute selector', () => {
      expect(resolveGrafanaSelector('Panel header')).toBe('[aria-label="Panel header"]');
    });

    it('adds the ^ prefix operator when startsWith is true', () => {
      expect(resolveGrafanaSelector('Panel header', { startsWith: true })).toBe('[aria-label^="Panel header"]');
    });

    it('does not add the ^ prefix operator when startsWith is false', () => {
      expect(resolveGrafanaSelector('Panel header', { startsWith: false })).toBe('[aria-label="Panel header"]');
    });
  });
});
