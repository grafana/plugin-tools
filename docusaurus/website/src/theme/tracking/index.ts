import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { debounce } from 'debounce';

declare global {
  interface Window {
    rudderanalytics: any;
  }
}

let rudderId;

export function getRudderId() {
  return rudderId;
}

const isRudderstackSetup = (config: RudderStackTrackingConfig) =>
  config && config.writeKey && config.url && config.sdkUrl;

export const isFaroSetup = (config: FaroConfig) =>
  config && config.url && config.appName && config.environment && config.version;

// Enqueue all rudderstack requests until it is loaded and consent is granted
let rudderstack = {};
let rudderQueue = [];
const rudderMethods = ['page', 'track', 'identify', 'reset'];
for (const method of rudderMethods) {
  rudderstack[method] = (...args) => {
    rudderQueue.push([method].concat(args));
  };
}

export type FaroConfig = {
  url: string;
  appName: string;
  environment: string;
  version: string;
};

export type RudderStackTrackingConfig = {
  url: string;
  writeKey: string;
  configUrl: string;
  sdkUrl: string;
};

export function startTracking(
  rudderStackConfig: RudderStackTrackingConfig,
  faroConfig: FaroConfig,
  shouldTrack: boolean
) {
  if (shouldTrack) {
    if (isRudderstackSetup(rudderStackConfig)) {
      const { writeKey, url, configUrl } = rudderStackConfig;

      const initRudderstack = async () => {
        rudderId = await window.rudderanalytics.getAnonymousId();

        window.rudderanalytics.load(writeKey, url, { configUrl });
        rudderstack = window.rudderanalytics;

        // send any queued requests
        for (const [method, ...args] of rudderQueue) {
          rudderstack[method](...args);
        }
        // clean up afterwards so trackPage
        rudderQueue = undefined;
        initSearchTracking();
      };

      const el = document.createElement('script');
      el.async = true;
      el.src = rudderStackConfig.sdkUrl;
      el.onload = initRudderstack;
      document.getElementsByTagName('head')[0].appendChild(el);
    }
    if (isFaroSetup(faroConfig)) {
      initializeFaro({
        url: faroConfig.url,
        app: {
          name: faroConfig.appName,
          version: faroConfig.version,
          environment: faroConfig.environment,
        },
        instrumentations: [...getWebInstrumentations()],
      });
    }
  }
}

export function trackPage() {
  // rudderstack automagically accesses all this but if it isn't loaded we need to
  // define it manually.
  if (rudderQueue) {
    const { href, pathname } = location;
    const url = Boolean(document.querySelector("link[rel='canonical']"))
      ? document.querySelector("link[rel='canonical']").getAttribute('href')
      : href;
    const properties = {
      url,
      path: pathname,
      referrer: document.referrer || '$direct',
      title: document.title,
      tab_url: href,
    };
    // @ts-ignore we don't have the types.
    rudderstack.page(properties);
  } else {
    // @ts-ignore we don't have the types.
    rudderstack.page();
  }
}

function trackSearch(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input?.value) {
    return;
  }

  const searchResults = document.getElementsByClassName('algolia-docsearch-suggestion');

  console.log('plugin_tools_search', { searchTerm: input.value, searchResultCount: searchResults.length });
  // @ts-expect-error we don't have the types.
  rudderstack.track('plugin_tools_search', { searchTerm: input.value, searchResultCount: searchResults.length });
}

const debounced = debounce(trackSearch, 100, true);

export function initSearchTracking() {
  const searchInput = document.getElementById('search_input_react');
  if (!searchInput) {
    return;
  }

  searchInput.removeEventListener('input', debounced);
  searchInput.addEventListener('input', debounced);
}
