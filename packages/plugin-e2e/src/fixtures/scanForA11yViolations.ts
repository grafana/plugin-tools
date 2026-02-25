import AxeBuilder from '@axe-core/playwright';
import { TestFixture } from '@playwright/test';
import { AxeResults } from 'axe-core';

import { PlaywrightArgs, AxeScanContext } from '../types';

export const DEFAULT_A11Y_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa' /* 'best-practice' */];

/**
 * @alpha - the API for accessibility scanning is still being finalized and may change in future releases. Feedback is welcome!
 */
export const scanForA11yViolations: TestFixture<
  (context?: AxeScanContext) => Promise<AxeResults>,
  PlaywrightArgs
> = async ({ page }, use, testInfo) => {
  let inc = 1;
  await use(async (context?: AxeScanContext) => {
    const builder = new AxeBuilder({ page }).withTags(DEFAULT_A11Y_TAGS);
    if (context?.options) {
      builder.options(context!.options);
    }
    if (context?.include) {
      builder.include(context!.include);
    }
    if (context?.exclude) {
      builder.exclude(context!.exclude);
    }

    const accessibilityScanResults = await builder.analyze();

    testInfo.attach(`axe-${inc++}`, {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: 'application/json',
    });

    return accessibilityScanResults;
  });
};
