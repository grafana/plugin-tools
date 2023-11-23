import { TestFixture, Page } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { PlaywrightCombinedArgs } from './types';

type PageFixture = TestFixture<Page, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

const page: PageFixture = async ({ page, featureToggles }, use) => {
  if (Object.keys(featureToggles).length > 0) {
    try {
      await page.addInitScript((featureToggles) => {
        // @ts-ignore
        let waitForGrafanaBootData = function (cb) {
          // @ts-ignore
          if (window.grafanaBootData) {
            cb();
          } else {
            setTimeout(function () {
              waitForGrafanaBootData(cb);
            }, 10);
          }
        };

        waitForGrafanaBootData(function () {
          // @ts-ignore
          window.grafanaBootData.settings.featureToggles = {
            // @ts-ignore
            ...window.grafanaBootData.settings.featureToggles,
            ...featureToggles,
          };
        });
      }, featureToggles);
    } catch (error) {
      console.error('Failed to set feature toggles', error);
    }
  }
  await use(page);
};

export default page;
