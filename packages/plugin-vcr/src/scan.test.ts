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

describe('scanHar locations', () => {
  it('flags an unknown api key in a response body', () => {
    const har = emptyHar();
    har.log.entries.push(toHarEntry(req(), res('{"api_key":"abcdefghijklmnopqrstuvwx"}'), new Date(), 1));
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({}));
    expect(findings).toContainEqual(expect.objectContaining({ rule: 'generic-api-key', location: 'response.body' }));
  });

  it('flags a known secret left in the request URL, and says where', () => {
    const har = emptyHar();
    const leaky = { ...req(), url: 'https://api.example.com/v1/status?q=sekret-value-123' };
    har.log.entries.push(toHarEntry(leaky, res('{}'), new Date(), 1));
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({ API_KEY: 'sekret-value-123' }));
    expect(findings).toContainEqual(expect.objectContaining({ rule: 'known-secret-value', location: 'request.url' }));
  });

  it('flags a known secret inside a binary body stored as base64', () => {
    const har = emptyHar();
    const binary = Buffer.concat([Buffer.from([0xff, 0xfe, 0x00]), Buffer.from('sekret-value-123')]);
    har.log.entries.push(
      toHarEntry(req(), { status: 200, statusText: 'OK', headers: {}, body: binary }, new Date(), 1)
    );
    expect(har.log.entries[0].response.content.encoding).toBe('base64');
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({ API_KEY: 'sekret-value-123' }));
    expect(findings).toContainEqual(expect.objectContaining({ rule: 'known-secret-value', location: 'response.body' }));
  });
});

describe('scanHar JWT rule', () => {
  it('flags a bare JWT in a form body, not just a Bearer header', () => {
    const har = emptyHar();
    const jwt = 'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJzYUBwcm9qZWN0In0.c2lnbmF0dXJlLWJ5dGVz';
    const tokenRequest: CapturedRequest = {
      method: 'POST',
      url: 'https://oauth2.googleapis.com/token',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: Buffer.from(`grant_type=jwt-bearer&assertion=${jwt}`),
    };
    har.log.entries.push(toHarEntry(tokenRequest, res('{}'), new Date(), 1));
    const findings = scanHar(har, 'e2e/recordings/api.har', new SecretScrubber({}));
    expect(findings).toContainEqual(expect.objectContaining({ rule: 'jwt', location: 'request.body' }));
  });
});
