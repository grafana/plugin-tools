import { MatcherReturnType } from '@playwright/test';
import { AxeResults } from 'axe-core';

export async function toHaveNoA11yViolations(
  results: AxeResults,
  options?: { threshold?: number; ignoredRules?: string[] }
): Promise<MatcherReturnType> {
  const threshold = options?.threshold ?? 0;
  let violations: AxeResults['violations'] = [];
  try {
    violations = results.violations.filter((violation) => !options?.ignoredRules?.includes(violation.id));
    if (violations.length > threshold) {
      throw new Error(`${violations.length} Axe violations found (Threshold: ${threshold})`);
    }

    return {
      pass: true,
      expected: threshold,
      message: () =>
        `No more than ${threshold} Axe violations found (actual: ${violations.length}).`,
    };
  } catch (err: unknown) {
    let message = err instanceof Error ? err.toString() : 'Unknown error';
    if (violations.length > 0) {
      const violationDetails = violations
        .flatMap((v) => [
          `- Rule: ${v.id}`,
          `  Description: ${v.description}`,
          `  Docs: ${v.helpUrl}`,
          `  Affected nodes: \n${v.nodes.map((node) => `    - ${node.html}`).join('\n')}`,
        ])
        .join('\n');

      message += `\n\nAxe Violations:\n${violationDetails}`;
    }

    return {
      message: () => message,
      pass: false,
    };
  }
}
