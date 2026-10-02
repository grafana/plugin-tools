import { isJsonContentType, leafToString, matchesFieldPattern, parseJsonLossless, visitJson } from './jsonPaths.js';
import type { CapturedRequest, ProxyConfig } from './types.js';

/** Shorter values are too likely to occur by accident elsewhere in a request to substitute safely. */
const MIN_CORRELATED_LENGTH = 8;

/**
 * Carries client-generated identifiers across replayed requests. Some clients make up an ID and
 * send it back later: BigQuery's Go client picks a random job ID for `jobs.insert`, then fetches
 * results from `.../queries/<job ID>`. The first request matches its recording because the ID is
 * in `ignoreFields`, but the follow-up has the ID in its path, which nothing ignores.
 *
 * So whenever a live request matches a recording, each ignored field's live value is paired with
 * the recorded value at the same place, and later live requests have the live values swapped for
 * the recorded ones before matching.
 */
export class Correlator {
  private readonly substitutions = new Map<string, string>();

  /** The live request with every known client-generated value replaced by its recorded counterpart. */
  rewrite(req: CapturedRequest): CapturedRequest {
    if (this.substitutions.size === 0) {
      return req;
    }
    const swap = (text: string): string => {
      let result = text;
      for (const [live, recorded] of this.substitutions) {
        result = result.split(live).join(recorded);
      }
      return result;
    };
    const body = swap(req.body.toString('utf8'));
    return {
      ...req,
      url: swap(req.url),
      headers: Object.fromEntries(Object.entries(req.headers).map(([name, value]) => [name, swap(value)])),
      body: body === req.body.toString('utf8') ? req.body : Buffer.from(body, 'utf8'),
    };
  }

  /** Records live-to-recorded pairs for the ignored fields of a live request that matched `recorded`. */
  learn(live: CapturedRequest, recorded: CapturedRequest, config: ProxyConfig): void {
    const liveValues = ignoredValues(live, config);
    const recordedValues = ignoredValues(recorded, config);
    for (const [location, liveValue] of liveValues) {
      const recordedValue = recordedValues.get(location);
      if (recordedValue && recordedValue !== liveValue && liveValue.length >= MIN_CORRELATED_LENGTH) {
        this.substitutions.set(liveValue, recordedValue);
      }
    }
  }
}

/** Values of the ignored query params, form fields and JSON body fields, keyed by where they sit. */
function ignoredValues(req: CapturedRequest, config: ProxyConfig): Map<string, string> {
  const values = new Map<string, string>();
  const query = new URL(req.url).searchParams;
  for (const name of config.ignoreQueryParams) {
    const value = query.get(name);
    if (value) {
      values.set(`query:${name}`, value);
    }
  }

  const contentType = req.headers['content-type'] ?? '';
  const text = req.body.toString('utf8');
  if (text === '') {
    return values;
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = new URLSearchParams(text);
    for (const name of config.ignoreFields) {
      const value = form.get(name);
      if (value) {
        values.set(`form:${name}`, value);
      }
    }
  } else if (isJsonContentType(contentType)) {
    try {
      visitJson(parseJsonLossless(text), (field, isLeaf) => {
        if (
          isLeaf &&
          field.value !== null &&
          config.ignoreFields.some((p) => matchesFieldPattern(field.patternPath, p))
        ) {
          values.set(`body:${field.path}`, leafToString(field.value));
        }
      });
    } catch {
      // not JSON after all; nothing to correlate
    }
  }
  return values;
}
