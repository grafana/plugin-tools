import { TestFixture } from '@playwright/test';
import { E2ESelectorGroups, PlaywrightArgs } from '../types';
import { resolveSelectors, versionedComponents, versionedPages } from '@grafana/e2e-selectors';
import { versionedConstants } from '../selectors/versionedConstants';
import { versionedAPIs } from '../selectors/versionedAPIs';

type SelectorFixture = TestFixture<E2ESelectorGroups, PlaywrightArgs>;

// @grafana/e2e-selectors marks the data-testid query editor row selectors as 13.1.0+,
// but they were introduced in 13.0.1. Patch the boundary here until the upstream package is updated.
const patchedComponents = {
  ...versionedComponents,
  QueryEditorRows: {
    ...versionedComponents.QueryEditorRows,
    rows: { ...versionedComponents.QueryEditorRows.rows, '13.0.1': 'data-testid Query editor row' },
  },
  QueryEditorRow: {
    ...versionedComponents.QueryEditorRow,
    title: {
      ...versionedComponents.QueryEditorRow.title,
      '13.0.1': (refId: string) => `data-testid Query editor row title ${refId}`,
    },
  },
} as typeof versionedComponents;

export const selectors: SelectorFixture = async ({ grafanaVersion }, use) => {
  await use({
    components: resolveSelectors(patchedComponents, grafanaVersion),
    pages: resolveSelectors(versionedPages, grafanaVersion),
    constants: resolveSelectors(versionedConstants, grafanaVersion),
    apis: resolveSelectors(versionedAPIs, grafanaVersion),
  });
};
