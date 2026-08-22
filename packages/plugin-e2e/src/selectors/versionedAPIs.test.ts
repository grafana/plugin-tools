import { describe, expect, it } from 'vitest';

import { versionedAPIs } from './versionedAPIs';

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE_STAR__/g, '.*');

  return new RegExp(`^${escaped}$`);
}

describe('versionedAPIs', () => {
  describe('OpenFeature', () => {
    it('matches namespaced and bare OFREP bulk evaluation routes', () => {
      const pattern = versionedAPIs.OpenFeature.ofrepBulkPattern['12.1.0'];
      const matcher = globToRegExp(pattern);

      expect(matcher.test('/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags')).toBe(true);
      expect(matcher.test('/ofrep/v1/evaluate/flags')).toBe(true);
    });

    it('provides namespaced and bare OFREP bulk evaluation paths', () => {
      expect(versionedAPIs.OpenFeature.ofrepBulkPath['12.1.0']('default')).toBe(
        '/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags'
      );
      expect(versionedAPIs.OpenFeature.ofrepBulkPathWithoutNamespace['12.1.0']()).toBe('/ofrep/v1/evaluate/flags');
    });

    it('matches namespaced and bare OFREP single flag evaluation routes', () => {
      const pattern = versionedAPIs.OpenFeature.ofrepSinglePattern['12.1.0'];
      const matcher = globToRegExp(pattern);

      expect(
        matcher.test('/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags/myFlag')
      ).toBe(true);
      expect(matcher.test('/ofrep/v1/evaluate/flags/myFlag')).toBe(true);
    });

    it('provides namespaced and bare OFREP single flag evaluation paths', () => {
      expect(versionedAPIs.OpenFeature.ofrepSinglePath['12.1.0']('default', 'myFlag')).toBe(
        '/apis/features.grafana.app/v0alpha1/namespaces/default/ofrep/v1/evaluate/flags/myFlag'
      );
      expect(versionedAPIs.OpenFeature.ofrepSinglePathWithoutNamespace['12.1.0']('myFlag')).toBe(
        '/ofrep/v1/evaluate/flags/myFlag'
      );
    });
  });
});
