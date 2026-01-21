import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';

type Namespace = TestFixture<string, PlaywrightArgs>;

export const namespace: Namespace = async ({ bootData }, use) => {
  // default to 'default' if namespace is not available
  await use(bootData.namespace || 'default');
};
