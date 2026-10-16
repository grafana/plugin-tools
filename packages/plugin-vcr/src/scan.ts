import type { Finding, Har, HarEntry, HarNameValue } from './types.js';
import type { SecretScrubber } from './redact.js';

/** A 40-char lowercase-hex string is a git SHA-1, not a base64 secret - ubiquitous in GitHub API data. */
const isGitSha = (match: string): boolean => /^[0-9a-f]{40}$/.test(match);

interface SecretShapePattern {
  rule: string;
  pattern: RegExp;
  /** Excludes a match that's a known benign shape sharing the same regex (e.g. a git SHA). */
  isFalsePositive?: (match: string) => boolean;
}

/**
 * Built-in patterns for secret-shaped strings that scrubbing might have missed, because they
 * weren't in provisioning and weren't learned (a hardcoded key, a webhook signing secret, ...).
 * This is a backstop, not the primary control - the primary control is scrubbing known values.
 */
const SECRET_SHAPE_PATTERNS: SecretShapePattern[] = [
  { rule: 'aws-access-key-id', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { rule: 'aws-secret-key-like', pattern: /\b[A-Za-z0-9/+=]{40}\b/, isFalsePositive: isGitSha },
  { rule: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  // any JWT, not just a Bearer header: a form-encoded OAuth assertion is exchangeable for an access token
  { rule: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/ },
  { rule: 'generic-api-key', pattern: /"(?:api[_-]?key|apikey)"\s*:\s*"(?!REDACTED)[^"]{12,}"/i },
  { rule: 'private-key-block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

/**
 * Scans a HAR document for anything that still looks like a secret after scrubbing. Called
 * right before writing a recording to disk - a non-empty result means the write is refused.
 * Each part of an entry is scanned as the raw text a client sends or receives, not as the escaped
 * JSON it's stored as.
 */
export function scanHar(har: Har, filePath: string, scrubber: SecretScrubber): Finding[] {
  const findings: Finding[] = [];

  har.log.entries.forEach((entry, index) => {
    for (const [location, text] of scannableParts(entry)) {
      if (text === '') {
        continue;
      }
      // scrub() has no side effects; any change means a known or learned secret is still present
      if (scrubber.scrub(text, {}) !== text) {
        findings.push({
          file: filePath,
          entry: index,
          location,
          rule: 'known-secret-value',
          preview: 'a known secret value from provisioning or a learned token is still present',
        });
      }
      for (const shapePattern of SECRET_SHAPE_PATTERNS) {
        const match = firstRealMatch(text, shapePattern);
        if (match) {
          findings.push({
            file: filePath,
            entry: index,
            location,
            rule: shapePattern.rule,
            preview: maskPreview(match),
          });
        }
      }
    }
  });

  return findings;
}

function scannableParts(entry: HarEntry): Array<[string, string]> {
  const { content } = entry.response;
  // binary bodies are stored as base64; latin1 maps each byte to one char, so an ASCII secret stays findable
  const responseBody =
    content.encoding === 'base64' ? Buffer.from(content.text, 'base64').toString('latin1') : content.text;
  return [
    ['request.url', entry.request.url],
    ['request.headers', headerText(entry.request.headers)],
    ['request.body', entry.request.postData?.text ?? ''],
    ['response.headers', headerText(entry.response.headers)],
    ['response.body', responseBody],
  ];
}

function headerText(headers: HarNameValue[]): string {
  return headers.map((h) => `${h.name}: ${h.value}`).join('\n');
}

function firstRealMatch(text: string, { pattern, isFalsePositive }: SecretShapePattern): string | undefined {
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  for (const match of text.matchAll(globalPattern)) {
    if (!isFalsePositive?.(match[0])) {
      return match[0];
    }
  }
  return undefined;
}

function maskPreview(value: string): string {
  if (value.length <= 8) {
    return '***';
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
