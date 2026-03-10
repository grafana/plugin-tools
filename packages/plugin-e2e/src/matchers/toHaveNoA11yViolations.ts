import type { MatcherReturnType } from '@playwright/test';
import type { AxeResults } from 'axe-core';

import { A11yViolationsOptions } from '../types';

/**
 * @alpha - the API is not yet stable and may change without a major version bump. Use with caution.
 * @param {AxeResults} results  - The results from an Axe accessibility scan.
 * @param {A11yViolationsOptions} options - Options for configuring the accessibility violations check.
 * @returns {MatcherReturnType} - The result of the accessibility violations check.
 */
export function toHaveNoA11yViolations(results: AxeResults, options?: A11yViolationsOptions): MatcherReturnType {
  const threshold = options?.threshold ?? 0;
  const violations = results.violations.filter((violation) => !options?.ignoredRules?.includes(violation.id));

  let message = `No more than ${threshold} Axe violations found (actual: ${violations.length}).`;
  let pass = true;
  if (violations.length > threshold) {
    pass = false;
    message = `${violations.length} Axe violations found (Threshold: ${threshold})`;
    const violationDetails = violations
      .flatMap((v) => [
        `- Rule:   ${v.description}`,
        `  ID:     ${v.id} (${v.helpUrl})`,
        `  Impact: ${v.impact}`,
        `  Affected nodes:\n${v.nodes.map((node) => `  - ${node.html}`).join('\n')}`,
      ])
      .join('\n');

    message += `\n\nAxe Violations:\n${violationDetails}`;
  }

  return {
    pass,
    expected: threshold,
    message: () => message,
  };
}
