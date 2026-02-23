export type Severity = 'error' | 'warning' | 'info';

/**
 * A diagnostic reported by a rule runner.
 */
export interface Diagnostic {
  rule: string;
  severity: Severity;
  file?: string;
  line?: number;
  title: string;
  detail: string;
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
 * A function that checks rules and returns diagnostics.
 */
export type RuleRunner = (input: ValidationInput) => Diagnostic[] | Promise<Diagnostic[]>;
