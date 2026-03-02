import type { Severity, ValidationResult } from './types.js';

const SEVERITY_LABEL: Record<Severity, string> = {
  error: 'error',
  warning: 'warn ',
  info: 'info ',
};

/**
 * Formats a validation result as human-readable text.
 */
export function formatResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.diagnostics.length === 0) {
    lines.push('✓ Documentation is valid');
    return lines.join('\n');
  }

  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const d of result.diagnostics) {
    counts[d.severity]++;
  }
  const { error: errors, warning: warnings, info: infos } = counts;

  // summary line
  const parts: string[] = [];
  if (errors > 0) {
    parts.push(`${errors} error${errors !== 1 ? 's' : ''}`);
  }
  if (warnings > 0) {
    parts.push(`${warnings} warning${warnings !== 1 ? 's' : ''}`);
  }
  if (infos > 0) {
    parts.push(`${infos} info`);
  }

  const icon = errors > 0 ? '✗' : '⚠';
  lines.push(`${icon} Documentation has ${parts.join(' and ')}`);
  lines.push('');

  for (const d of result.diagnostics) {
    const label = SEVERITY_LABEL[d.severity] ?? d.severity;
    const location = d.file ? (d.line ? `  ${d.file}:${d.line}` : `  ${d.file}`) : '';
    lines.push(`  ${label}${location}`);
    lines.push(`         ${d.title}`);
    if (d.detail) {
      lines.push(`         ${d.detail}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
