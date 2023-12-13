const fs = require('fs/promises');
const core = require('@actions/core');
const semver = require('semver');

const DEFAULT_MIN_GRAFANA_VERSION = '8.4.0';

const VersionResolverTypeInput = 'version-resolver-type';
const LastNMinorsInput = 'last-n-minors';
const AllMinorsFromInput = 'all-minors-from';
const MatrixOutput = 'matrix';

const VersionResolverTypes = {
  PluginGrafanaDependency: 'plugin-grafana-dependency',
  AllMinorsFrom: 'all-minors-from',
  LastNMinors: 'last-n-minors',
};

async function run() {
  try {
    let minVersion = DEFAULT_MIN_GRAFANA_VERSION;
    let lastNMinors = 0;

    const versionResolverType = core.getInput(VersionResolverTypeInput) || VersionResolverTypes.PluginGrafanaDependency;
    switch (versionResolverType) {
      case VersionResolverTypes.AllMinorsFrom:
        const providedMinVersion = core.getInput(AllMinorsFromInput);
        if (semver.valid(providedMinVersion)) {
          minVersion = semver.parse(providedMinVersion).version;
        } else {
          core.info(`The provided min-version is not a valid semver version. Using default min version: ${minVersion}`);
        }
        break;
      case VersionResolverTypes.LastNMinors:
        const lastNMinorsString = core.getInput(LastNMinorsInput);
        try {
          lastNMinors = parseInt(lastNMinorsString);
        } catch (error) {
          core.info(`The provided last-n-minors is not a valid number. Using default min version: ${minVersion}`);
        }
        break;
      default:
        try {
          minVersion = await getPluginGrafanaDependency();
        } catch (_) {
          core.info(`Could not find plugin grafanaDependency. Using default min version: ${minVersion}`);
        }
        break;
    }

    const targetGrafanaVersions = await getGrafanaMinorVersions(minVersion);

    if (versionResolverType === VersionResolverTypes.LastNMinors && lastNMinors !== NaN && lastNMinors > 0) {
      targetGrafanaVersions.splice(0, targetGrafanaVersions.length - lastNMinors);
    }
    core.info('output', targetGrafanaVersions);
    core.setOutput(MatrixOutput, JSON.stringify(targetGrafanaVersions));
  } catch (error) {
    core.setFailed(error.message);
  }
}

function getGrafanaMinorVersions(minVersion) {
  return new Promise(async (resolve) => {
    const latestMinorVersions = new Map();

    const response = await fetch('https://grafana.com/api/grafana-enterprise/versions');
    const json = await response.json();
    const grafanaVersions = json.items;

    for (const grafanaVersion of grafanaVersions) {
      // ignore pre-releases
      if (grafanaVersion.channels.stable !== true) {
        continue;
      }
      const v = semver.parse(grafanaVersion.version);

      // ignore versions below the specified minimum Grafana version
      if (semver.lt(v, minVersion)) {
        continue;
      }

      const baseVersion = new semver.SemVer(`${v.major}.${v.minor}.0`).toString();
      if (!latestMinorVersions.has(baseVersion)) {
        latestMinorVersions.set(baseVersion, v);
      }

      const maxVersion = latestMinorVersions.get(baseVersion);
      const cc = maxVersion.compare(v);
      if (cc < 0) {
        latestMinorVersions.set(baseVersion, v);
      }
    }
    return resolve(Array.from(latestMinorVersions).map(([_, value]) => value.version));
  });
}

async function getPluginGrafanaDependency() {
  const file = await fs.readFile('src/plugin.json', 'utf8');
  const json = JSON.parse(file);
  if (!json.dependencies.grafanaDependency) {
    throw new Error('Could not find plugin grafanaDependency');
  }

  return semver.coerce(json.dependencies.grafanaDependency).version;
}

run();
