import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../types';
import { E2ESelectors, resolveSelectors } from '../e2e-selectors';
import { versionedComponents, versionedPages } from '../e2e-selectors/versioned';
import { PlaywrightCombinedArgs } from './types';
import { versionedAPIs } from '../e2e-selectors/versioned/apis';

type SelectorFixture = TestFixture<E2ESelectors, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

export const selectors: SelectorFixture = async ({ grafanaVersion }, use) => {
  const selectors = resolveSelectors(
    {
      components: versionedComponents,
      pages: versionedPages,
      apis: versionedAPIs,
    },
    grafanaVersion
  );
  await use(selectors);
};
