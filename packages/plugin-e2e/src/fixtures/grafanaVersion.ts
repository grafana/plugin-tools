import { PlaywrightTestArgs, TestFixture } from '@playwright/test';

type GrafanaVersion = TestFixture<string, PlaywrightTestArgs>;

export const grafanaVersion: GrafanaVersion = async ({ context }, use) => {
  let grafanaVersion = process.env.GRAFANA_VERSION ?? '';
  if (!grafanaVersion) {
    // Create a temporary page to fetch the version without depending on the page fixture
    const tempPage = await context.newPage();
    try {
      await tempPage.goto('/');
      grafanaVersion = await tempPage.evaluate('window.grafanaBootData.settings.buildInfo.version');
    } finally {
      await tempPage.close();
    }
  }

  await use(grafanaVersion.replace(/\-.*/, ''));
};
