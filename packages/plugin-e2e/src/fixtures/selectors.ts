import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { E2ESelectorGroup, resolveSelectors } from '@grafana/e2e-selectors';

type SelectorFixture = TestFixture<E2ESelectorGroup, PlaywrightArgs>;

export const selectors: SelectorFixture = async ({ grafanaVersion }, use) => {
  const selectors = resolveSelectors(grafanaVersion);
  await use(selectors);
};
