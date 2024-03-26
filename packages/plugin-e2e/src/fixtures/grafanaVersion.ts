import { PlaywrightTestArgs, TestFixture } from '@playwright/test';

type GrafanaVersion = TestFixture<string, PlaywrightTestArgs>;

export const grafanaVersion: GrafanaVersion = async ({ page }, use) => {
  let grafanaVersion = process.env.GRAFANA_VERSION ?? '';
  if (!grafanaVersion) {
    await page.goto('/');
    grafanaVersion = await page.evaluate('window.grafanaBootData.settings.buildInfo.version');
  }

  await use(grafanaVersion.replace(/\-.*/, ''));
};
