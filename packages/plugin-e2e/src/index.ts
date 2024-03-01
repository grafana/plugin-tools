import { GrafanaPage, VariableEditPage } from './models';
import { AlertPageOptions, AlertVariant, ContainTextOptions } from './types';

export { expect, test, type PluginFixture, type PluginOptions } from './api';
export * from './e2e-selectors';
export * from './fixtures';
export * from './models';
export * from './types';

declare global {
  interface Window {
    monaco: any;
    grafanaBootData: {
      settings: {
        featureToggles: Record<string, boolean>;
      };
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    const r: unique symbol;
    const t: unique symbol;
    interface Matchers<R, T> {
      [r]: R;
      [t]: T;

      /**
       * Await the response of a Playwright request and asserts the response was successful (status in the range 200-299).
       */
      toBeOK(this: Matchers<unknown, Promise<Response>>): R;

      /**
       * Asserts that preview text elements are displayed on the Variable Edit Page. You should make sure any variable queries are completed before calling this matcher.
       */
      toDisplayPreviews(
        this: Matchers<unknown, VariableEditPage>,
        previewTexts: Array<string | RegExp>,
        options: ContainTextOptions
      ): R;

      /**
       * Asserts that a GrafanaPage contains an alert with the specified severity. Use the options to specify the timeout and to filter the alerts.
       */
      toHaveAlert(this: Matchers<unknown, GrafanaPage>, severity: AlertVariant, options?: AlertPageOptions): R;
    }
  }
}
