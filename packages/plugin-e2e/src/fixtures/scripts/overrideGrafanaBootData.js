// this script is evaluated in the browser context, so we cannot use typescript
export const overrideGrafanaBootData = ({ featureToggles, userPreferences }) => {
  const timeout = 1;
  const waitForGrafanaBootData = (cb) => {
    if (window?.grafanaBootData?.user) {
      cb();
    } else {
      setTimeout(() => waitForGrafanaBootData(cb), timeout);
    }
  };

  // wait for Grafana boot data to be added to the window object
  waitForGrafanaBootData(() => {
    if (Object.keys(featureToggles).length > 0) {
      console.log('@grafana/plugin-e2e: setting the following feature toggles', featureToggles);

      // override feature toggles with the ones provided by the test
      window.grafanaBootData.settings.featureToggles = {
        ...window.grafanaBootData.settings.featureToggles,
        ...featureToggles,
      };
    }
    if (Object.keys(userPreferences).length > 0) {
      console.log('@grafana/plugin-e2e: setting the following user preferences', userPreferences);
      window.grafanaBootData.user = {
        ...window.grafanaBootData.user,
        ...userPreferences,
      };
    }
  });
};
