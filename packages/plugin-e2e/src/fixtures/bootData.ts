import { PlaywrightTestArgs, TestFixture } from '@playwright/test';

interface BootData {
  version: string | undefined;
  namespace: string | undefined;
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
      return {
        version: window.grafanaBootData.settings.buildInfo.version,
        namespace: window.grafanaBootData.settings.namespace,
      };
    });

    await use({
      version: bootDataSettings.version,
      namespace: bootDataSettings.namespace,
    });
  } catch (error) {
    console.error('@grafana/plugin-e2e: Failed to fetch boot data', error);
    // provide undefined values if fetch fails (fixtures will apply their own defaults)
    await use({ version: undefined, namespace: undefined });
  } finally {
    await tempPage.close();
  }
};
