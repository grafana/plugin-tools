import { TestFixture } from '@playwright/test';
import type { AxeResults } from 'axe-core';
import type { AxeBuilder as AxeBuilderType } from '@axe-core/playwright';

import { PlaywrightArgs, AxeScanContext } from '../types';

export const DEFAULT_A11Y_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa' /* 'best-practice' */];

let AxeBuilder: typeof AxeBuilderType;

/**
 * @alpha - the API for accessibility scanning is still being finalized and may change in future releases. Feedback is welcome!
 */
export const scanForA11yViolations: TestFixture<
  (context?: AxeScanContext) => Promise<AxeResults>,
  PlaywrightArgs
> = async ({ page }, use, testInfo) => {
  let inc = 1;
  await use(async (context?: AxeScanContext) => {
    if (!AxeBuilder) {
      try {
        const { AxeBuilder: _AxeBuilder } = await import('@axe-core/playwright');
        AxeBuilder = _AxeBuilder;
      } catch (error) {
        throw new Error('@axe-core/playwright must be installed as a peer dependency to use a11y scanning.');
      }
    }
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
