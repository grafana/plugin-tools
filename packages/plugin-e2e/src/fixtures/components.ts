import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';
import { Components } from '../models/Components';

type ComponentsFixture = TestFixture<Components, PlaywrightArgs>;

export const components: ComponentsFixture = async (
  { request, page, selectors, grafanaVersion },
  use,
  testInfo
) => {
  await use(new Components({ page, selectors, grafanaVersion, request, testInfo }));
};
