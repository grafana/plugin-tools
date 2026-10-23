import { harEntryToCaptured, toHarEntry } from './har.js';
import { sanitizeForRecording } from './pipeline.js';
import { FakeValueStore, SecretScrubber } from './redact.js';
import type { Har, ProxyConfig } from './types.js';

/**
 * Re-runs the sanitize pipeline over an already-recorded HAR, with the current config.
 * Used to apply a new `redactFields`/`fakeFields` rule to old recordings, without re-recording
 * against the real API. Timing fields are preserved; only headers and bodies change.
 */
export function redactExistingHar(har: Har, config: ProxyConfig, knownSecrets: Record<string, string>): Har {
  const scrubber = new SecretScrubber(knownSecrets);
  const fakeStore = new FakeValueStore();
  const scrubCounts: Record<string, number> = {};

  const entries = har.log.entries.map((entry) => {
    const { req, res } = harEntryToCaptured(entry);
    const sanitized = sanitizeForRecording(req, res, config, scrubber, fakeStore, scrubCounts);
    return toHarEntry(sanitized.req, sanitized.res, new Date(entry.startedDateTime), entry.time);
  });

  return { ...har, log: { ...har.log, entries } };
}
