import type { Diagnostic, Finding, RuleDefinition, RuleRunner, ValidationInput, ValidationResult } from './types.js';

export interface RuleCategory {
  definitions: RuleDefinition[];
  run: RuleRunner;
}

/**
 * Run all provided rules against the input and return stamped diagnostics.
 */
export async function validate(input: ValidationInput, rules: RuleCategory[]): Promise<ValidationResult> {
  // build a lookup from rule id to definition across all categories.
  const definitionMap = new Map<string, RuleDefinition>();
  for (const category of rules) {
    for (const def of category.definitions) {
      definitionMap.set(def.id, def);
    }
  }

  // run all rule runners and collect findings.
  const allFindings: Finding[] = [];
  for (const category of rules) {
    const findings = await category.run(input);
    allFindings.push(...findings);
  }

  // stamp severity and filter.
  const diagnostics: Diagnostic[] = [];
  for (const finding of allFindings) {
    const def = definitionMap.get(finding.rule);
    if (!def) {
      throw new Error(`Unknown rule id encountered during validation: ${finding.rule}`);
    }

    diagnostics.push({ ...finding, severity: def.severity });
  }

  const valid = diagnostics.every((d) => d.severity !== 'error');

  return { valid, diagnostics };
}
