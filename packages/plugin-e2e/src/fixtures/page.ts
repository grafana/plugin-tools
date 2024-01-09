import { TestFixture, Page } from '@playwright/test';
import { PluginFixture, PluginOptions } from '../api';
import { PlaywrightCombinedArgs } from './types';

type PageFixture = TestFixture<Page, PluginFixture & PluginOptions & PlaywrightCombinedArgs>;

/**
 * This fixture overrides feature toggles defined in window.grafanaBootData
 * with the ones provided by the test.
 *
 * page.addInitScript adds a script which would be evaluated in one of the following scenarios:
 * - Whenever the page is navigated.
 * - Whenever the child frame is attached or navigated. In this case, the script is evaluated in the context of the
 *   newly attached frame.
 * The script is evaluated after the document was created but before any of its scripts were run.
 */
const page: PageFixture = async ({ page, featureToggles }, use) => {
  if (Object.keys(featureToggles).length > 0) {
    try {
      await page.addInitScript((featureToggles) => {
        // @ts-ignore
        let waitForGrafanaBootData = function (cb) {
          if (window.grafanaBootData) {
            cb();
          } else {
            setTimeout(function () {
              waitForGrafanaBootData(cb);
            }, 10);
          }
        };

        // wait for grafana boot data to be available
        waitForGrafanaBootData(function () {
          // override feature toggles with the ones provided by the test
          window.grafanaBootData.settings.featureToggles = {
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
