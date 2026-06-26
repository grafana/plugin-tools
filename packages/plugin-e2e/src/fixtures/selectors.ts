import { APIRequestContext, TestFixture } from '@playwright/test';
import {
  resolveSelectors,
  versionedComponents as bundledVersionedComponents,
  versionedPages as bundledVersionedPages,
} from '@grafana/e2e-selectors';
import { E2ESelectorGroups, PlaywrightArgs } from '../types';
import { versionedConstants } from '../selectors/versionedConstants';
import { versionedAPIs } from '../selectors/versionedAPIs';

type SelectorFixture = TestFixture<E2ESelectorGroups, PlaywrightArgs>;

// served by grafana/grafana from the @grafana/e2e-selectors build (see PLUGIN_E2E_RUNTIME_SELECTORS)
const SELECTORS_URL = '/public/e2e-selectors.js';

// only the components/pages data comes from Grafana; constants/apis are plugin-e2e's own
type RuntimeSelectors = {
  versionedComponents: typeof bundledVersionedComponents;
  versionedPages: typeof bundledVersionedPages;
};

// per-worker cache keyed by grafanaVersion so concurrent fixtures share one in-flight fetch
const selectorsCache = new Map<string, Promise<E2ESelectorGroups>>();

// evaluate the fetched CJS bundle with a require shim that allows only 'semver'
function evaluateBundle(src: string): RuntimeSelectors {
  const shimRequire = (id: string) => {
    if (id !== 'semver') {
      throw new Error(`@grafana/plugin-e2e: disallowed require('${id}') in e2e-selectors bundle`);
    }
    return require('semver');
  };
  const module: { exports: Partial<RuntimeSelectors> } = { exports: {} };
  new Function('require', 'module', 'exports', src)(shimRequire, module, module.exports);

  const { versionedComponents, versionedPages } = module.exports;
  if (!versionedComponents || !versionedPages) {
    throw new Error('@grafana/plugin-e2e: e2e-selectors bundle is missing expected exports');
  }
  return { versionedComponents, versionedPages };
}

function buildGroups(runtime: RuntimeSelectors, grafanaVersion: string): E2ESelectorGroups {
  return {
    components: resolveSelectors(runtime.versionedComponents, grafanaVersion),
    pages: resolveSelectors(runtime.versionedPages, grafanaVersion),
    constants: resolveSelectors(versionedConstants, grafanaVersion),
    apis: resolveSelectors(versionedAPIs, grafanaVersion),
  };
}

// fall back to the selectors bundled with the installed @grafana/plugin-e2e release
function bundledGroups(grafanaVersion: string): E2ESelectorGroups {
  return buildGroups(
    { versionedComponents: bundledVersionedComponents, versionedPages: bundledVersionedPages },
    grafanaVersion
  );
}

async function fetchRuntimeSelectors(request: APIRequestContext, grafanaVersion: string): Promise<E2ESelectorGroups> {
  let response;
  try {
    response = await request.get(SELECTORS_URL);
  } catch (error) {
    console.warn(
      `@grafana/plugin-e2e: failed to fetch ${SELECTORS_URL}, falling back to bundled @grafana/e2e-selectors.`,
      error
    );
    return bundledGroups(grafanaVersion);
  }

  // 404 -> Grafana predates the feature; expected on older images, fall back quietly
  if (response.status() === 404) {
    return bundledGroups(grafanaVersion);
  }

  // any other non-OK status (5xx etc.) -> loud fallback
  if (!response.ok()) {
    console.warn(
      `@grafana/plugin-e2e: ${SELECTORS_URL} returned ${response.status()}, falling back to bundled @grafana/e2e-selectors.`
    );
    return bundledGroups(grafanaVersion);
  }

  try {
    const src = await response.text();
    return buildGroups(evaluateBundle(src), grafanaVersion);
  } catch (error) {
    console.warn(
      `@grafana/plugin-e2e: failed to evaluate ${SELECTORS_URL}, falling back to bundled @grafana/e2e-selectors.`,
      error
    );
    return bundledGroups(grafanaVersion);
  }
}

export const selectors: SelectorFixture = async ({ grafanaVersion, request }, use) => {
  // opt-in during the trial period; when off, behave exactly as before (bundled dependency)
  if (process.env.PLUGIN_E2E_RUNTIME_SELECTORS !== 'true') {
    await use(bundledGroups(grafanaVersion));
    return;
  }

  let groups = selectorsCache.get(grafanaVersion);
  if (!groups) {
    groups = fetchRuntimeSelectors(request, grafanaVersion);
    selectorsCache.set(grafanaVersion, groups);
  }
  await use(await groups);
};
