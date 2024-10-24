import { TestFixture } from '@playwright/test';
import { E2ESelectors, PlaywrightArgs } from '../types';
import {
  resolveSelectors,
  VersionedComponents,
  versionedComponents,
  VersionedPages,
  versionedPages,
} from '@grafana/e2e-selectors';
import { VersionedConstants, versionedConstants } from '../selectors/versionedConstants';
import { VersionedAPIs, versionedAPIs } from '../selectors/versionedAPIs';

type SelectorFixture = TestFixture<E2ESelectors, PlaywrightArgs>;

export const selectors: SelectorFixture = async ({ grafanaVersion }, use) => {
  await use({
    components: resolveSelectors<VersionedComponents>(versionedComponents, grafanaVersion),
    pages: resolveSelectors<VersionedPages>(versionedPages, grafanaVersion),
    constants: resolveSelectors<VersionedConstants>(versionedConstants, grafanaVersion),
    apis: resolveSelectors<VersionedAPIs>(versionedAPIs, grafanaVersion),
  });
};
