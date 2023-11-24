import { resolveSelectors } from '../resolver';
import { SelectorScenario } from '../types';

describe('resolve API selectors', () => {
  test.each<SelectorScenario>([
    {
      version: '9.4.4',
      expected: '/api/datasources/uid/*/resources',
    },
    {
      version: '8.5.1',
      expected: '/api/datasources/*/resources',
    },
  ])('v$version | "resource" selector is correct', ({ version, expected }) => {
    const selectors = resolveSelectors(version);
    expect(selectors.apis.resource()).toEqual(expected);
  });

  test.each<SelectorScenario>([
    {
      version: '8.5.1',
      expected: 'api/datasources/uid/*/health',
    },
  ])('v$version | "healthCheck" selector is correct', ({ version, expected }) => {
    const selectors = resolveSelectors(version);
    expect(selectors.apis.healthCheck()).toEqual(expected);
  });

  test.each<SelectorScenario>([
    {
      version: '8.5.1',
      expected: '*/**/api/ds/query*',
    },
  ])('v$version | "query" selector is correct', ({ version, expected }) => {
    const selectors = resolveSelectors(version);
    expect(selectors.apis.query()).toEqual(expected);
  });
});
