import { PlaywrightTestArgs, TestFixture } from '@playwright/test';

interface BootData {
  version: string | undefined;
  namespace: string | undefined;
  // absolute URL where this instance serves the data-only e2e-selectors file, derived from the asset
  // base (origin in single-binary, CDN in multi-tenant). undefined when it can't be derived.
  selectorsUrl: string | undefined;
}

type BootDataFixture = TestFixture<BootData, PlaywrightTestArgs>;

/**
 * Internal fixture that fetches boot data from Grafana.
 * This fixture is not exposed in the test API - it's only used by other fixtures
 * to consolidate boot data fetching to avoid creating multiple temporary pages.
 */
export const bootData: BootDataFixture = async ({ context }, use) => {
  // creates a temporary page to avoid circular dependencies between fixtures
  const tempPage = await context.newPage();
  try {
    await tempPage.goto('/');
    const bootDataSettings = await tempPage.evaluate(() => {
      // e2e-selectors.json is emitted into the frontend build output next to the JS bundles, so its
      // URL is the bundle directory with the filename swapped. resolving against document.baseURI
      // yields an absolute URL for both single-binary (origin-relative bundles) and multi-tenant
      // (CDN-absolute bundles).
      const jsFilePath = window.grafanaBootData?.assets?.jsFiles?.[0]?.filePath;
      const selectorsUrl = jsFilePath
        ? new URL(jsFilePath.replace(/[^/]+$/, 'e2e-selectors.json'), document.baseURI).href
        : undefined;
      return {
        version: window.grafanaBootData.settings.buildInfo.version,
        namespace: window.grafanaBootData.settings.namespace,
        selectorsUrl,
      };
    });

    await use({
      version: bootDataSettings.version,
      namespace: bootDataSettings.namespace,
      selectorsUrl: bootDataSettings.selectorsUrl,
    });
  } catch (error) {
    console.error('@grafana/plugin-e2e: Failed to fetch boot data', error);
    // provide undefined values if fetch fails (fixtures will apply their own defaults)
    await use({ version: undefined, namespace: undefined, selectorsUrl: undefined });
  } finally {
    await tempPage.close();
  }
};
