import type { Severity, ValidationResult } from './types.js';

const SEVERITY_LABEL: Record<Severity, string> = {
  error: 'error',
  warning: 'warn ',
  info: 'info ',
};

const SEVERITY_RANK: Record<Severity, number> = {
  error: 0,
  warning: 1,
  info: 2,
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

  // info-only output is not a problem report - the docs are valid and these are notes. Saying
  // "Documentation has 17 info" reads as a failure and buries the fact that nothing is wrong.
  if (errors === 0 && warnings === 0) {
    lines.push(`✓ Documentation is valid (${infos} note${infos !== 1 ? 's' : ''})`);
    lines.push('');
  } else {
    const icon = errors > 0 ? '✗' : '⚠';
    lines.push(`${icon} Documentation has ${parts.join(' and ')}`);
    lines.push('');
  }

  // errors first, so the things that actually block validation aren't buried among warnings.
  // a stable sort keeps each severity's diagnostics in the order rules produced them.
  const sorted = [...result.diagnostics].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  for (const d of sorted) {
    const label = SEVERITY_LABEL[d.severity] ?? d.severity;
    const location = d.file ? (d.line ? `  ${d.file}:${d.line}` : `  ${d.file}`) : '';
    lines.push(`  ${label}${location}`);
    lines.push(`         ${d.title}`);
    if (d.detail) {
      lines.push(`         ${d.detail}`);
    }
    if (d.url) {
      lines.push(`         ${d.url}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
