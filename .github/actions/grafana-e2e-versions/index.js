const fs = require('fs/promises');
const core = require('@actions/core');
const semver = require('semver');

const VersionResolverTypeInput = 'version-resolver-type';
const MatrixOutput = 'matrix';

const VersionResolverTypes = {
  PluginGrafanaDependency: 'plugin-grafana-dependency',
  VersionSupportPolicy: 'version-support-policy',
};

async function run() {
  try {
    let versionResolverType = core.getInput(VersionResolverTypeInput) || VersionResolverTypes.PluginGrafanaDependency;
    const availableGrafanaVersions = await getGrafanaStableMinorVersions();
    if (availableGrafanaVersions.length === 0) {
      core.setFailed('Could not find any stable Grafana versions');
      return;
    }

    let output = [];
    switch (versionResolverType) {
      case VersionResolverTypes.VersionSupportPolicy:
        const currentMajorVersion = availableGrafanaVersions[0].major;
        const previousMajorVersion = currentMajorVersion - 1;

        for (const grafanaVersion of availableGrafanaVersions) {
          if (previousMajorVersion > grafanaVersion.major) {
            break;
          }

          if (currentMajorVersion === grafanaVersion.major) {
            output.push(grafanaVersion.version);
          }

          if (previousMajorVersion === grafanaVersion.major) {
            output.push(grafanaVersion.version);
            break;
          }
        }
        break;
      default:
        const pluginDependency = await getPluginGrafanaDependency();
        for (const grafanaVersion of availableGrafanaVersions) {
          if (semver.gt(pluginDependency, grafanaVersion.version)) {
            break;
          }

          output.push(grafanaVersion.version);
        }
    }

    core.info('output', output);
    core.setOutput(MatrixOutput, JSON.stringify(output));
  } catch (error) {
    core.setFailed(error.message);
  }
}

function getGrafanaStableMinorVersions() {
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

    return resolve(Array.from(latestMinorVersions).map(([_, semver]) => semver));
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
