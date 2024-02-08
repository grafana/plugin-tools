// this script is evaluated in the browser context, so we cannot use typescript
export const overrideFeatureToggles = (featureToggles) => {
  const timeout = 1;
  const waitForGrafanaBootData = (cb) => {
    if (window?.grafanaBootData?.settings?.featureToggles) {
      cb();
    } else {
      setTimeout(() => waitForGrafanaBootData(cb), timeout);
    }
  };

  // wait for Grafana boot data to be added to the window object
  waitForGrafanaBootData(() => {
    console.log('@grafana/plugin-e2e: setting the following feature toggles', featureToggles);

    // override feature toggles with the ones provided by the test
    window.grafanaBootData.settings.featureToggles = {
      ...window.grafanaBootData.settings.featureToggles,
      ...featureToggles,
    };
  });
};
