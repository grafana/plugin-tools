export type Severity = 'error' | 'warning' | 'info';

/**
 * A finding from a rule check - no severity attached.
 * The engine stamps severity based on the rule definition.
 */
export interface Finding {
  rule: string;
  file?: string;
  line?: number;
  title: string;
  detail: string;
}

/**
 * A diagnostic is a finding with severity stamped by the engine.
 */
export interface Diagnostic extends Finding {
  severity: Severity;
}

/**
 * Metadata for a single validation rule.
 */
export interface RuleDefinition {
  id: string;
  severity: Severity;
}

/**
 * Data available to rule runners. Grows as slices add more rule categories.
 */
export interface ValidationInput {
  docsPath: string;
}

/**
 * The result of running validation.
 */
export interface ValidationResult {
  valid: boolean;
  diagnostics: Diagnostic[];
}

/**
 * A function that checks rules and returns findings.
 */
export type RuleRunner = (input: ValidationInput) => Finding[] | Promise<Finding[]>;
