import { resolveSelectors } from './resolver';
import { versionedComponents, versionedPages } from './versioned';
import { versionedAPIs } from './versioned/apis';
import { MIN_GRAFANA_VERSION } from './versioned/constants';
import { VersionedSelectors } from './versioned/types';

const GRAFANA_VERSION = '10.2.0';
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

  test('handles selector without version', () => {
    versionedSelectors.components.PanelEditor.General.content = 'Panel editor content';
    const selectors = resolveSelectors(versionedSelectors, GRAFANA_VERSION);
    expect(selectors.components.PanelEditor.General.content).toBe('Panel editor content');
  });

  test('returns the right selector value when it has multiple versions', () => {
    versionedSelectors.components.CodeEditor.container = {
      '10.3.0': 'data-testid Code editor container',
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
