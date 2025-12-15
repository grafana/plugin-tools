import { LogLevel } from '@grafana/faro-web-sdk';
import lunarSearch from '@theme-original/SearchBar/lunar-search';
import debounce from 'debounce';
import { removePII, validatePIICompliance } from '@coffeeandfun/remove-pii';
import { RudderStack } from './types';
import { log } from './logger';
import { SEARCH_TRACKING_DEBOUNCE, SEARCH_TRACKING_MAX_LENGTH, SEARCH_TRACKING_SOURCE } from './constants';

let trackFn: RudderStack['track'] | undefined;
const originalSearch = lunarSearch.prototype.search;

// exported for test reasons
export function processSearchTerm(str: string): string {
  const stringValue = String(str).trim();
  const truncated =
    stringValue.length > SEARCH_TRACKING_MAX_LENGTH
      ? stringValue.substring(0, SEARCH_TRACKING_MAX_LENGTH)
      : stringValue;

  const compliance = validatePIICompliance(truncated);
  const redacted = compliance.isCompliant ? truncated : removePII(truncated);

  if (!compliance.isCompliant) {
    log(`PII detected: ${compliance.violationCount} violations`, LogLevel.WARN);
  }

  const sanitized = redacted
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');

  return sanitized;
}

// exported for test reasons
export function trackSearch(input: string, searchResultCount: number) {
  if (!trackFn) {
    log('RudderStack not initialized, skipping search tracking', LogLevel.WARN);
    return;
  }

  const searchTerm = processSearchTerm(input);
  trackFn(SEARCH_TRACKING_SOURCE, { searchTerm, searchResultCount });
}

const debounced = debounce(trackSearch, SEARCH_TRACKING_DEBOUNCE);

async function searchWithTracking(input: string) {
  try {
    const searchResults = await originalSearch.call(this, input);
    const searchResultCount = searchResults.length;
    debounced(input, searchResultCount);
    return searchResults;
  } catch (error) {
    log(`Search with tracking failed: ${error instanceof Error ? error.message : String(error)}`, LogLevel.ERROR);
    throw error;
  }
}

export function initSearchTracking(rudder: Partial<RudderStack>) {
  if (trackFn) {
    log('Search tracking already initialized', LogLevel.WARN);
    return;
  }

  if (!rudder?.track) {
    log('RudderStack not initialized, skipping search tracking', LogLevel.WARN);
    return;
  }

  trackFn = rudder.track.bind(rudder);
  lunarSearch.prototype.search = searchWithTracking;
  log('Search tracking initialized successfully', LogLevel.INFO);
}

export function setTrackFn(track: RudderStack['track'] | undefined = undefined) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Do not call setTrackFn outside of tests');
  }

  trackFn = track;
}
