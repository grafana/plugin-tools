import { faro, LogLevel } from '@grafana/faro-web-sdk';
import debounce from 'debounce';
import { removePII, validatePIICompliance } from '@coffeeandfun/remove-pii';
import { RudderStack } from './types';

const SEARCH_SUGGESTIONS_ANCHOR_CLASS = 'ds-dataset-1';
const SEARCH_INPUT_ID = 'search_input_react';
const SEARCH_RESULT_CLASS = 'ds-suggestion';
const SEARCH_TRACKING_DEBOUNCE = 150;
const MAX_SEARCH_LENGTH = 256;
const SOURCE = 'plugin_tools_search';

let observer: MutationObserver | undefined;
let rudderstack: Partial<RudderStack> = {};

function processSearchTerm(str: string): string {
  const stringValue = String(str).trim();
  const truncated =
    stringValue.length > MAX_SEARCH_LENGTH ? `${stringValue.substring(0, MAX_SEARCH_LENGTH)} - TRUNCATED` : stringValue;
  const sanitized = truncated
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');

  const compliance = validatePIICompliance(sanitized);
  const redacted = compliance.isCompliant ? sanitized : removePII(sanitized);

  if (!compliance.isCompliant) {
    faro?.api?.pushLog([`PII detected: ${compliance.violationCount} violations`], {
      level: LogLevel.INFO,
      context: { source: SOURCE },
    });
  }

  return redacted;
}

function trackSearch() {
  const searchInput = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement;
  if (!searchInput) {
    faro?.api?.pushLog([`Search input element not found`], {
      level: LogLevel.INFO,
      context: { source: SOURCE },
    });
    return;
  }

  if (!searchInput.value) {
    return;
  }

  const searchTerm = processSearchTerm(searchInput.value);
  const searchResultCount = document.getElementsByClassName(SEARCH_RESULT_CLASS).length;

  console.log(SOURCE, { searchTerm, searchResultCount });
  rudderstack.track(SOURCE, { searchTerm, searchResultCount });
}

function mutationObserverCallback(mutationList: MutationRecord[]) {
  for (const mutation of mutationList) {
    if (mutation.type === 'childList' && mutation.addedNodes?.length) {
      debounced();
    }
  }
}

const debounced = debounce(trackSearch, SEARCH_TRACKING_DEBOUNCE);

export function initSearchTracking(rudder: Partial<RudderStack>, retries = 0) {
  if (observer) {
    return;
  }

  const searchSuggestionsAnchors = document.getElementsByClassName(SEARCH_SUGGESTIONS_ANCHOR_CLASS);
  if (!searchSuggestionsAnchors.length) {
    if (retries < 3) {
      setTimeout(() => initSearchTracking(rudder, ++retries), 1000);
      return;
    }

    faro?.api?.pushLog([`Search suggestions anchor element not found, search tracking wont work`], {
      level: LogLevel.INFO,
      context: { source: SOURCE },
    });
    return;
  }

  rudderstack = rudder;
  const targetNode = searchSuggestionsAnchors[0];
  const config = { childList: true };
  observer = new MutationObserver(mutationObserverCallback);
  observer.observe(targetNode, config);
}
