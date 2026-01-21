import { TestFixture } from '@playwright/test';
import { PlaywrightArgs } from '../types';

type GrafanaVersion = TestFixture<string, PlaywrightArgs>;

export const grafanaVersion: GrafanaVersion = async ({ bootData }, use) => {
  // strip version suffix (e.g., "11.0.0-pre" -> "11.0.0")
  await use(bootData.version.replace(/\-.*/, ''));
};
