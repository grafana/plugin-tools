const core = require('@actions/core');
const { context } = require('@actions/github');

function run() {
  try {
    const pr = context.payload.pull_request || {};
    const labels = pr.labels || [];
    const labelNames = labels.map((label) => label.name);

    const requiredOneOfLabels = ['patch', 'minor', 'major', 'skip-changelog'];

    const hasSemverLabel = labelNames.filter((label) => requiredOneOfLabels.includes(label));
    const hasReleaseLabel = labelNames.includes('release');

    if (hasSemverLabel.length === 0) {
      core.setFailed('PR is missing one of the following labels: `patch`, `minor`, `major`, `skip-changelog`');
    }

    if (hasSemverLabel.length > 1) {
      core.setFailed(
        'PR contains multiple semver labels. A PR can only include one of: `patch`, `minor`, `major`, `skip-changelog` labels.'
      );
    }

    if (hasSemverLabel.length === 1 && !hasReleaseLabel) {
      core.setOutput(
        'PR has required semver label but missing `release` label. This PR can be merged but will not publish a release.'
      );
    }

    core.setOutput('PR will create a new `${hasSemverLabel}` release.');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
