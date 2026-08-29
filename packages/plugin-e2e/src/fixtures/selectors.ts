import { APIRequestContext, TestFixture } from '@playwright/test';
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

// opt-in toggle while the runtime path is validated in plugin-tools' own Playwright workflows. when
// unset, the fixture uses the bundled selectors as before. remove once runtime selectors ship to all
// consumers.
function runtimeSelectorsEnabled(): boolean {
  return process.env.PLUGIN_E2E_RUNTIME_SELECTORS === 'true';
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
  // couldn't derive where the instance serves the file (older Grafana, or assets missing) -> bundled
  if (!selectorsUrl) {
    return bundledGroups(grafanaVersion);
  }

  let response;
  try {
    response = await request.get(selectorsUrl, { maxRedirects: 0 });
  } catch (error) {
    console.warn(`@grafana/plugin-e2e: failed to fetch ${selectorsUrl}, falling back to bundled selectors.`, error);
    return bundledGroups(grafanaVersion);
  }

  // 404 -> Grafana predates the feature; expected on older images, fall back quietly
  if (response.status() === 404) {
    return bundledGroups(grafanaVersion);
  }

  if (!response.ok()) {
    console.warn(
      `@grafana/plugin-e2e: ${selectorsUrl} returned ${response.status()}, falling back to bundled selectors.`
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
    console.warn(`@grafana/plugin-e2e: failed to read ${selectorsUrl}, falling back to bundled selectors.`, error);
    return bundledGroups(grafanaVersion);
  }
}

export const selectors: SelectorFixture = async ({ grafanaVersion, bootData, request }, use) => {
  // until the runtime path is rolled out, only fetch when explicitly enabled; otherwise use the
  // selectors bundled with the installed release
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
