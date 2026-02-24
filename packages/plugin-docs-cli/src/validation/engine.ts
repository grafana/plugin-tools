import type { Diagnostic, RuleRunner, ValidationInput, ValidationResult } from './types.js';

/**
 * Run all provided rule runners against the input and return diagnostics.
 */
export async function validate(input: ValidationInput, rules: RuleRunner[]): Promise<ValidationResult> {
  const diagnostics: Diagnostic[] = [];

  for (const run of rules) {
    const results = await run(input);
    diagnostics.push(...results);
  }

  const valid = diagnostics.every((d) => d.severity !== 'error');

  return { valid, diagnostics };
}
