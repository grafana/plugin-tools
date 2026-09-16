import { APIRequestContext, TestFixture } from '@playwright/test';
import { gte, valid } from 'semver';
import {
  resolveSelectors,
  versionedComponents as bundledVersionedComponents,
  versionedPages as bundledVersionedPages,
} from '@grafana/e2e-selectors';
import { E2ESelectorGroups, PlaywrightArgs } from '../types';
import { versionedConstants } from '../selectors/versionedConstants';
import { versionedAPIs } from '../selectors/versionedAPIs';
import { reconstructSelectorTree } from '../selectors/reconstruct';

type SelectorFixture = TestFixture<E2ESelectorGroups, PlaywrightArgs>;

type VersionedComponents = typeof bundledVersionedComponents;
type VersionedPages = typeof bundledVersionedPages;

// per-worker cache keyed by grafanaVersion so concurrent fixtures share one in-flight fetch
const selectorsCache = new Map<string, Promise<E2ESelectorGroups>>();

// escape hatch: set to 'false' to force the selectors bundled with the installed release
function runtimeSelectorsEnabled(): boolean {
  return process.env.PLUGIN_E2E_RUNTIME_SELECTORS !== 'false';
}

// first Grafana release that emits e2e-selectors.json, so a missing file below this is expected
const RUNTIME_SELECTORS_MIN_VERSION = '13.3.0';

function supportsRuntimeSelectors(grafanaVersion: string): boolean {
  return valid(grafanaVersion) !== null && gte(grafanaVersion, RUNTIME_SELECTORS_MIN_VERSION);
}

function buildGroups(
  components: VersionedComponents,
  pages: VersionedPages,
  grafanaVersion: string
): E2ESelectorGroups {
  return {
    components: resolveSelectors(components, grafanaVersion),
    pages: resolveSelectors(pages, grafanaVersion),
    constants: resolveSelectors(versionedConstants, grafanaVersion),
    apis: resolveSelectors(versionedAPIs, grafanaVersion),
  };
}

// fall back to the selectors bundled with the installed @grafana/plugin-e2e release
function bundledGroups(grafanaVersion: string): E2ESelectorGroups {
  return buildGroups(bundledVersionedComponents, bundledVersionedPages, grafanaVersion);
}

async function fetchRuntimeGroups(
  request: APIRequestContext,
  selectorsUrl: string | undefined,
  grafanaVersion: string
): Promise<E2ESelectorGroups> {
  if (!selectorsUrl) {
    if (supportsRuntimeSelectors(grafanaVersion)) {
      console.error(
        `@grafana/plugin-e2e: could not derive the runtime selectors URL from bootData on Grafana ${grafanaVersion}, falling back to bundled selectors.`
      );
    }
    return bundledGroups(grafanaVersion);
  }

  let response;
  try {
    response = await request.get(selectorsUrl, { maxRedirects: 0 });
  } catch (error) {
    // a fetch error on a Grafana that should serve the file is unexpected, so make it loud
    console.error(
      `@grafana/plugin-e2e: could not fetch runtime selectors from ${selectorsUrl}, falling back to bundled selectors.`,
      error
    );
    return bundledGroups(grafanaVersion);
  }

  // quiet on older Grafana, loud on a version that should serve it
  if (response.status() === 404) {
    if (supportsRuntimeSelectors(grafanaVersion)) {
      console.error(
        `@grafana/plugin-e2e: ${selectorsUrl} returned 404 on Grafana ${grafanaVersion}, which should serve it, falling back to bundled selectors.`
      );
    }
    return bundledGroups(grafanaVersion);
  }

  if (!response.ok()) {
    console.error(
      `@grafana/plugin-e2e: runtime selectors at ${selectorsUrl} returned ${response.status()}, falling back to bundled selectors.`
    );
    return bundledGroups(grafanaVersion);
  }

  try {
    const data = JSON.parse(await response.text()) as {
      schemaVersion?: unknown;
      versionedComponents?: unknown;
      versionedPages?: unknown;
    };
    if (
      data?.schemaVersion !== 1 ||
      typeof data.versionedComponents !== 'object' ||
      typeof data.versionedPages !== 'object'
    ) {
      throw new Error('unexpected e2e-selectors schema');
    }
    const components = reconstructSelectorTree(data.versionedComponents) as VersionedComponents;
    const pages = reconstructSelectorTree(data.versionedPages) as VersionedPages;
    return buildGroups(components, pages, grafanaVersion);
  } catch (error) {
    // reachable but unreadable (bad schema, malformed JSON) is a real problem, so make it loud
    console.error(
      `@grafana/plugin-e2e: could not read runtime selectors from ${selectorsUrl}, falling back to bundled selectors.`,
      error
    );
    return bundledGroups(grafanaVersion);
  }
}

export const selectors: SelectorFixture = async ({ grafanaVersion, bootData, request }, use) => {
  if (!runtimeSelectorsEnabled()) {
    await use(bundledGroups(grafanaVersion));
    return;
  }

  // use the runtime selectors served by the Grafana under test when available, otherwise fall back
  // to the selectors bundled with the installed release
  let groups = selectorsCache.get(grafanaVersion);
  if (!groups) {
    groups = fetchRuntimeGroups(request, bootData.selectorsUrl, grafanaVersion);
    selectorsCache.set(grafanaVersion, groups);
  }
  await use(await groups);
};
