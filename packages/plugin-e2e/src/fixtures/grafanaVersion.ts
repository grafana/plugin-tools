import { TestFixture } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { PlaywrightCombinedArgs } from './types';

type GrafanaVersion = TestFixture<string, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const grafanaVersion: GrafanaVersion = async ({ page }, use) => {
  let grafanaVersion = process.env.GRAFANA_VERSION;
  if (!grafanaVersion) {
    await page.goto('/');
    grafanaVersion = await page.evaluate('window.grafanaBootData.settings.buildInfo.version');
  }

  await use(grafanaVersion.replace(/\-.*/, ''));
};

export default grafanaVersion;
