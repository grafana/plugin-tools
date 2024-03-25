import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../types';
import { ExplorePage } from '../models/pages/ExplorePage';
import { PlaywrightCombinedArgs } from './types';

type ExplorePageFixture = TestFixture<ExplorePage, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

export const explorePage: ExplorePageFixture = async ({ page, selectors, grafanaVersion, request }, use, testInfo) => {
  const explorePage = new ExplorePage({ page, selectors, grafanaVersion, request, testInfo });
  await explorePage.goto();
  await use(explorePage);
};
