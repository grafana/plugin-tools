import AxeBuilder from '@axe-core/playwright';
import { TestFixture } from '@playwright/test';
import { AxeResults, RunOptions as AxeRunOptions } from 'axe-core';

import { PlaywrightArgs } from '../types';

export const scanForA11yViolations: TestFixture<
  (options?: AxeRunOptions) => Promise<AxeResults>,
  PlaywrightArgs
> = async ({ page }, use, testInfo) => {
  await use(async (options?: AxeRunOptions) => {
    const builder = new AxeBuilder({ page }).withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa', /* 'best-practice' */
    ]);
    if (options) {
      builder.options(options);
    }

    const accessibilityScanResults = await builder.analyze();

    testInfo.annotations.push({
      type: 'axe-a11y',
      description: JSON.stringify(accessibilityScanResults, null, 2),
    });

    return accessibilityScanResults;
  });
};
