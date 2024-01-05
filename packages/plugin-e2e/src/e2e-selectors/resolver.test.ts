import { resolveSelectors } from './resolver';
import { versionedComponents, versionedPages } from './versioned';
import { versionedAPIs } from './versioned/apis';
import { MIN_GRAFANA_VERSION } from './versioned/constants';
import { VersionedSelectors } from './versioned/types';

let versionedSelectors: VersionedSelectors = {
  components: versionedComponents,
  pages: versionedPages,
  apis: versionedAPIs,
};
const originalVersionedSelectors = versionedSelectors;
describe('resolveSelectors', () => {
  afterEach(() => {
    versionedSelectors = originalVersionedSelectors;
  });

  test('returns the right selector value when it has multiple versions', () => {
    versionedSelectors.components.CodeEditor.container = {
      '10.2.3': 'data-testid Code editor container',
      [MIN_GRAFANA_VERSION]: 'Code editor container',
    };

    // semver great than
    let selectors = resolveSelectors(versionedSelectors, '10.4.0');
    expect(selectors.components.CodeEditor.container).toBe('data-testid Code editor container');

    // semver equals to
    selectors = resolveSelectors(versionedSelectors, '10.3.0');
    expect(selectors.components.CodeEditor.container).toBe('data-testid Code editor container');

    // semver equals to when using pre-release
    selectors = resolveSelectors(versionedSelectors, '10.3.0-pre');
    expect(selectors.components.CodeEditor.container).toBe('data-testid Code editor container');

    selectors = resolveSelectors(versionedSelectors, '9.2.0');
    expect(selectors.components.CodeEditor.container).toBe('Code editor container');
  });
});
