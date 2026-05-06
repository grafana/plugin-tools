import { TestFixture } from '@playwright/test';
import { E2ESelectorGroups, PlaywrightArgs } from '../types';
import { resolveSelectors, versionedComponents, versionedPages } from '@grafana/e2e-selectors';
import { versionedConstants } from '../selectors/versionedConstants';
import { versionedAPIs } from '../selectors/versionedAPIs';

type SelectorFixture = TestFixture<E2ESelectorGroups, PlaywrightArgs>;

export const selectors: SelectorFixture = async ({ grafanaVersion }, use) => {
  await use({
    components: resolveSelectors(versionedComponents, grafanaVersion),
    pages: resolveSelectors(versionedPages, grafanaVersion),
    constants: resolveSelectors(versionedConstants, grafanaVersion),
    apis: resolveSelectors(versionedAPIs, grafanaVersion),
  });
};
