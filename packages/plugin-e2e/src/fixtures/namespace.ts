import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';

type Namespace = TestFixture<string, PlaywrightArgs>;

export const namespace: Namespace = async ({ bootData }, use) => {
  await use(bootData.namespace);
};
