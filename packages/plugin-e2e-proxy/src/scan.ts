import type { Finding, Har } from './types.js';
import type { SecretScrubber } from './redact.js';

/**
 * Built-in patterns for secret-shaped strings that scrubbing might have missed, because they
 * weren't in provisioning and weren't learned (a hardcoded key, a webhook signing secret, ...).
 * This is a backstop, not the primary control - the primary control is scrubbing known values.
 */
const SECRET_SHAPE_PATTERNS: Array<{ rule: string; pattern: RegExp }> = [
  { rule: 'aws-access-key-id', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { rule: 'aws-secret-key-like', pattern: /\b[A-Za-z0-9/+=]{40}\b/ },
  { rule: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { rule: 'bearer-jwt', pattern: /\bBearer\s+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { rule: 'generic-api-key', pattern: /"(?:api[_-]?key|apikey)"\s*:\s*"(?!REDACTED)[^"]{12,}"/i },
  { rule: 'private-key-block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

/**
 * Scans a HAR document for anything that still looks like a secret after scrubbing. Called
 * right before writing a recording to disk - a non-empty result means the write is refused.
 */
export function scanHar(har: Har, filePath: string, scrubber: SecretScrubber): Finding[] {
  const findings: Finding[] = [];
  const serialized = JSON.stringify(har.log.entries);
  const learnedCounts: Record<string, number> = {};
  const stillPresent = scrubber.scrub(serialized, learnedCounts) !== serialized;
  // scrub() mutates nothing; a difference here means a known secret value is still in the file.
  if (stillPresent) {
    findings.push({
      file: filePath,
      entry: -1,
      location: '(document)',
      rule: 'known-secret-value',
      preview: 'a known secret value from provisioning or a learned token is still present',
    });
  }

  har.log.entries.forEach((entry, index) => {
    const requestText = JSON.stringify(entry.request);
    const responseText = JSON.stringify(entry.response);
    for (const { rule, pattern } of SECRET_SHAPE_PATTERNS) {
      checkText(requestText, 'request', index, rule, pattern, findings, filePath);
      checkText(responseText, 'response', index, rule, pattern, findings, filePath);
    }
  });

  return findings;
}

function checkText(
  text: string,
  location: 'request' | 'response',
  entryIndex: number,
  rule: string,
  pattern: RegExp,
  findings: Finding[],
  filePath: string
): void {
  const match = text.match(pattern);
  if (match) {
    findings.push({
      file: filePath,
      entry: entryIndex,
      location,
      rule,
      preview: maskPreview(match[0]),
    });
  }
}

function maskPreview(value: string): string {
  if (value.length <= 8) {
    return '***';
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
