// this script is evaluated in the browser context, so we cannot use typescript
export const overrideFeatureToggles = (featureToggles) => {
  const timeout = 5;

  const waitForGrafanaBootData = (cb) => {
    if (window.grafanaBootData) {
      cb();
    } else {
      setTimeout(() => waitForGrafanaBootData(cb), timeout);
    }
  };

  // wait for Grafana boot data to be added to the window object
  waitForGrafanaBootData(() => {
    const version = window?.grafanaBootData?.settings?.buildInfo?.version;

    // override feature toggles with the ones provided by the test
    window.grafanaBootData.settings.featureToggles = {
      ...window.grafanaBootData.settings.featureToggles,
      ...featureToggles,
    };
  });
};
