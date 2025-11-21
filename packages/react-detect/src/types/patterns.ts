export type Severity = 'removed' | 'renamed' | 'deprecated';

export interface PatternDefinition {
  pattern: string;
  severity: Severity;
  impactLevel: 'critical' | 'warning';
  description: string;
  problem: string;
  fix: {
    description: string;
    before: string;
    after: string;
  };
  link: string;
  functionComponentOnly?: boolean;
}
