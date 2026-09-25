import type { Har } from './types.js';
import { walkFields, type JsonNode } from './jsonPaths.js';

export interface FieldSummary {
  /** Field-name-only path, e.g. "items[*].author.email". */
  path: string;
  /** A few distinct sample values seen at this path, for a human (or an agent) to eyeball. */
  samples: string[];
}

const MAX_SAMPLES_PER_PATH = 3;

/**
 * Lists every distinct field path found in a HAR's response bodies, with a few sample values
 * each. Meant to be reviewed instead of the raw HAR: a plugin can have thousands of response
 * bytes but only a few dozen distinct field paths.
 */
export function summarizeFields(har: Har): FieldSummary[] {
  const samplesByPath = new Map<string, Set<string>>();

  for (const entry of har.log.entries) {
    const body = entry.response.content.text;
    if (!body || !entry.response.content.mimeType.includes('json')) {
      continue;
    }
    let parsed: JsonNode;
    try {
      parsed = JSON.parse(body);
    } catch {
      continue;
    }
    for (const field of walkFields(parsed)) {
      if (typeof field.value !== 'string' && typeof field.value !== 'number' && typeof field.value !== 'boolean') {
        continue;
      }
      const samples = samplesByPath.get(field.patternPath) ?? new Set<string>();
      if (samples.size < MAX_SAMPLES_PER_PATH) {
        samples.add(String(field.value));
      }
      samplesByPath.set(field.patternPath, samples);
    }
  }

  return [...samplesByPath.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, samples]) => ({ path, samples: [...samples] }));
}
