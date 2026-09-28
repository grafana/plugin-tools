import { describe, expect, it } from 'vitest';
import { emptyHar, toHarEntry } from './har.js';
import { SecretScrubber } from './redact.js';
import { scanHar } from './scan.js';
import type { CapturedRequest, CapturedResponse } from './types.js';

function req(): CapturedRequest {
  return { method: 'GET', url: 'https://api.example.com/v1/status', headers: {}, body: Buffer.from('') };
}

function res(body: string): CapturedResponse {
  return { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' }, body: Buffer.from(body) };
}

describe('scanHar', () => {
  it('finds nothing in a clean recording', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res('{"state":"ok"}'), new Date(), 1));
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({}));
    expect(findings).toEqual([]);
  });

  it('flags a known secret value that was not actually scrubbed out', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res('{"echo":"sekret-value-123"}'), new Date(), 1));
    const scrubber = new SecretScrubber({ ACCESS_KEY: 'sekret-value-123' });
    const findings = scanHar(har, 'e2e/recordings/api.har', scrubber);
    expect(findings.some((f) => f.rule === 'known-secret-value')).toBe(true);
  });

  it('flags a secret-shaped value even when it was never a known/learned secret', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res('{"key":"AKIAFAKEFAKEFAKE99Z"}'), new Date(), 1));
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({}));
    expect(findings.some((f) => f.rule === 'aws-access-key-id')).toBe(true);
  });

  it('masks the preview so the finding itself does not leak the secret', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res('{"key":"AKIAFAKEFAKEFAKE99Z"}'), new Date(), 1));
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({}));
    const finding = findings.find((f) => f.rule === 'aws-access-key-id');
    expect(finding?.preview).not.toContain('AKIAFAKEFAKEFAKE99Z');
  });

  it('does not flag a git commit SHA as an AWS-secret-shaped value', () => {
    const har = emptyHar();
    har.log.entries.push(
      toHarEntry(
        req(),
        res(
          '{"body":"bumps foo from 58bff37c8947f690ace498be413a9b78d6f30f93 to 06749dd8c0b54f350bc69c8752456cee498808a3"}'
        ),
        new Date(),
        1
      )
    );
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({}));
    expect(findings).toEqual([]);
  });

  it('still flags a real secret-shaped value next to a git SHA in the same response', () => {
    const har = emptyHar();
    const realSecret = 'aB3xY9zQwErTyUiOpAsDfGhJkLzXcVbNmFAKE999';
    har.log.entries.push(
      toHarEntry(
        req(),
        res(JSON.stringify({ sha: '58bff37c8947f690ace498be413a9b78d6f30f93', secret: realSecret })),
        new Date(),
        1
      )
    );
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({}));
    expect(findings.some((f) => f.rule === 'aws-secret-key-like')).toBe(true);
  });
});
