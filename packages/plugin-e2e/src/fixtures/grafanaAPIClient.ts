// import { TestFixture } from '@playwright/test';
// import { PlaywrightArgs } from '../types';
// import { ExplorePage } from '../models/pages/ExplorePage';
// import { GrafanaAPIClient } from '../models/GrafanaAPIClient';

// type GrafanaAPIClientFixture = TestFixture<ExplorePage, PlaywrightArgs>;

// export const grafanaAPIClient: GrafanaAPIClientFixture = async (
//   { page, selectors, grafanaVersion, request },
//   use,
//   testInfo
// ) => {
//   const grafanaAPIClient = new GrafanaAPIClient();
//   await grafanaAPIClient.goto();
//   await use(grafanaAPIClient);
// };
