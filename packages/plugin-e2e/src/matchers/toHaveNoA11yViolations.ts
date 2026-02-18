import { MatcherReturnType } from '@playwright/test';
import { AxeResults } from 'axe-core';

export function toHaveNoA11yViolations(
  results: AxeResults,
  options?: { threshold?: number; ignoredRules?: string[] }
): MatcherReturnType {
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
