export const overrideFeatureToggles = (featureToggles) => {
  const timeout = 5;
  const localStorageKey = 'grafana.featureToggles';

  const waitForGrafanaBootData = (cb) => {
    if (window.grafanaBootData) {
      cb();
    } else {
      setTimeout(() => waitForGrafanaBootData(cb), timeout);
    }
  };

  const versionGte = (version, major, minor) => {
    const [majorVersion, minorVersion] = version.split('.');
    return Number(majorVersion) >= major && Number(minorVersion) >= minor;
  };

  // wait for Grafana boot data to be added to the window object
  waitForGrafanaBootData(() => {
    const version = window?.grafanaBootData?.settings?.buildInfo?.version;

    // since Grafana 10.1.0, Grafana reads feature toggles from localStorage
    if (versionGte(version, 10, 1)) {
      const value = Object.entries(featureToggles)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');
      localStorage.setItem(localStorageKey, value);
    } else {
      // override feature toggles with the ones provided by the test
      window.grafanaBootData.settings.featureToggles = {
        ...window.grafanaBootData.settings.featureToggles,
        ...featureToggles,
      };
    }
  });
};
