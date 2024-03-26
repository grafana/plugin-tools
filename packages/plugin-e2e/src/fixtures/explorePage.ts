import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { ExplorePage } from '../models/pages/ExplorePage';

type ExplorePageFixture = TestFixture<ExplorePage, PlaywrightArgs>;

export const explorePage: ExplorePageFixture = async ({ page, selectors, grafanaVersion, request }, use, testInfo) => {
  const explorePage = new ExplorePage({ page, selectors, grafanaVersion, request, testInfo });
  await explorePage.goto();
  await use(explorePage);
};
