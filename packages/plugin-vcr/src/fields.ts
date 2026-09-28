import type { Har } from './types.js';
import { isJsonContentType, leafToString, parseJsonLossless, walkFields, type JsonNode } from './jsonPaths.js';

export interface FieldSummary {
  /** Pattern path, e.g. "items[*].author.email". Can be pasted into redactFields or fakeFields as-is. */
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
    const { content } = entry.response;
    if (!content.text || content.encoding === 'base64' || !isJsonContentType(content.mimeType)) {
      continue;
    }
    let parsed: JsonNode;
    try {
      parsed = parseJsonLossless(content.text);
    } catch {
      continue;
    }
    for (const field of walkFields(parsed)) {
      if (field.value === null) {
        continue;
      }
      const samples = samplesByPath.get(field.patternPath) ?? new Set<string>();
      if (samples.size < MAX_SAMPLES_PER_PATH) {
        samples.add(leafToString(field.value));
      }
      samplesByPath.set(field.patternPath, samples);
    }
  }

  return [...samplesByPath.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, samples]) => ({ path, samples: [...samples] }));
}
