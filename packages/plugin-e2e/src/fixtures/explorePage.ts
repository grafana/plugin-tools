import { TestFixture, expect } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { ExplorePage } from '../models/ExplorePage';
import { PlaywrightCombinedArgs } from './types';

type ExplorePageFixture = TestFixture<ExplorePage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const explorePage: ExplorePageFixture = async ({ page, selectors, grafanaVersion, request }, use) => {
  const explorePage = new ExplorePage({ page, selectors, grafanaVersion, request }, expect);
  await explorePage.goto();
  await use(explorePage);
};

export default explorePage;
