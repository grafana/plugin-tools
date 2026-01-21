import { PlaywrightTestArgs, TestFixture } from '@playwright/test';

interface BootData {
  version: string;
  namespace: string;
}

type BootDataFixture = TestFixture<BootData, PlaywrightTestArgs>;

/**
 * Internal fixture that fetches boot data from Grafana.
 * This fixture is not exposed in the test API - it's only used by other fixtures
 * to consolidate boot data fetching to avoid creating multiple temporary pages.
 */
export const bootData: BootDataFixture = async ({ context }, use) => {
  const version = process.env.GRAFANA_VERSION ?? '';
  let namespace = '';

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

    // plugins may override version in CI via env var
    const finalVersion = version || bootDataSettings.version;
    namespace = bootDataSettings.namespace || 'default';

    await use({ version: finalVersion, namespace });
  } catch (error) {
    console.error('@grafana/plugin-e2e: Failed to fetch boot data', error);
    await use({ version: version || '', namespace: 'default' });
  } finally {
    await tempPage.close();
  }
};
