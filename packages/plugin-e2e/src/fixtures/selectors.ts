import { TestFixture } from '@playwright/test';
import { E2ESelectors, PlaywrightArgs } from '../types';
import { resolveSelectors } from '@grafana/e2e-selectors';
import { resolveCustomSelectors } from '../selectors/resolver';

type SelectorFixture = TestFixture<E2ESelectors, PlaywrightArgs>;

export const selectors: SelectorFixture = async ({ grafanaVersion }, use) => {
  await use({ ...resolveSelectors(grafanaVersion), ...resolveCustomSelectors(grafanaVersion) });
};
